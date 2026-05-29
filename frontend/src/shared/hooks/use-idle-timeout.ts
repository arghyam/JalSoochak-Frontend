import { useEffect, useRef } from 'react'

interface UseIdleTimeoutOptions {
  timeout?: number
  onIdle: () => void
  isActive: boolean
}

const IDLE_EVENTS = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'] as const

export function useIdleTimeout({
  timeout = 30 * 60 * 1000,
  onIdle,
  isActive,
}: UseIdleTimeoutOptions): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onIdleRef = useRef(onIdle)

  // Keep ref current on every render so the timer callback never goes stale
  useEffect(() => {
    onIdleRef.current = onIdle
  })

  useEffect(() => {
    if (!isActive) return

    const resetTimer = () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        onIdleRef.current()
      }, timeout)
    }

    resetTimer()

    IDLE_EVENTS.forEach((event) => {
      document.addEventListener(event, resetTimer, { passive: true })
    })

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      IDLE_EVENTS.forEach((event) => {
        document.removeEventListener(event, resetTimer)
      })
    }
  }, [isActive, timeout])
}
