import { useState, useMemo, useEffect, useRef } from 'react'
import Block, { isBlock } from 'logic-block'

export const makeCleanBlockCopy = (block) => {
  const scheme = block.__getScheme()

  const clearScheme = (schemeObj = scheme) => {
    return Object.keys(schemeObj).reduce((acc, key) => {
      const reducer = schemeObj[key]

      if (isBlock(reducer)) {
        acc[key] = makeCleanBlockCopy(reducer)
      } else if (typeof reducer === 'object') {
        acc[key] = clearScheme(reducer)
      } else {
        acc[key] = reducer
      }

      return acc
    }, {})
  }

  return Block(clearScheme())
}

const handlers = () => {
  let id = 0
  let callbacks = {}
  return {
    add(cb) {
      id += 1
      callbacks[id] = cb
      return id
    },
    cancel(id) {
      callbacks[id] = undefined
    },
    clear() {
      callbacks = {}
    },
    callback(...args) {
      Object.values(callbacks).forEach(cb => cb(...args))
    }
  }
}

function useMemoEx(reducerFn, deps) {
  const lastValue = useRef()
  return useMemo(() => {
    const newValue = reducerFn(lastValue.current)
    lastValue.current = newValue
    return newValue
  }, deps)
}

export default function useLogicBlock(block, initialValue, onUpdate) {
  const [value, setValue] = useState()

  const handleUpdate = useMemoEx((prevCb) => {
    if (prevCb !== undefined) {
      prevCb.clear()
    }

    const cb = handlers()
    if (onUpdate) {
      cb.add(onUpdate)
    }

    cb.add((...args) => {
      setValue(...args)
    })

    return cb
  }, [block, onUpdate])

  const startValue = useMemo(() => {
    const dummyBlock = makeCleanBlockCopy(block)

    return dummyBlock({
      ...value,
      ...initialValue
    })()
  }, [block])
  const instance = useMemo(() => {
    return block({
      ...value,
      ...initialValue
    }, {
      handleUpdate: handleUpdate.callback
    })
  }, [block, initialValue])

  useEffect(() => {
    setValue(instance())
  }, [instance])

  return {
    value: typeof value !== 'undefined'
      ? value
      : startValue,

    update(...args) {
      const newValue = instance(...args)
      setValue(newValue)
      return newValue
    }
  }
}
