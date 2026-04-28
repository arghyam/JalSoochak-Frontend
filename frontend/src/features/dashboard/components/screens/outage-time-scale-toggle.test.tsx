import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { TFunction } from 'i18next'
import { renderWithProviders } from '@/test/render-with-providers'
import { getOutageTimeScaleXAxisLabel, OutageTimeScaleToggle } from './outage-time-scale-toggle'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() },
}))

describe('getOutageTimeScaleXAxisLabel', () => {
  const t = ((key: string, opts?: { defaultValue?: string }) =>
    opts?.defaultValue ?? key) as TFunction<'dashboard'>

  it('uses time default when scale is undefined', () => {
    expect(getOutageTimeScaleXAxisLabel(undefined, t)).toBe('Time')
  })

  it('uses scale-specific defaults', () => {
    expect(getOutageTimeScaleXAxisLabel('day', t)).toBe('Day')
    expect(getOutageTimeScaleXAxisLabel('week', t)).toBe('Week')
    expect(getOutageTimeScaleXAxisLabel('month', t)).toBe('Month')
    expect(getOutageTimeScaleXAxisLabel('quarter', t)).toBe('Quarter')
    expect(getOutageTimeScaleXAxisLabel('year', t)).toBe('Year')
  })
})

describe('OutageTimeScaleToggle', () => {
  it('calls onChange when a different scale is selected', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    renderWithProviders(<OutageTimeScaleToggle value="day" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Weekly' }))
    expect(onChange).toHaveBeenCalledWith('week')
  })

  it('marks the active option with aria-pressed', () => {
    renderWithProviders(<OutageTimeScaleToggle value="month" onChange={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Monthly' }).getAttribute('aria-pressed')).toBe(
      'true'
    )
    expect(screen.getByRole('button', { name: 'Daily' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('renders quarterly and yearly options', () => {
    renderWithProviders(<OutageTimeScaleToggle value="day" onChange={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Quarterly' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Yearly' })).toBeTruthy()
  })

  it('applies custom aria-label on the group', () => {
    renderWithProviders(
      <OutageTimeScaleToggle value="day" onChange={jest.fn()} ariaLabel="Time range" />
    )
    expect(screen.getByLabelText('Time range')).toBeTruthy()
  })
})
