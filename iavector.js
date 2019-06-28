// Copyright Rod Vagg; Licensed under the Apache License, Version 2.0, see README.md for more information

async function create (store, width = 32) {
  let newNode = new IAVector(store, width)
  return save(store, newNode)
}

class IAVector {
  constructor (store, width, height = 0, data = []) {
    if (!store || typeof store.save !== 'function' ||
        typeof store.load !== 'function' ||
        typeof store.isEqual !== 'function') {
      throw new TypeError('Invalid `store` parameter, must be of type: { save(node):id, load(id):node, isEqual(id,id):boolean }')
    }
    ro(this, 'store', store)

    if (typeof width !== 'number' || !Number.isInteger(width) || width <= 1) {
      throw new TypeError('Invalid `width` parameter, must be an integer greater than 1')
    }
    ro(this, 'width', width)

    if (typeof height !== 'number' || !Number.isInteger(height)) {
      throw new TypeError('Invalid `height` parameter, must be an integer')
    }
    ro(this, 'height', height)

    if (!Array.isArray(data)) {
      throw new TypeError('Invalid `data` parameter, must be an array')
    }
    ro(this, 'data', data)

    this.id = null
  }

  async get (index) {
    if (index < 0) {
      return undefined
    }

    let thisMax = this.width ** (this.height + 1) // TODO: cache this?
    if (index > thisMax) {
      return undefined
    }

    let children = this.width ** this.height // TODO: cache this?
    let thisIndex = Math.floor(index / children)
    if (thisIndex >= this.data.length) {
      return undefined
    }

    if (this.height === 0) {
      return this.data[thisIndex]
    }

    let nextHeightIndex = index % children
    // recursive
    return (await load(this.store, this.data[thisIndex], this.width, this.height - 1)).get(nextHeightIndex)
  }

  async push (value) {
    // TODO: cache this
    let tailChain = await this._getTailChain()
    let tail
    let node = this
    // this will flip to true if we reach a point in the chain that has space to append
    // otherwise it will stay false, meaning we made a new right-child at each level and need to
    // overflow at the top level
    let mutatedExisting = false
    while ((tail = tailChain.pop())) {
      if (mutatedExisting || tail.data.length < this.width) {
        // mutate
        let newData = tail.height === 0 || !mutatedExisting ? tail.data.slice() : tail.data.slice(0, -1)
        newData.push(tail.height === 0 ? value : node.id)
        node = await save(this.store, new IAVector(this.store, this.width, tail.height, newData))
        mutatedExisting = true
      } else {
        // overflow
        node = await save(this.store, new IAVector(this.store, this.width, tail.height, [ tail.height === 0 ? value : node.id ]))
        mutatedExisting = false
      }
    }

    if (!mutatedExisting) {
      // top level overflow, new level needed, safe to assume the above operation produced a new 1-element node
      return save(this.store, new IAVector(this.store, this.width, this.height + 1, [ this.id, node.id ]))
    }

    return node
  }

  async _getTailChain () {
    let chainHeight = this.height
    let node = this
    let chain = [ this ]
    while (chainHeight-- > 0) {
      let tailId = node.data[node.data.length - 1]
      node = await load(this.store, tailId, this.width, chainHeight)
      chain.push(node)
    }
    return chain
  }

  async * values () {
    yield * traverseValues(this)
  }

  async * nodes () {
    yield * traverseNodes(this)
  }

  toSerializable () {
    let r = {
      height: this.height,
      width: this.width,
      data: this.data
    }
    return r
  }
}

IAVector.isIAVector = function isIAVector (node) {
  return node instanceof IAVector
}

// store a new node and assign it an ID
async function save (store, newNode) {
  let id = await store.save(newNode.toSerializable())
  ro(newNode, 'id', id)
  return newNode
}

async function load (store, id, expectedWidth, expectedHeight) {
  let serialized = await store.load(id)
  return fromSerializable(store, id, serialized, expectedWidth, expectedHeight)
}

