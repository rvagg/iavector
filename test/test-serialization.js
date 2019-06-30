/* eslint-env mocha */

const { assert } = require('@sinonjs/referee')
const { memoryStore } = require('./common')
const iavector = require('../')

describe('Serialization', () => {
  it('default identifier', () => {
    let vector = iavector.fromSerializable(memoryStore(), undefined, { width: 8, height: 9, data: [] })
    assert.same(vector.width, 8)
    assert.same(vector.height, 9)
    assert.same(vector.id, null)
  })

  it('basic save()s', async () => {
    let vector = await iavector.create(memoryStore(), 10)

    // empty root
    assert.equals(vector.toSerializable(), {
      width: 10,
      height: 0,
      data: []
    })

    // single, full root
    for (let i = 0; i < 10; i++) {
      vector = await vector.push(`v${i}`)
      assert.equals(vector.toSerializable(), {
        width: 10,
        height: 0,
        data: Array.apply(null, new Array(i + 1)).map((_, i) => `v${i}`)
      })
    }

    // overflow

    let oldId = vector.id
    vector = await vector.push('v10')
    assert.same(vector.width, 10)
    assert.same(vector.height, 1)
    assert.same(vector.data.length, 2)
    assert.same(vector.data[0], oldId)
    assert.isNumber(vector.data[1]) // id of some other node
  })

  it('basic load()s', async () => {
    let data = Array.apply(null, new Array(10)).map((_, i) => `v${i}`)
    let serialized = { width: 10, height: 0, data: data.slice() }
    let vector = iavector.fromSerializable(memoryStore(), undefined, Object.assign(serialized))

    serialized.data = data.slice() // new copy just to be sure
    assert.equals(vector.toSerializable(), serialized)

    for (let i = 0; i < 10; i++) {
      assert.same(await vector.get(i), `v${i}`)
    }
  })
})
