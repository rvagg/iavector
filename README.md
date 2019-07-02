# IAVector

An **I**mmutable **A**synchronous **Vector**.

## Warning

This is both **experimental** and a **work in progress**. The current form is not likely to be the final form. No guarantees are provided that serialised versions of today's version will be loadable in the future. This project may even be archived if significantly improved forms are discovered or derived.

However, rich documentation is provided as an invitation for collaboration to work on that final form; or as inspiration for alternative approaches to this problem space.

_Caveat emptor for versions less than 1.0.0._

See also [IAMap](https://github.com/rvagg/iamap)

## Contents

* [Warning](#Warning)
* [Contents](#Contents)
* [About](#About)

## About

IAVector provides an `Array`-like interface that can organise data in a storage system that does not lend itself to organisation, such as a content addressed storage system like [IPFS](https://ipfs.io/) where you have to know the address of an element before you can fetch it.

### IPLD

[IPLD](http://ipld.io/) is the data layer of IPFS. One aim of this project is to work toward useful primitives that will allow more complex applications to be built that do not necessarily relate to the current IPFS file-focused use-case.

While IAVector is intended to operate on top of IPLD, it is intentionally built independent from it such that it could be used across any other datastore that presents similar challenges to storing and retrieving structured data.

## Immutability

IAMap instances cannot be mutated, once instantiated, you cannot (or should not) modify its properties. Therefore, mutation requires the creation of new instances. Every `map.set()` and `map.delete()` operation will result in a new IAMap root node, which will have a new, unique identifier. New instances created by mutations essentially perform a copy-on-write (CoW), so only the modified node and its parents are impacted, all reference to unmodified nodes remain intact as links.

Mutation on a large data set may involve the creation of many new internal nodes, as references between nodes form part of the "content" and therefore require new identifiers. This is handled transparently but users should be aware that many intermediate nodes are created in a backing store during mutation operations.

## Algorithm

```
Width: 3
Height
↓
0:     1 2 3

       Head chain: 1
       Tail chain: 3(full)


1:             a b
         ┌─────┘ │
0:     1 2 3   4 5

       Head chain: a → 1
       Tail chain: b → 5


1:             a b c
         ┌─────┘ │ └─────┐
0:     1 2 3   4 5 6   7 8 9

       Head chain: a → 1
       Tail chain: c(full) → 9(full)


2:                                        A  B
                 ┌────────────────────────┘  │
1:             a b c                      d  e
         ┌─────┘ │ └─────┐        ┌───────┘  │
0:     1 2 3   4 5 6   7 8 9   10 11 12   13 14 15

       Head chain: A → a → 1
       Tail chain: B → d → 15(full)

2:                                        A  B
                 ┌────────────────────────┘  │
1:             a b c                      d  e  f
         ┌─────┘ │ └─────┐        ┌───────┘  │  └────────┐
0:     1 2 3   4 5 6   7 8 9   10 11 12   13 14 15   16 17 18

       Head chain: A → a → 1
       Tail chain: B → f(full) → 18(full)


2:                                        A  B  C
                ┌─────────────────────────┘  │  └─────────────────────────────┐
1:             a b c                      d  e  f                          g  h  i
         ┌─────┘ │ └─────┐        ┌───────┘  │  └────────┐         ┌───────┘  │  └────────┐
0:     1 2 3   4 5 6   7 8 9   10 11 12   13 14 15   16 17 18   19 20 21   22 23 24   25 26 27

       Head chain: A → a → 1
       Tail chain: C(full) → i(full) → 27(full)


3:                                                                                               i  ii
                                             ┌───────────────────────────────────────────────────┘  │
2:                                        A  B  C                                                   D
                ┌─────────────────────────┘  │  └─────────────────────────────┐                     │
1:             a b c                      d  e  f                          g  h  i                  j
         ┌─────┘ │ └─────┐        ┌───────┘  │  └────────┐         ┌───────┘  │  └────────┐         │
0:     1 2 3   4 5 6   7 8 9   10 11 12   13 14 15   16 17 18   19 20 21   22 23 24   25 26 27   28 29 30

       Head chain: i → A → a → 1
       Tail chain: ii → D → j → 30(full)
```

FIXME: not quite right, doesn't deal with bounds

```js
function dataIndex (width, height, i) {
  let ceil = width ** (height + 1)
  let floor = width ** height
  return Math.floor((i % ceil) / floor)
}

function dataIndexChain (width, height, i) {
  let ind = []
  do {
    ind.push(dataIndex(width, height, i))
  } while (height-- > 0)
  return ind
}
```

```js
// position 29, value = 30
dataIndexChain(3, 3, 29) → [ 1, 0, 0, 2 ]
// position 27, value = 28
dataIndexChain(3, 3, 27) → [ 1, 0, 0, 0 ]
// position 26, value = 27
dataIndexChain(3, 3, 27) → [ 0, 2, 2, 2 ]
// position 2, value = 3
dataIndexChain(3, 3, 2) → [ 0, 0, 0, 2 ]
// position 0, value = 1
dataIndexChain(3, 3, 0) → [ 0, 0, 0, 0 ]
```

## API

### Contents

 * [`async iavector.create(store[, width][, from])`](#iavector__create)
 * [`iavector.traverseGet *width, values[, store]`](#iavector__traverseGet____)
 * [`class ConstructFrom`](#ConstructFrom)
 * [`ConstructFrom#construct()`](#ConstructFrom_construct)
 * [`ConstructFrom#saved()`](#ConstructFrom_saved)
 * [`ConstructFrom#root()`](#ConstructFrom_root)
 * [`class IAVector`](#IAVector)
 * [`async IAVector#get(index)`](#IAVector_get)
 * [`async IAVector#push(value)`](#IAVector_push)
 * [`async IAVector#values()`](#IAVector_values)
 * [`async IAVector#nodes()`](#IAVector_nodes)
 * [`IAVector#toSerializable()`](#IAVector_toSerializable)
 * [`IAVector.isIAVector(node)`](#IAVector__isIAVector)
 * [`iavector.isSerializable(serializable)`](#iavector__isSerializable)
 * [`iavector.fromSerializable(store, id, serializable[, expectedWidth][, expectedHeight])`](#iavector__fromSerializable)
 * [`iavector.traverseValues(rootBlock)`](#iavector__traverseValues)
 * [`iavector.traverseGet(rootBlock, index)`](#iavector__traverseGet)
 * [`iavector.traverseSize(rootBlock)`](#iavector__traverseSize)
 * [`class ValuesTraversal`](#ValuesTraversal)
 * [`ValuesTraversal#traverse()`](#ValuesTraversal_traverse)
 * [`ValuesTraversal#next(block)`](#ValuesTraversal_next)
 * [`ValuesTraversal#values()`](#ValuesTraversal_values)
 * [`class GetTraversal`](#GetTraversal)
 * [`GetTraversal#traverse()`](#GetTraversal_traverse)
 * [`GetTraversal#next(block)`](#GetTraversal_next)
 * [`GetTraversal#value()`](#GetTraversal_value)
 * [`traverseGetOne(node, index)`](#traverseGetOne)
 * [`class SizeTraversal`](#SizeTraversal)
 * [`SizeTraversal#traverse()`](#SizeTraversal_traverse)
 * [`SizeTraversal#next(block)`](#SizeTraversal_next)
 * [`SizeTraversal#size()`](#SizeTraversal_size)

<a name="iavector__create"></a>
### `async iavector.create(store[, width][, from])`

```js
let vector = await iavector.create(store)
```

Create a new `IAVector` instance with a backing store. This operation is asynchronous and returns a `Promise` that
resolves to an `IAVector` instance. A `create()` will perform at least one `save()` on the backing store, to store
the root node and any child nodes required if a `from` argument is supplied.

**Parameters:**

* **`store`** _(`Object`)_: A backing store for this `IAVector`. The store should be able to save and load a serialised
  form of a single node of a `IAVector` which is provided as a plain object representation. `store.save(node)` takes
  a serialisable node and should return a content address / ID for the node. `store.load(id)` serves the inverse
  purpose, taking a content address / ID as provided by a `save()` operation and returning the serialised form
  of a node which can be instantiated by `IAVector`.
  The `store` object should take the following form: `{ async save(node):id, async load(id):node }`
* **`width`** _(`number`, optional, default=`256`)_: The width of this `IAVector`, in that each node of the tree structure generated by will
  have, at most, `width` child nodes, or `width` values at the leaves.
* **`from`** _(`Array`, optional)_: An optional Array to marshall into an `IAVector`. Each element of the `from` array will be
  stored at a leaf node, in order. If no `from` argument is supplied, a zero-length `IAVector` is returned.

<a name="iavector__traverseGet____"></a>
### `iavector.traverseGet *width, values[, store]`

Perform a synchronous block-by-block creation of a new `IAVector` give a set of `values` to be stored in nodes with
`width` elements. Returns a [`ConstructFrom`](#ConstructFrom) object for performing the save operation.

If `store` is not provied, an internal non-functioning "dummy store" will be used and the resulting `IAVector`s,
including the new root won't be able to perform standard functions such as `get()` and `append()`, although they will
be suitable for serialisation.

**Parameters:**

* **`width`** _(`number`)_: The width to be used for each `IAVector` node, see [`iavector.create`](#iavector__create).
* **`values`** _(`Array`)_: The values to be stored in the new `IAVector` structure.
* **`store`** _(`Object`, optional)_: The backing store to be used for new `IAVector` nodes.

**Return value** : A [`ConstructFrom`](#ConstructFrom) object to perform the creation block-by-block

<a name="ConstructFrom"></a>
### `class ConstructFrom`

A construction object for synchronous block-by-block creation of a new `IAVector` given a list of `values` to be
distributed over `width` sized blocks.

Call the `construct()` generator and for each node yielded, save and send the saved node back with the `saved(node)`
function. Continue to call `construct()` until there are no more nodes yielded, whereupon `root()` will provide the root
node which should also be the last provided node via `saved(node)`.

<a name="ConstructFrom_construct"></a>
### `ConstructFrom#construct()`

TODO

<a name="ConstructFrom_saved"></a>
### `ConstructFrom#saved()`

TODO

<a name="ConstructFrom_root"></a>
### `ConstructFrom#root()`

TODO

<a name="IAVector"></a>
### `class IAVector`

Immutable Asynchronous Vector

The `IAVector` constructor should not be used directly. Use `iavector.create()` to instantiate.

**Properties:**

* **`id`** _(`any`)_: A unique identifier for this `IAVector` instance. IDs are generated by the backing store and
  are returned on `save()` operations.
* **`width`** _(`number`, optional, default=`0`)_: Width of the current `IAVector`. This determines the maximum number of elements that
  can be stored in the `data` array. It is assumed that all nodes in an `IAVector` tree structure will have the same
  `width` value or the traversal algorithms will fail.
* **`height`** _(`number`, optional, default=`0`)_: Height of the current node in the `IAVector`. This is used to determine the indexing
  of lookups within the `data` array for this level of the tree structure. Height values are the inverse of depth from
  a root node perspective. That is, the further from the root node, the lower the `height` value, until `0` where the
  leaf nodes and their values exist.
* **`data`** _(`Array`, optional, default=`[]`)_: Array of data elements. For `height` `0` nodes, these elements are leaf values, or
  the raw values stored in the `IAVector`. For `height` greater than `0` nodes, these elements store IDs of child
  nodes within the tree structure.
  See [`iavector.create`](#iavector__create) for more details.

<a name="IAVector_get"></a>
### `async IAVector#get(index)`

Asynchronously find and return a value at the given `index` if it exists within this `IAVector`.

**Parameters:**

* **`index`** _(`number`)_: A index of the value to lookup.

**Return value**  _(`Promise`)_: A `Promise` that resolves to the value being sought if that value exists within this `IAVector`.
  If the `index` is out of bounds for this `IAVector`, the `Promise` will resolve to `undefined`.

<a name="IAVector_push"></a>
### `async IAVector#push(value)`

Asynchronously create a new `IAVector` instance identical to this one but with `value` appended to the
end.

**Parameters:**

* **`value`** _(`*`)_: The value to append at `size() + 1`.

<a name="IAVector_values"></a>
### `async IAVector#values()`

Asynchronously emit all values that exist within this `IAVector`. This will cause a full traversal of all nodes
if allowed to complete.

**Return value**  _(`AsyncIterator`)_: An async iterator that yields values.

<a name="IAVector_nodes"></a>
### `async IAVector#nodes()`

Asynchronously emit all nodes that exist within this `IAVector`. Values emitted by the `AsyncIterator` will
take the form `{ id, node }`.

**Return value**  _(`AsyncIterator`)_: An async iterator that yields nodes.

<a name="IAVector_toSerializable"></a>
### `IAVector#toSerializable()`

Returns a serialisable form of this `IAVector` node. The internal representation of this local node is copied into
a plain JavaScript `Object` including a representation of its `data` array which will either contain raw values (for
`height` of `0`) or IDs of child nodes (for `height` of greater than `0`).

Nodes take the serialised form:
```
{
  width: number,
  height: number,
  data: Array
}
```

**Return value**  _(`Object`)_: An object representing the internal state of this local `IAVector` node, including links to
  child nodes, if any.

<a name="IAVector__isIAVector"></a>
### `IAVector.isIAVector(node)`

Determine if an object is an instance of an `IAVector`

**Parameters:**

* **`node`** _(`Object`)_

**Return value**  _(`boolean`)_

<a name="iavector__isSerializable"></a>
### `iavector.isSerializable(serializable)`

Determine if a serializable object is an `IAVector` node type, can be used to assert whether a data block is
an `IAVector` node before trying to instantiate it.

**Parameters:**

* **`serializable`** _(`Object`)_: An object that may be a serialisable form of an `IAVector` node

**Return value**  _(`boolean`)_: An indication that the serialisable form is or is not an `IAVector` node

<a name="iavector__fromSerializable"></a>
### `iavector.fromSerializable(store, id, serializable[, expectedWidth][, expectedHeight])`

Instantiate an `IAVector` from a valid serialisable form of an `IAVector` node. The serializable should be the same as
produced by [`IAVector#toSerializable`](#IAVector_toSerializable).
Serialised forms must contain `height`, `width` properties, both integers, and a `data` array of between zero and
`width` elements.

**Parameters:**

* **`store`** _(`Object`)_: A backing store for this Map. See [`iavector.create`](#iavector__create).
* **`id`** _(`Object`)_: An optional ID for the instantiated `IAVector` node. Unlike [`iavector.create`](#iavector__create),
  `fromSerializable()` does not `save()` a newly created `IAVector` node so an ID is not generated for it. If one is
  required for downstream purposes it should be provided, if the value is `null` or `undefined`, `node.id` will
  be `null` but will remain writable.
* **`serializable`** _(`Object`)_: The serializable form of an `IAVector` node to be instantiated
* **`expectedWidth`** _(`Object`, optional)_: A `width` to expect from the new node, if `expectedWidth` is provided and the node
  does not have that value for `width`, an `Error` will be thrown.
* **`expectedHeight`** _(`Object`, optional)_: A `height` to expect from the new node, if `expectedHeight` is provided and the node
  does not have that value for `height`, an `Error` will be thrown.

**Return value**  _(`Object`)_: An `IAVector` instance

<a name="iavector__traverseValues"></a>
### `iavector.traverseValues(rootBlock)`

Perform a per-block synchronous traversal of all nodes in the `IAVector` under the `rootBlock` node provided.
Returns a [`ValuesTraversal`](#ValuesTraversal) object for performing traversals block-by-block. Note that `values()`
will only yield values on leaf nodes, with intermediate nodes only requiring further child nodes in order to
proceed.

**Parameters:**

* **`rootBlock`** _(`Object`)_: The root block, for extracting the `IAVector` configuration data

**Return value** : A [`ValuesTraversal`](#ValuesTraversal) object for performing the traversal block-by-block and collecting their
  values.

<a name="iavector__traverseGet"></a>
### `iavector.traverseGet(rootBlock, index)`

Perform a per-block synchronous traversal as a `get()` operation. Takes a root block, the index being looked
up and returns a [`GetTraversal`](#GetTraversal) object for performing traversals block-by-block.

**Parameters:**

* **`rootBlock`** _(`Object`)_: The root block, for extracting the `IAVector` configuration data
* **`index`** _(`number`)_: an index to look up.

**Return value** : A [`GetTraversal`](#GetTraversal) object for performing the traversal block-by-block.

<a name="iavector__traverseSize"></a>
### `iavector.traverseSize(rootBlock)`

Perform a per-block synchronous traversal as a `size()` operation. Takes a root block and returns a
[`SizeTraversal`](#SizeTraversal) object for performing traversals block-by-block.

**Parameters:**

* **`rootBlock`** _(`Object`)_: The root block, for extracting the `IAVector` configuration data

**Return value** : A [`SizeTraversal`](#SizeTraversal) object for performing the traversal block-by-block.

<a name="ValuesTraversal"></a>
### `class ValuesTraversal`

An `ValuesTraversal` object is returned by the [`iavector.traverseValues`](#iavector__traverseValues) function for performing
block-by-block traversals on an `IAVector` for the purpose of iterating over or collecting values.

<a name="ValuesTraversal_traverse"></a>
### `ValuesTraversal#traverse()`

Perform a single-block traversal.

**Return value**  _(`Object`)_: A link to the next block required for further traversal (to be provided via
  [`ValuesTraversal#next`](#ValuesTraversal_next)) or `null` if there are no more nodes to be traversed in this `IAVector`.

<a name="ValuesTraversal_next"></a>
### `ValuesTraversal#next(block)`

Provide the next block required for traversal.

**Parameters:**

* **`block`** _(`Object`)_: A serialized form of an `IAVector` intermediate/child block identified by an identifier
  returned from [`ValuesTraversal#traverse`](#ValuesTraversal_traverse).

<a name="ValuesTraversal_values"></a>
### `ValuesTraversal#values()`

An iterator providing all of the values in the current `IAVector` node being traversed.

**Return value**  _(`Iterator`)_: An iterator that yields value objects.

<a name="GetTraversal"></a>
### `class GetTraversal`

An `GetTraversal` object is returned by the [`iavector.traverseGet`](#iavector__traverseGet) function for performing
block-by-block traversals on an `IAVector`.

<a name="GetTraversal_traverse"></a>
### `GetTraversal#traverse()`

Perform a single-block traversal.

**Return value**  _(`Object`)_: A link to the next block required for further traversal (to be provided via
  [`GetTraversal#next`](#GetTraversal_next)) or `null` if a value has been found (and is available via
  [`GetTraversal#value`](#GetTraversal_value)) or the value doesn't exist.

<a name="GetTraversal_next"></a>
### `GetTraversal#next(block)`

Provide the next block required for traversal.

**Parameters:**

* **`block`** _(`Object`)_: A serialized form of an `IAVector` intermediate/child block identified by an identifier
  returned from [`ValuesTraversal#traverse`](#ValuesTraversal_traverse).

<a name="GetTraversal_value"></a>
### `GetTraversal#value()`

Get the final value of the traversal, if one has been found.

**Return value** : A value, if one has been found, otherwise `undefined` (if one has not been found or we are mid-traversal)

<a name="traverseGetOne"></a>
### `traverseGetOne(node, index)`

Perform a `get()` on a single `IAVector` node. Returns either an indication of an OOB, a `value` if the `index` is
found within this node, or a continuation descriptor for proceeding with the look up on a child block.

**Parameters:**

* **`node`** _(`Object`)_: An `IAVector` node, or a serialized form of one.
* **`index`** _(`number`)_: The index to look up in this node.

**Return value**  _(`Object`)_: Either `null` if OOB, an object with a `value` property with a found value, or an object with the
  form `{ nextId, nextHeight, nextIndex }`, where `nextId` is the next block needed for a traversal, `nextHeight` is
  the expected height of the node identified by `nextId` and `nextIndex` being the index to continue the look-up such
  that a `traverseGetOne(node, index)` on the `node` identified by `nextId` uses `nextIndex` as the `index` value.

<a name="SizeTraversal"></a>
### `class SizeTraversal`

An `SizeTraversal` object is returned by the [`iavector.traverseSize`](#iavector__traverseSize) function for performing
block-by-block traversals on an `IAVector`.

<a name="SizeTraversal_traverse"></a>
### `SizeTraversal#traverse()`

Perform a single-block traversal.

**Return value**  _(`Object`)_: A link to the next block required for further traversal (to be provided via
  [`SizeTraversal#next`](#SizeTraversal_next)) or `null` if a size has been calculated (and is available via
  [`SizeTraversal#value`](#SizeTraversal_value))

<a name="SizeTraversal_next"></a>
### `SizeTraversal#next(block)`

Provide the next block required for traversal.

**Parameters:**

* **`block`** _(`Object`)_: A serialized form of an `IAVector` intermediate/child block identified by an identifier
  returned from [`ValuesTraversal#traverse`](#ValuesTraversal_traverse).

<a name="SizeTraversal_size"></a>
### `SizeTraversal#size()`

Get the final size calculated by this traversal.

**Return value**  _(`number`)_: the size of this `IAVector` if the traversal has completed, otherwise `undefined`

## License and Copyright

Copyright 2019 Rod Vagg

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
