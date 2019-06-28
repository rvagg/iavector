/* eslint-env mocha */

const { assert, refute } = require('referee')
const { memoryStore } = require('./common')
const iavector = require('../')

const fixture = []

for (let i = 0; i < 100; i++) {
  fixture.push(Math.random())
}

function testWithWidth (width, options) {
  describe(`Basic usage w/ width=${width}`, () => {
    let fullVector

    it(`${fixture.length} element push & get w/ width=${width}`, async () => {
      let vector = await iavector.create(memoryStore(), width)

      for (let i = 0; i < fixture.length; i++) {
        vector = await vector.push(fixture[i])

        for (let j = 0; j < i; j++) {
          assert.equals(await vector.get(j), fixture[j], `vector.get(${i})`)
        }

        let j = 0
        for await (let v of vector.values()) {
          assert.equals(v, fixture[j++], `vector.values() @ ${j}`)
        }
      }

      fullVector = vector
    })

    it(`${fixture.length} element vector w/ width=${width} blocks make sense`, async () => {
      let foundValues = []
      let blocksWithHeightCount = [ 0, 0, 0, 0, 0, 0, 0 ]
      for await (let n of fullVector.nodes()) {
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
        assert.equals(fullVector.height, 0, `root is height=${0} block`)
        return
      }

      assert.equals(foundValues.length, fixture.length, 'found all the values')
      assert.equals(blocksWithHeightCount.filter(Boolean).length, options.expectedMaxHeight, `only ${options.expectedMaxHeight} heights`)
      for (let i = 0; ; i++) {
        let expectedHeightBlocks = Math.ceil(fixture.length / width ** (i + 1))
        // the root block isn't in our list, so it's a special case
        if (expectedHeightBlocks === 1) {
          assert.equals(i, options.expectedMaxHeight, `expected maximum height is correct (sanity check) ${i} for width=${width}`)
          assert.equals(fullVector.height, options.expectedMaxHeight, `root is height=${options.expectedMaxHeight} block`)
          break
        }
        assert.equals(blocksWithHeightCount[i], expectedHeightBlocks, `correct number of height=${i} blocks`)
      }
    })
  })
}
testWithWidth(2, {
  expectedMaxHeight: 6
})
testWithWidth(4, {
  expectedMaxHeight: 3
})
testWithWidth(8, {
  expectedMaxHeight: 2
})
testWithWidth(16, {
  expectedMaxHeight: 1
})
testWithWidth(100, {
  expectedMaxHeight: 0
})
testWithWidth(200, {
  expectedMaxHeight: 0
})
