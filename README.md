# use-logic-block
React hook for using [logic-block](https://github.com/k1moshka/logic-block) in functional components

## Installation
Just add it to project dependencies
```
yarn add use-logic-block
// or
npm install --save use-logic-block
```

## Example
```jsx
import React from 'react'
import Block, { value, fields } from 'logic-block'
import useLogicBlock from 'use-logic-block'

const block = Block({
  counter: value(0),
  doneEdge: value(10),
  isDone: fields((c, e) => { return c >= e }, ['counter', 'doneEdge'])
})

function Comp(props) {
  const { value, update } = useLogicBlock(block, { doneEdge: props.edge })

  return (
    <div className="root">
      <span>{`${value.counter} / ${value.doneEdge}`}</span>
      <button
        className="button"
        disabled={value.isDone}
        onClick={() => update({ counter: value.counter + 1 })}
      >
        INCREASE COUNTER
      </button>
    </div>
  )
}

```

## API
useLogicBlock is a react hook (function).

| Argument     | Type                         | Optional? | Description                                                                                                                                                                                            |
| ------------ | ---------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| block        | `BlockFactory`               | Mandatory | The block which will use for processing value. If block will change during life time of a component, the value will be immediately re-processed with **initialValue** that will be setted on the time. |
| initialValue | `Object`                     | Optional  | Initial value for block instance. It has effect only on first render. If it will be changed during lifetime of a component, value will not be re-processed.                                            |
| onUpdate     | `(newValue: Object) => void` | Optional  | Callback which will invoke on every update of the value.                                                                                                                                               |

## Author
[Ilya Melishnikov](https://www.linkedin.com/in/ilya-melishnikov/)

## LICENSE
[MIT](./LICENSE.md)