function isSerializable (serializable) {
  return typeof serializable === 'object' &&
    typeof serializable.height === 'number' &&
    typeof serializable.width === 'number' &&
    Array.isArray(serializable.data)
}

function fromSerializable (store, id, serializable, expectedWidth, expectedHeight) {
  if (!isSerializable(serializable)) {
    throw new Error('Object is not a valid IAVector node')
  }
  if (typeof expectedWidth === 'number') {
    if (serializable.width !== expectedWidth) {
      throw new Error(`IAVector node does not have expected width of ${expectedWidth}`)
    }
  }
  if (typeof expectedHeight === 'number') {
    if (serializable.height !== expectedHeight) {
      throw new Error(`IAVector node does not have expected height of ${expectedHeight}`)
    }
  }
  let node = new IAVector(store, serializable.width, serializable.height, serializable.data)
  if (id != null) {
    ro(node, 'id', id)
  }
  return node
}

function ro (obj, prop, value) {
  Object.defineProperty(obj, prop, { value: value, writable: false, enumerable: true })
}

async function * traverseValues (root) {
  let traversal = new ValuesTraversal(root)

  while (true) {
    yield * traversal.values()
    let id = traversal.traverse()
    if (!id) {
      break
    }
    let child = await root.store.load(id)
    traversal.next(child)
  }
}

async function * traverseNodes (root) {
  let traversal = new ValuesTraversal(root)

  while (true) {
    let id = traversal.traverse()
    if (!id) {
      break
    }
    let child = await root.store.load(id)
    yield { id, node: child }
    traversal.next(child)
  }
}

/* istanbul ignore next */
const dummyStore = { load () {}, save () {}, isEqual () { return false } }

class ValuesTraversal {
  constructor (rootBlock) {
    this._stack = []
    this._width = null
    this._height = null
    this.next(rootBlock)
  }

  _peek () {
    return this._stack[this._stack.length - 1]
  }

  _nextLink (node, start) {
    if (node.height === 0 || start === node.data.length - 1) {
      return -1
    }
    return start + 1
  }

  /**
   * Perform a single-block traversal.
   *
   * @returns {Object} A link to the next block required for further traversal (to be provided via
   * {@link ValuesTraversal#next}) or `null` if there are no more nodes to be traversed in this IAVector.
   */
  traverse () {
    let n = this._peek()
    while (!n || n.nextLink === -1) {
      this._stack.pop()
      this._height++ // back up toward the root
      n = this._peek()
      if (!n) {
        return null
      }
    }
    let link = n.node.data[n.nextLink]
    n.nextLink = this._nextLink(n.node, n.nextLink)
    return link
  }

  /**
   * Provide the next block required for traversal.
   *
   * @param {Object} block A serialized form of an IAVector intermediate/child block identified by an identifier
   * returned from {@link ValuesTraversal#traverse}.
   */
  next (block) {
    // if we have nulls, this is the first block, for the rest the width has to be consistent and the height has to
    // be correct for where we are in the tree
    let expectedWidth = this._width === null ? block.width : this._width
    let expectedHeight = this._height === null ? block.height : this._height - 1
    let node = IAVector.isIAVector(block)
      ? block
      : fromSerializable(dummyStore, 0, block, expectedWidth, expectedHeight)
    this._height = node.height // height--, down toward the leaves
    if (this._width === null) {
      this._width = node.width
    }
    this._stack.push({ node, nextLink: this._nextLink(node, -1) })
  }

  /**
   * An iterator providing all of the values in the current IAVector node being traversed.
   *
   * @returns {Iterator} An iterator that yields value objects.
   */
  * values () {
    let n = this._peek()
    if (n && n.node.height === 0) {
      for (let v of n.node.data) {
        yield v
      }
    }
  }
}

module.exports.create = create
module.exports.fromSerializable = fromSerializable
