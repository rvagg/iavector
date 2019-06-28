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
