import { expect, test } from '@jest/globals'
import { renderHook, act } from '@testing-library/react-hooks'
import { useMemo } from 'react'
import Block, { createHandler, value } from 'logic-block'

import useLogicBlock, { makeCleanBlockCopy } from './useLogicBlock'

test('can handle block', () => {
  const blockDummy = Block({ a: value(1) })

  const { result: { current } } = renderHook(() => useLogicBlock(blockDummy))

  expect(current.value).toEqual({ a: 1 })
  expect(typeof current.update).toBe('function')
})

test('can set initial value', () => {
  const init = { a: 222 }
  const blockDummy = Block({ a: value() })

  const { result } = renderHook(() => useLogicBlock(blockDummy, init))

  expect(result.current.value).toEqual({ a: 222 })
})

test('should rerender when initial value changed', () => {
  const block = Block({ a: value(1) })
  const { result } = renderHook((props) => {
    const { a } = props
    const initialValue = useMemo(() => {
      return {
        a
      }
    }, [a])
    return useLogicBlock(block, initialValue)
  }, { initialProps: { a: 1 } })

  act(() => { result.current.update({ a: 2 }) })
  act(() => { result.current.update({ c: 3 }) })
  act(() => { result.current.update({ b: 3 }) })

  expect(result.current.value).toEqual(
    expect.objectContaining({ a: 2 })
  )
})

test('can handle updates in block', () => {
  const blockDummy = Block({})
  const onUpdate = jest.fn(() => { })

  const { result } = renderHook(() => {
    return useLogicBlock(blockDummy, undefined, onUpdate)
  })
  expect(onUpdate.mock.calls.length).toBe(0)

  act(() => { result.current.update({}) })
  expect(onUpdate.mock.calls.length).toBe(1)
})

test('block handler does not run in calculating initial value', () => {
  const handlerFn = jest.fn()
  const block = Block({}, createHandler(handlerFn))

  renderHook(({ block }) => {
    return useLogicBlock(block)
  }, { initialProps: { block } })

  expect(handlerFn.mock.calls.length).toBe(1)
})

test('should update value if block changed', () => {
  const h1 = jest.fn()
  const blockDummy1 = Block({}, createHandler(h1))
  const h2 = jest.fn()
  const blockDummy2 = Block({}, createHandler(h2))

  const hook = renderHook(({ block }) => {
    return useLogicBlock(block)
  }, { initialProps: { block: blockDummy1 }})

  expect(h1.mock.calls.length).toBe(1)
  expect(h2.mock.calls.length).toBe(0)

  hook.rerender({ block: blockDummy2 })
  expect(h1.mock.calls.length).toBe(1)
  expect(h2.mock.calls.length).toBe(1)
})

test('does makeCleanBlockCopy works well', () => {
  const handlerA = jest.fn()
  const blockA = Block({ h1: value(2), h2: 2, c: { rr: value(33) } }, createHandler(handlerA))
  const handlerB = jest.fn()
  const blockB = Block({  }, createHandler(handlerB))
  const handlerC = jest.fn()
  const blockC = Block({ a: blockA, b: blockB, mmm: value(1), mm2: { a: 1 } }, createHandler(handlerC))
  const handlerD = jest.fn()
  const blockD = Block({ a: value('a'), b: { val: value('b') }, c: blockC }, createHandler(handlerD))


  const newBlock = makeCleanBlockCopy(blockD)

  const instance = newBlock()
  instance()
  expect(handlerA.mock.calls.length).toBe(0)
  expect(handlerB.mock.calls.length).toBe(0)
  expect(handlerC.mock.calls.length).toBe(0)
  expect(handlerD.mock.calls.length).toBe(0)
})
