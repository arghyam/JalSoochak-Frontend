import { useSyncExternalStore } from 'react'
import { toLocalIsoDate } from '@/shared/utils/date-format'

/**
 * Single source of truth for "what local calendar day is it right now".
 *
 * The day changes once a day, so it is tracked with one timer aimed at the next local
 * midnight rather than by polling. The important part is that the timer is never
 * *trusted*: every time it fires — and whenever the tab is revisited, or the widget is
 * opened — the wall clock is re-read and the timer is re-armed from that reading.
 *
 * That distinction is what makes it correct. A timer measures elapsed time, so a
 * throttled, frozen or suspended background tab (or a machine asleep across midnight)
 * fires it late or not at all. Validating on fire means a late fire still lands on the
 * right day, and the event listeners below mean a tab that was never woken at all is
 * corrected the moment the user comes back to it.
 */
type DayChangeSubscriber = () => void

const subscribers = new Set<DayChangeSubscriber>()
let publishedIsoDate = toLocalIsoDate()
let timeoutId: ReturnType<typeof setTimeout> | null = null
let isWatching = false

// setHours with 24 rolls over to 00:00 of the following calendar day. The extra second
// keeps the callback just past the boundary rather than exactly on it.
const getDelayUntilNextMidnight = (baseDate = new Date()) => {
  const nextMidnight = new Date(baseDate)
  nextMidnight.setHours(24, 0, 0, 0)

  return Math.max(0, nextMidnight.getTime() - baseDate.getTime()) + 1000
}

const publishIfDayChanged = () => {
  const nextIsoDate = toLocalIsoDate()
  if (nextIsoDate === publishedIsoDate) {
    return
  }

  publishedIsoDate = nextIsoDate
  subscribers.forEach((notify) => notify())
}

const scheduleNextMidnight = () => {
  if (timeoutId !== null) {
    clearTimeout(timeoutId)
  }

  // Always measured from the current clock reading, so a re-arm after a late fire aims
  // at the correct next boundary instead of compounding the drift.
  timeoutId = setTimeout(handleMidnight, getDelayUntilNextMidnight())
}

function handleMidnight() {
  timeoutId = null
  revalidate()
}

const revalidate = () => {
  publishIfDayChanged()
  if (isWatching) {
    scheduleNextMidnight()
  }
}

const startWatching = () => {
  if (isWatching || typeof window === 'undefined') {
    return
  }

  isWatching = true
  scheduleNextMidnight()
  // Covers every case the timer cannot: a tab that was frozen, discarded and restored,
  // or on a machine that slept straight through midnight.
  document.addEventListener('visibilitychange', revalidate)
  window.addEventListener('focus', revalidate)
  window.addEventListener('pageshow', revalidate)
}

const stopWatching = () => {
  if (!isWatching) {
    return
  }

  isWatching = false
  if (timeoutId !== null) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
  document.removeEventListener('visibilitychange', revalidate)
  window.removeEventListener('focus', revalidate)
  window.removeEventListener('pageshow', revalidate)
}

const subscribe = (onStoreChange: DayChangeSubscriber) => {
  subscribers.add(onStoreChange)
  startWatching()
  // The day may have rolled over between module import and this first subscription.
  publishIfDayChanged()

  return () => {
    subscribers.delete(onStoreChange)
    if (subscribers.size === 0) {
      stopWatching()
    }
  }
}

const getSnapshot = () => publishedIsoDate

/**
 * Re-read the wall clock immediately and return the current local day.
 *
 * Call this at the moment of use — opening a date widget, for example — so correctness
 * never depends on a background timer having fired. Subscribers re-render only if the
 * day actually moved, so calling it on every interaction is free.
 */
export const syncCurrentIsoDate = (): string => {
  revalidate()
  return publishedIsoDate
}

/** Current local calendar day as `YYYY-MM-DD`, re-rendering only when the day changes. */
export function useCurrentIsoDate(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
