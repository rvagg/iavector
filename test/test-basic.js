/* eslint-env mocha */

const { assert, refute } = require('@sinonjs/referee')
const { memoryStore } = require('./common')
const iavector = require('../')

const fixture = []

for (let i = 0; i < 100; i++) {
  fixture.push(Math.random())
}

describe(`Basic ${fixture.length} element usage`, () => {
  function testWithWidth (width, options) {
    describe(`with width=${width}`, () => {
      let vector

      before(async () => {
        vector = await iavector.create(memoryStore(), width === 256 ? undefined : width) // test default=32
      })

      it(`push() w/ get() and values() while building`, async () => {
        assert.equals(await vector.size(), 0)
        for (let i = 0; i < fixture.length; i++) {
          vector = await vector.push(fixture[i])
          assert.equals(await vector.size(), i + 1)

          for (let j = 0; j < i; j++) {
            assert.equals(await vector.get(j), fixture[j], `vector.get(${i})`)
          }

          let j = 0
          for await (let v of vector.values()) {
            assert.equals(v, fixture[j++], `vector.values() @ ${j}`)
          }
        }
      })

      it('get(out of range) returns undefined', async () => {
        assert.isUndefined(await vector.get(fixture.length), 'undefined for size + 1')
        assert.isUndefined(await vector.get(fixture.length * 100), 'undefined for size * 2')
        assert.isUndefined(await vector.get(Infinity), 'undefined for Infinity')
        assert.isUndefined(await vector.get(-1), 'undefined for -1')
        assert.isUndefined(await vector.get(fixture.length * -100), 'undefined for -OOB')
        assert.isUndefined(await vector.get(-Infinity), 'undefined for -Infinity')
      })

      it(`Blocks make sense (expecting maximum height of ${options.expectedMaxHeight})`, async () => {
        let foundValues = []
        let blocksWithHeightCount = [ 0, 0, 0, 0, 0, 0, 0 ]
        for await (let n of vector.nodes()) {
          let block = n.node

          blocksWithHeightCount[block.height]++

          if (block.height === 0) {
            for (let v of block.data) {
              assert.contains(fixture, v)
              refute.contains(foundValues, v)
              foundValues.push(v)
            }
          }
        }

        if (options.expectedMaxHeight === 0) {
          // everything's in the root node
          assert.equals(foundValues.length, 0, 'single node in collection')
          assert.equals(vector.height, 0, `root is height=${0} block`)
          return
        }

        assert.equals(foundValues.length, fixture.length, 'found all the values')
        assert.equals(blocksWithHeightCount.filter(Boolean).length, options.expectedMaxHeight, `only ${options.expectedMaxHeight} heights`)
        for (let i = 0; ; i++) {
          let expectedHeightBlocks = Math.ceil(fixture.length / width ** (i + 1))
          // the root block isn't in our list, so it's a special case
          if (expectedHeightBlocks === 1) {
            assert.equals(i, options.expectedMaxHeight, `expected maximum height is correct (sanity check) ${i} for width=${width}`)
            assert.equals(vector.height, options.expectedMaxHeight, `root is height=${options.expectedMaxHeight} block`)
            break
          }
          assert.equals(blocksWithHeightCount[i], expectedHeightBlocks, `correct number of height=${i} blocks`)
        }
      })
    })
  }

  testWithWidth(2, { expectedMaxHeight: 6 })
  testWithWidth(4, { expectedMaxHeight: 3 })
  testWithWidth(8, { expectedMaxHeight: 2 })
  testWithWidth(32, { expectedMaxHeight: 1 })
  testWithWidth(100, { expectedMaxHeight: 0 })
  testWithWidth(256, { expectedMaxHeight: 0 })
  testWithWidth(300, { expectedMaxHeight: 0 })
})
