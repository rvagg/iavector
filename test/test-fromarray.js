/* eslint-env mocha */

const { assert } = require('@sinonjs/referee')
const { memoryStore, rejects } = require('./common')
const iavector = require('../')

describe('Create from array', () => {
  it('from small array', async () => {
    const data = Array.from({ length: 10 }).map((_, i) => `v${i}`)
    const vector = await iavector.create(memoryStore(), 10, data.slice())
    assert.same(vector.height, 0)
    assert.same(vector.width, 10)
    assert.equals(vector.data, data)

    for (let i = 0; i < 10; i++) {
      assert.same(await vector.get(i), `v${i}`)
    }
  })

  it('from double-sized array', async () => {
    const data = Array.from({ length: 10 }).map((_, i) => `v${i}`)
    const vector = await iavector.create(memoryStore(), 5, data.slice())
    assert.same(vector.height, 1)
    assert.same(vector.width, 5)
    assert.same(vector.data.length, 2)

    for (let i = 0; i < 10; i++) {
      assert.same(await vector.get(i), `v${i}`)
    }
  })

  it('from awkward-sized array', async () => {
    const data = Array.from({ length: 11 }).map((_, i) => `v${i}`)
    const vector = await iavector.create(memoryStore(), 5, data.slice())
    assert.same(vector.height, 1)
    assert.same(vector.width, 5)
    assert.same(vector.data.length, 3)

    for (let i = 0; i < 11; i++) {
      assert.same(await vector.get(i), `v${i}`)
    }
  })

  it('from large array', async () => {
    const data = Array.from({ length: 101 }).map((_, i) => `v${i}`)
    const vector = await iavector.create(memoryStore(), 4, data.slice())
    assert.same(vector.height, 3)
    assert.same(vector.width, 4)
    assert.same(vector.data.length, 2)

    for (let i = 0; i < 101; i++) {
      assert.same(await vector.get(i), `v${i}`)
    }
  })

  it('from zero-length array', async () => {
    const vector = await iavector.create(memoryStore(), 4, [])
    assert.same(vector.width, 4)
    assert.same(vector.height, 0)
    assert.same(vector.data.length, 0)
  })

  it('construction, with defaults', async () => {
    const data = Array.from({ length: 300 }).map((_, i) => `v${i}`)
    const store = memoryStore()
    const construction = iavector.constructFrom(data)
    while (true) {
      let c = 0
      for (const node of construction.construct()) {
        c++
        node.id = await store.save(store, node.toSerializable())
        construction.saved(node)
      }
      if (c === 0) {
        break
      }
    }
    const vector = construction.root()
    assert.same(vector.height, 1)
    assert.same(vector.width, 256)
    assert.same(vector.data.length, 2)

    rejects(vector.get(1), /load\(\) not implemented on dummy store/)
  })
})
