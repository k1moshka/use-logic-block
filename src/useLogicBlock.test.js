import { expect, test } from '@jest/globals'
import { renderHook, act } from '@testing-library/react-hooks'

import useLogicBlock from './useLogicBlock'

test('can handle block', () => {
  const instance = jest.fn(() => { return { a: 1 } })
  const blockDummy = jest.fn(() => instance)

  const { result: { current } } = renderHook(() => useLogicBlock(blockDummy))

  expect(current.value).toEqual({ a: 1 })
  expect(typeof current.update).toBe('function')

  // we do two instances of block for first render value and for continues working with instance
  expect(blockDummy.mock.calls.length).toBe(2)
  expect(instance.mock.calls.length).toBe(2)
})

test('can set initial value', () => {
  const instance = jest.fn(() => { return { a: 1 } })
  const blockDummy = jest.fn(() => instance)

  renderHook(() => useLogicBlock(blockDummy, { a: 222 }))

  expect(blockDummy.mock.calls.length).toBe(2)
  expect(blockDummy.mock.calls[0][0]).toEqual({ a: 222 })
})

test('can handle updates in block', () => {
  const instance = (handleUpdate) => () => { handleUpdate && handleUpdate(); return { a: 1 } }
  const blockDummy = jest.fn((_, { handleUpdate } = {}) => {
    return instance(handleUpdate)
  })
  const onUpdate = jest.fn(() => { })

  const { result } = renderHook(() => {
    return useLogicBlock(blockDummy, undefined, onUpdate)
  })
  expect(onUpdate.mock.calls.length).toBe(1)

  act(() => { result.current.update({}) })
  expect(onUpdate.mock.calls.length).toBe(2)
})

test('should update value if block changed', () => {
  const instance = (handleUpdate) => () => { handleUpdate && handleUpdate(); return { a: 1 } }
  const blockDummy1 = jest.fn((_, { handleUpdate } = {}) => {
    return instance(handleUpdate)
  })
  const blockDummy2 = jest.fn((_, { handleUpdate } = {}) => {
    return instance(handleUpdate)
  })

  const hook = renderHook(({ block }) => {
    return useLogicBlock(block)
  }, { initialProps: { block: blockDummy1 }})

  expect(blockDummy1.mock.calls.length).toBe(2)
  expect(blockDummy2.mock.calls.length).toBe(0)

  hook.rerender({ block: blockDummy2 })
  expect(blockDummy1.mock.calls.length).toBe(2)
  expect(blockDummy2.mock.calls.length).toBe(2)
})
