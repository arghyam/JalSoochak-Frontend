import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, renderHook } from '@testing-library/react'
import { syncCurrentIsoDate, useCurrentIsoDate } from './use-current-iso-date'

// 10:00 on 8 Aug, so the armed midnight timer is 14h out.
const MS_TO_MIDNIGHT = 14 * 60 * 60 * 1000 + 2000

describe('useCurrentIsoDate', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-08-08T10:00:00'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns the current local calendar day', () => {
    const { result } = renderHook(() => useCurrentIsoDate())

    expect(result.current).toBe('2026-08-08')
  })

  it('advances when the midnight timer fires on time', () => {
    const { result } = renderHook(() => useCurrentIsoDate())

    act(() => {
      jest.advanceTimersByTime(MS_TO_MIDNIGHT)
    })

    expect(result.current).toBe('2026-08-09')
  })

  it('re-arms itself so a second midnight is caught too', () => {
    const { result } = renderHook(() => useCurrentIsoDate())

    act(() => {
      jest.advanceTimersByTime(MS_TO_MIDNIGHT)
    })
    act(() => {
      jest.advanceTimersByTime(24 * 60 * 60 * 1000)
    })

    expect(result.current).toBe('2026-08-10')
  })

  it('publishes the day the clock reports when the timer fires, not the day it was aimed at', () => {
    const { result } = renderHook(() => useCurrentIsoDate())

    // Armed on 8 Aug for 9 Aug's midnight, then the clock moves independently before the
    // timer gets to run — the shape of a frozen tab, a suspend, or a correction. Running
    // the pending timer lands the clock on 11 Aug locally, and the published day follows
    // that reading. An implementation that trusted its own schedule would say 9 Aug.
    jest.setSystemTime(new Date('2026-08-10T10:00:00'))
    act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(result.current).toBe('2026-08-11')
  })

  it('picks up a day change as soon as a hidden tab becomes visible again', () => {
    const { result } = renderHook(() => useCurrentIsoDate())

    jest.setSystemTime(new Date('2026-08-10T10:00:00'))
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(result.current).toBe('2026-08-10')
  })

  it('picks up a day change when the window regains focus', () => {
    const { result } = renderHook(() => useCurrentIsoDate())

    jest.setSystemTime(new Date('2026-08-10T10:00:00'))
    act(() => {
      window.dispatchEvent(new Event('focus'))
    })

    expect(result.current).toBe('2026-08-10')
  })

  it('picks up a day change on an explicit sync at the moment of use', () => {
    const { result } = renderHook(() => useCurrentIsoDate())

    jest.setSystemTime(new Date('2026-08-10T10:00:00'))
    let syncedIsoDate = ''
    act(() => {
      syncedIsoDate = syncCurrentIsoDate()
    })

    expect(syncedIsoDate).toBe('2026-08-10')
    expect(result.current).toBe('2026-08-10')
  })

  it('re-aims the timer at the correct boundary after a late correction', () => {
    const { result } = renderHook(() => useCurrentIsoDate())

    // Corrected to 10 Aug out-of-band; the next fire must be 10 Aug's midnight, not a
    // stale boundary carried over from when the timer was originally armed.
    jest.setSystemTime(new Date('2026-08-10T10:00:00'))
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    act(() => {
      jest.advanceTimersByTime(MS_TO_MIDNIGHT)
    })

    expect(result.current).toBe('2026-08-11')
  })

  it('does not re-render while the day is unchanged', () => {
    let renderCount = 0
    renderHook(() => {
      renderCount += 1
      return useCurrentIsoDate()
    })
    const rendersAfterMount = renderCount

    act(() => {
      jest.advanceTimersByTime(60 * 60 * 1000)
    })

    expect(renderCount).toBe(rendersAfterMount)
  })

  it('shares one timer across consumers and stops it when the last one unmounts', () => {
    const first = renderHook(() => useCurrentIsoDate())
    const second = renderHook(() => useCurrentIsoDate())

    expect(jest.getTimerCount()).toBe(1)

    first.unmount()
    expect(jest.getTimerCount()).toBe(1)

    second.unmount()
    expect(jest.getTimerCount()).toBe(0)
  })
})
