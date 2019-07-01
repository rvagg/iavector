/* eslint-env mocha */

const { assert } = require('@sinonjs/referee')
const { memoryStore } = require('./common')
const iavector = require('../')

describe('Traversals', async () => {
  let store = memoryStore()
  let data = Array.apply(null, new Array(101)).map((_, i) => `v${i}`)
  let expectedIntermediateCount = Math.ceil(data.length / 4 ** 2) + Math.ceil(data.length / 4 ** 3) + 1
  let expectedLeafCount = Math.ceil(data.length / 4)
  let vector
  let rootBlock

  before(async () => {
    vector = await iavector.create(store, 4, data.slice())
    rootBlock = store.load(vector.id)
  })

  it('traverse values', () => {
    let chunkIndex = 0
    let expectedChunk
    function nextChunk () {
      expectedChunk = data.slice(chunkIndex, chunkIndex += 4)
    }

    nextChunk()

    let currentBlock = rootBlock
    let foundIntermediate = 0
    let foundLeaf = 0

    let traversal = iavector.traverseValues(currentBlock)

    // first 3 should be blank as we traverse down
    for (let i = 0; i < 3; i++) {
      assert.equals([ ...traversal.values() ], [])
      foundIntermediate++
      let id = traversal.traverse()
      assert.equals(id, currentBlock.data[0])
      currentBlock = store.load(id)
      traversal.next(currentBlock)
    }

    // 4th should be a leaf with our first set of values
    assert.equals([ ...traversal.values() ], expectedChunk)
    nextChunk()
    foundLeaf++

    while (true) {
      let id = traversal.traverse()
      currentBlock = store.load(id)
      if (!currentBlock) {
        break
      }
      traversal.next(currentBlock)
      let values = [ ...traversal.values() ]
      if (values.length) {
        assert.equals(values, expectedChunk, `found expected chunk of entries number ${chunkIndex + 1}`)
        nextChunk()
        foundLeaf++
      } else {
        foundIntermediate++
      }
    }

    assert.equals(foundLeaf, expectedLeafCount, 'got expected leaf count')
    assert.equals(foundIntermediate, expectedIntermediateCount, 'got expected intermediate count')
  })

  it('traverse get(0)', () => {
    let currentBlock = rootBlock
    let traversal = iavector.traverseGet(currentBlock, 0)

    for (let i = 0; i < 3; i++) {
      assert.isUndefined(traversal.value())
      let id = traversal.traverse()
      assert.equals(id, currentBlock.data[0])
      currentBlock = store.load(id)
      traversal.next(currentBlock)
    }

    assert.isNull(traversal.traverse(), 'no more traversals')
    assert.equals(traversal.value(), 'v0')
  })

  it('traverse get(max)', () => {
    let currentBlock = rootBlock
    let traversal = iavector.traverseGet(currentBlock, data.length - 1)

    for (let i = 0; i < 3; i++) {
      assert.isUndefined(traversal.value())
      let id = traversal.traverse()
      assert.equals(id, currentBlock.data[currentBlock.data.length - 1])
      currentBlock = store.load(id)
      traversal.next(currentBlock)
    }

    assert.isNull(traversal.traverse(), 'no more traversals')
    assert.equals(traversal.value(), data[data.length - 1])
  })

  it('traverse get(mid)', () => {
    let currentBlock = rootBlock
    let index = Math.floor(data.length / 2)
    let traversal = iavector.traverseGet(currentBlock, index)

    for (let i = 0; i < 3; i++) {
      assert.isUndefined(traversal.value())
      let id = traversal.traverse()
      currentBlock = store.load(id)
      traversal.next(currentBlock)
    }

    assert.isNull(traversal.traverse(), 'no more traversals')
    assert.equals(traversal.value(), data[index])
  })

  it('traverse size()', () => {
    let currentBlock = rootBlock
    let traversal = iavector.traverseSize(currentBlock)

    for (let i = 0; i < 3; i++) {
      assert.isUndefined(traversal.size(), `no size at height ${currentBlock.height}`)
      let id = traversal.traverse()
      assert.equals(id, currentBlock.data[currentBlock.data.length - 1])
      currentBlock = store.load(id)
      traversal.next(currentBlock)
    }

    assert.isNull(traversal.traverse(), 'no more traversals')
    assert.equals(traversal.size(), data.length)
  })
})
