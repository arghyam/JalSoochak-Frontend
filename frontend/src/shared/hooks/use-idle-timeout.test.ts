import { renderHook } from '@testing-library/react'
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { useIdleTimeout } from './use-idle-timeout'

const IDLE_EVENTS = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll']

describe('useIdleTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it('does not attach idle event listeners when isActive is false', () => {
    const onIdle = jest.fn()
    const addSpy = jest.spyOn(document, 'addEventListener')

    renderHook(() => useIdleTimeout({ onIdle, isActive: false, timeout: 1000 }))

    const registeredEvents = addSpy.mock.calls.map((args) => args[0])
    IDLE_EVENTS.forEach((event) => {
      expect(registeredEvents).not.toContain(event)
    })
  })

  it('does not call onIdle when isActive is false and timeout elapses', () => {
    const onIdle = jest.fn()

    renderHook(() => useIdleTimeout({ onIdle, isActive: false, timeout: 1000 }))

    jest.advanceTimersByTime(2000)

    expect(onIdle).not.toHaveBeenCalled()
  })

  it('attaches all five event listeners when isActive is true', () => {
    const onIdle = jest.fn()
    const addSpy = jest.spyOn(document, 'addEventListener')

    renderHook(() => useIdleTimeout({ onIdle, isActive: true, timeout: 1000 }))

    IDLE_EVENTS.forEach((event) => {
      expect(addSpy).toHaveBeenCalledWith(event, expect.any(Function), { passive: true })
    })
  })

  it('calls onIdle after the timeout elapses with no activity', () => {
    const onIdle = jest.fn()

    renderHook(() => useIdleTimeout({ onIdle, isActive: true, timeout: 5000 }))

    jest.advanceTimersByTime(4999)
    expect(onIdle).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1)
    expect(onIdle).toHaveBeenCalledTimes(1)
  })

  it('resets the timer on activity, delaying the onIdle call', () => {
    const onIdle = jest.fn()

    renderHook(() => useIdleTimeout({ onIdle, isActive: true, timeout: 5000 }))

    jest.advanceTimersByTime(4000)
    document.dispatchEvent(new Event('mousemove'))

    // 4s after reset — should not have fired yet
    jest.advanceTimersByTime(4000)
    expect(onIdle).not.toHaveBeenCalled()

    // full timeout after last reset
    jest.advanceTimersByTime(1000)
    expect(onIdle).toHaveBeenCalledTimes(1)
  })

  it('removes all event listeners on unmount', () => {
    const onIdle = jest.fn()
    const removeSpy = jest.spyOn(document, 'removeEventListener')

    const { unmount } = renderHook(() => useIdleTimeout({ onIdle, isActive: true, timeout: 5000 }))

    unmount()

    IDLE_EVENTS.forEach((event) => {
      expect(removeSpy).toHaveBeenCalledWith(event, expect.any(Function))
    })
  })

  it('does not call onIdle after unmount', () => {
    const onIdle = jest.fn()

    const { unmount } = renderHook(() => useIdleTimeout({ onIdle, isActive: true, timeout: 1000 }))

    unmount()
    jest.advanceTimersByTime(5000)

    expect(onIdle).not.toHaveBeenCalled()
  })

  it('starts tracking when isActive changes from false to true', () => {
    const onIdle = jest.fn()

    const { rerender } = renderHook(
      ({ isActive }: { isActive: boolean }) => useIdleTimeout({ onIdle, isActive, timeout: 1000 }),
      { initialProps: { isActive: false } }
    )

    jest.advanceTimersByTime(2000)
    expect(onIdle).not.toHaveBeenCalled()

    rerender({ isActive: true })
    jest.advanceTimersByTime(1000)

    expect(onIdle).toHaveBeenCalledTimes(1)
  })

  it('stops tracking when isActive changes from true to false', () => {
    const onIdle = jest.fn()

    const { rerender } = renderHook(
      ({ isActive }: { isActive: boolean }) => useIdleTimeout({ onIdle, isActive, timeout: 1000 }),
      { initialProps: { isActive: true } }
    )

    rerender({ isActive: false })
    jest.advanceTimersByTime(5000)

    expect(onIdle).not.toHaveBeenCalled()
  })

  it('uses the latest onIdle callback without re-mounting listeners', () => {
    const onIdle1 = jest.fn()
    const onIdle2 = jest.fn()

    const { rerender } = renderHook(
      ({ onIdle }: { onIdle: () => void }) =>
        useIdleTimeout({ onIdle, isActive: true, timeout: 1000 }),
      { initialProps: { onIdle: onIdle1 } }
    )

    rerender({ onIdle: onIdle2 })
    jest.advanceTimersByTime(1000)

    expect(onIdle1).not.toHaveBeenCalled()
    expect(onIdle2).toHaveBeenCalledTimes(1)
  })
})
