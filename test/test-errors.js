/* eslint-env mocha */

const { assert } = require('@sinonjs/referee')
const { memoryStore } = require('./common')
const iavector = require('../')

let Constructor

function rejects (promise, messageRe) {
  // referee has a garbage rejects()
  return promise.then(() => {
    throw new Error('Promise did not reject')
  }, (e) => {
    assert.isError(e)
    assert.match(e.message, messageRe)
  })
}

function throws (fn, messageRe) {
  return rejects((async () => fn())(), messageRe)
}

describe('Errors', async () => {
  Constructor = (await iavector.create(memoryStore())).constructor

  it('constructor', async () => {
    await rejects(iavector.create({ herp: 'derp' }), /Invalid `store` parameter/)
    await rejects(iavector.create(memoryStore(), 'herp'), /Invalid `width` parameter/)
    await throws(() => new Constructor(memoryStore(), 8, 'derp'), /Invalid `height` parameter/)
    await throws(() => new Constructor(memoryStore(), 8, 10, 'herpity derp derp'), /Invalid `data` parameter/)
  })

  it('serialization', async () => {
    const baddies = [
      [ 'derp', 8, 9, /not a valid IAVector node/ ],
      [ { width: 7, height: 9, data: [] }, 8, 9, /node does not have expected width/ ],
      [ { width: 8, height: 7, data: [] }, 8, 9, /node does not have expected height/ ]
    ]
    const store = memoryStore()

    for (let bad of baddies) {
      let [ serializable, expectedWidth, expectedHeight, expectedRe ] = bad
      await throws(() => iavector.fromSerializable(store, 0, serializable, expectedWidth, expectedHeight), expectedRe)
    }
  })

  it('from non-array', async () => {
    await rejects(iavector.create(memoryStore(), 4, 'not an array'), /Unsupported `from` type/)
  })
})
