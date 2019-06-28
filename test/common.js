const murmurhash3 = require('murmurhash3js-revisited')

function hash (obj) {
  return murmurhash3.x86.hash32(Buffer.from(JSON.stringify(obj)))
}

function memoryStore () {
  return {
    map: new Map(),
    saves: 0,
    loads: 0,
    save (obj) { // this can be async
      let id = hash(obj)
      this.map.set(id, obj)
      this.saves++
      return id
    },
    load (id) { // this can be async
      this.loads++
      return this.map.get(id)
    },
    isEqual (id1, id2) {
      return id1 === id2
    }
  }
}

module.exports.memoryStore = memoryStore
