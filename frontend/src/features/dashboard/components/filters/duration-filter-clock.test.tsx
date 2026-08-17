import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { DateRangePicker } from '@/shared/components/common'
import type { DateRange } from '@/shared/components/common'
import { useDashboardDefaultDateRange } from '../../utils/default-duration'
import { renderWithProviders } from '@/test/render-with-providers'

/**
 * Mirrors exactly how dashboard-filters.tsx wires the duration control: the dashboard
 * default range supplies both the picker's ceiling (maxDate) and its placeholder range.
 * That composition is where the reported bug lived — the picker read the live clock for
 * presets while the ceiling came from a value only a midnight timer could refresh.
 */
function DurationFilterHarness() {
  const defaultDuration = useDashboardDefaultDateRange()
  const [selectedDuration, setSelectedDuration] = useState<DateRange | null>(null)

  return (
    <DateRangePicker
      value={selectedDuration}
      onChange={setSelectedDuration}
      maxDate={defaultDuration.endDate}
      defaultRange={defaultDuration}
      isFilter
    />
  )
}

const openPicker = () => fireEvent.click(screen.getByRole('button', { name: 'Duration' }))

// Scoped to the quick-ranges column: a preset label such as "Yesterday" also appears on
// the trigger chip once it has been applied, so an unscoped text query is ambiguous.
const presetButton = (label: string) => {
  const quickRangesColumn = screen.getByText('Quick ranges').parentElement as HTMLElement
  return within(quickRangesColumn).getByText(label).closest('button') as HTMLButtonElement
}

const clickPreset = (label: string) => fireEvent.click(presetButton(label))
const applyButton = () => screen.getByText('Apply').closest('button') as HTMLButtonElement
const dateInputs = () => screen.getAllByPlaceholderText('dd/mm/yyyy') as HTMLInputElement[]
const triggerLabel = () => screen.getByRole('button', { name: 'Duration' }).textContent

// A returning user is what surfaces the day change before the next poll.
const returnToTab = () =>
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })

describe('dashboard duration filter across a day change', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-08-08T10:00:00'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('re-resolves Yesterday and Today against the new day after the clock moves on', () => {
    renderWithProviders(<DurationFilterHarness />)

    // --- 8 Aug: pick Yesterday, which is 7 Aug. ---
    openPicker()
    clickPreset('Yesterday')

    const [startOnDayOne, endOnDayOne] = dateInputs()
    expect(startOnDayOne.value).toBe('07/08/2026')
    expect(endOnDayOne.value).toBe('07/08/2026')

    fireEvent.click(applyButton())
    expect(triggerLabel()).toBe('Yesterday')

    // --- Clock moves to 10 Aug with the tab still open and never reloaded. ---
    jest.setSystemTime(new Date('2026-08-10T10:00:00'))
    returnToTab()

    // The ceiling must follow the clock, otherwise every preset below gets clamped to it.
    openPicker()
    const nativeDateInputs = document.querySelectorAll('input[type="date"]')
    expect(nativeDateInputs[0]?.getAttribute('max')).toBe('2026-08-10')

    // Yesterday is now 9 Aug. Before the fix the stale 8 Aug ceiling clamped it to 8 Aug.
    clickPreset('Yesterday')
    const [startAfterJump, endAfterJump] = dateInputs()
    expect(startAfterJump.value).toBe('09/08/2026')
    expect(endAfterJump.value).toBe('09/08/2026')

    // Today is now 10 Aug, and applying it is possible. Before the fix Today also clamped
    // to 8 Aug, which equalled the committed value, so Apply was disabled and clicking
    // Today appeared to do nothing at all.
    clickPreset('Today')
    const [startForToday, endForToday] = dateInputs()
    expect(startForToday.value).toBe('10/08/2026')
    expect(endForToday.value).toBe('10/08/2026')
    expect(applyButton().disabled).toBe(false)

    fireEvent.click(applyButton())
    expect(triggerLabel()).toBe('Today')
  })

  it('corrects a stale ceiling on open alone, with no timer and no revisit event', () => {
    renderWithProviders(<DurationFilterHarness />)

    // 8 Aug: pick Yesterday (7 Aug), then leave the tab idle.
    openPicker()
    clickPreset('Yesterday')
    fireEvent.click(applyButton())

    // Two days pass with the tab frozen. Deliberately no timer is advanced and no
    // visibilitychange/focus is dispatched: this is the worst case where every passive
    // refresh mechanism failed, which is what produced the reported bug in production.
    jest.setSystemTime(new Date('2026-08-10T10:00:00'))

    // Simply opening the widget must re-read the clock and fix the ceiling on first paint.
    openPicker()
    const nativeDateInputs = document.querySelectorAll('input[type="date"]')
    expect(nativeDateInputs[0]?.getAttribute('max')).toBe('2026-08-10')

    clickPreset('Yesterday')
    const [startAfterOpen] = dateInputs()
    expect(startAfterOpen.value).toBe('09/08/2026')

    clickPreset('Today')
    const [startForToday] = dateInputs()
    expect(startForToday.value).toBe('10/08/2026')
    expect(applyButton().disabled).toBe(false)
  })

  it('moves the placeholder range to the new day when nothing is selected', () => {
    renderWithProviders(<DurationFilterHarness />)

    expect(triggerLabel()).toBe('08/08/2026')

    jest.setSystemTime(new Date('2026-08-10T10:00:00'))
    returnToTab()

    expect(triggerLabel()).toBe('10/08/2026')
  })

  it('accepts a typed date on the new day instead of clamping it to the old ceiling', () => {
    renderWithProviders(<DurationFilterHarness />)

    // On 8 Aug, 10 Aug is in the future and is clamped away.
    openPicker()
    const [startBeforeJump] = dateInputs()
    fireEvent.change(startBeforeJump, { target: { value: '10/08/2026' } })
    expect(startBeforeJump.value).toBe('08/08/2026')

    jest.setSystemTime(new Date('2026-08-10T10:00:00'))
    returnToTab()

    // Once the clock has moved, the same input is a valid present-day date.
    const [startAfterJump] = dateInputs()
    fireEvent.change(startAfterJump, { target: { value: '10/08/2026' } })
    expect(startAfterJump.value).toBe('10/08/2026')
  })
})

describe('dashboard duration filter preset availability', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-08-10T10:00:00'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('disables a preset that lies entirely beyond the ceiling instead of resolving it to a wrong date', () => {
    renderWithProviders(
      <DateRangePicker value={null} onChange={jest.fn()} isFilter maxDate="2026-08-08" />
    )

    openPicker()

    // Today (10 Aug) and Yesterday (9 Aug) both start after an 8 Aug ceiling, so neither
    // can be honoured. They are surfaced as unavailable rather than silently becoming 8 Aug.
    expect(presetButton('Today').disabled).toBe(true)
    expect(presetButton('Yesterday').disabled).toBe(true)

    // This week starts 10 Aug, also past the ceiling; last week starts 3 Aug and is fine.
    expect(presetButton('Last week').disabled).toBe(false)
  })

  it('does not change the draft when an unavailable preset is clicked', () => {
    renderWithProviders(
      <DateRangePicker value={null} onChange={jest.fn()} isFilter maxDate="2026-08-08" />
    )

    openPicker()
    const [startDate, endDate] = dateInputs()
    const startBeforeClick = startDate.value
    const endBeforeClick = endDate.value

    clickPreset('Today')

    expect(startDate.value).toBe(startBeforeClick)
    expect(endDate.value).toBe(endBeforeClick)
  })
})
