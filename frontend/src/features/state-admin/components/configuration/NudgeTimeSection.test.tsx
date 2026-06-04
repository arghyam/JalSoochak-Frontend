import { screen } from '@testing-library/react'
import { describe, expect, it, jest } from '@jest/globals'
import { NudgeTimeSection } from './nudge-time-section'
import { renderWithProviders } from '@/test/render-with-providers'

const baseProps = {
  title: 'Pump Operator Reminder Nudge Time',
  infoTooltip: 'Daily time at which automated reminders are sent.',
  required: true,
  value: '08:00',
  fieldId: 'nudge-time',
  errorKey: 'pumpOperatorReminderNudgeTime',
  error: undefined as string | undefined,
  onChange: jest.fn(),
  onClearError: jest.fn(),
}

describe('NudgeTimeSection', () => {
  it('renders the section title', () => {
    renderWithProviders(<NudgeTimeSection {...baseProps} />)
    expect(screen.getByText('Pump Operator Reminder Nudge Time')).toBeTruthy()
  })

  it('renders the TimePicker displaying the formatted time', () => {
    renderWithProviders(<NudgeTimeSection {...baseProps} value="08:30" />)
    // TimePicker trigger shows "08:30 AM" as the display text
    expect(screen.getByText('08:30 AM')).toBeTruthy()
  })

  it('does not show an error message when error is undefined', () => {
    renderWithProviders(<NudgeTimeSection {...baseProps} />)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows inline error message when error prop is set', () => {
    renderWithProviders(<NudgeTimeSection {...baseProps} error="Required field" />)
    expect(screen.getByText('Required field')).toBeTruthy()
  })
})
