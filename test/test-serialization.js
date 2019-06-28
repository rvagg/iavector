/* eslint-env mocha */

const { assert } = require('@sinonjs/referee')
const { memoryStore } = require('./common')
const iavector = require('../')

describe('Serialization', () => {
  it('tmp', () => { // TODO: expand this
    let store = memoryStore()

    let vector = iavector.fromSerializable(store, 0, { width: 8, height: 9, data: [] })
    assert.equals(vector.width, 8)
    assert.equals(vector.height, 9)

    vector = iavector.fromSerializable(store, undefined, { width: 8, height: 9, data: [] })
    assert.equals(vector.width, 8)
    assert.equals(vector.height, 9)
  })
})
