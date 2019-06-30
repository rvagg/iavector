/* eslint-env mocha */

const { assert } = require('@sinonjs/referee')
const { memoryStore } = require('./common')
const iavector = require('../')

describe('Create from array', () => {
  it('from small array', async () => {
    let data = Array.apply(null, new Array(10)).map((_, i) => `v${i}`)
    let vector = await iavector.create(memoryStore(), 10, data.slice())
    assert.same(vector.height, 0)
    assert.same(vector.width, 10)
    assert.equals(vector.data, data)

    for (let i = 0; i < 10; i++) {
      assert.same(await vector.get(i), `v${i}`)
    }
  })

  it('from double-sized array', async () => {
    let data = Array.apply(null, new Array(10)).map((_, i) => `v${i}`)
    let vector = await iavector.create(memoryStore(), 5, data.slice())
    assert.same(vector.height, 1)
    assert.same(vector.width, 5)
    assert.same(vector.data.length, 2)

    for (let i = 0; i < 10; i++) {
      assert.same(await vector.get(i), `v${i}`)
    }
  })

  it('from awkward-sized array', async () => {
    let data = Array.apply(null, new Array(11)).map((_, i) => `v${i}`)
    let vector = await iavector.create(memoryStore(), 5, data.slice())
    assert.same(vector.height, 1)
    assert.same(vector.width, 5)
    assert.same(vector.data.length, 3)

    for (let i = 0; i < 11; i++) {
      assert.same(await vector.get(i), `v${i}`)
    }
  })

  it('from large array', async () => {
    let data = Array.apply(null, new Array(101)).map((_, i) => `v${i}`)
    let vector = await iavector.create(memoryStore(), 4, data.slice())
    assert.same(vector.height, 3)
    assert.same(vector.width, 4)
    assert.same(vector.data.length, 2)

    for (let i = 0; i < 101; i++) {
      assert.same(await vector.get(i), `v${i}`)
    }
  })

  it('from zero-length array', async () => {
    let vector = await iavector.create(memoryStore(), 4, [])
    assert.same(vector.width, 4)
    assert.same(vector.height, 0)
    assert.same(vector.data.length, 0)
  })
})
