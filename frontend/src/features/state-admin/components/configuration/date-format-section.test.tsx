import { screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, jest } from '@jest/globals'
import { DateFormatSection } from './date-format-section'
import { renderWithProviders } from '@/test/render-with-providers'
import type { DateFormatConfig } from '../../types/configuration'

const emptyConfig: DateFormatConfig = { dateFormat: null, timeFormat: null, timezone: null }
const fullConfig: DateFormatConfig = {
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'HH:mm',
  timezone: 'Asia/Kolkata',
}

describe('DateFormatSection', () => {
  it('renders title', () => {
    renderWithProviders(
      <DateFormatSection title="Screen Date Format" value={emptyConfig} onChange={jest.fn()} />
    )
    expect(screen.getByText('Screen Date Format')).toBeTruthy()
  })

  it('renders only the date format select', () => {
    renderWithProviders(
      <DateFormatSection title="Screen Date Format" value={emptyConfig} onChange={jest.fn()} />
    )
    const selects = screen.getAllByRole('combobox')
    expect(selects).toHaveLength(1) // only date format select; time format + timezone kept for future integration
  })

  it('reflects existing date format value', () => {
    renderWithProviders(
      <DateFormatSection title="Screen Date Format" value={fullConfig} onChange={jest.fn()} />
    )
    const dateSelect = screen.getByRole('combobox', { name: /^date format$/i })
    expect(dateSelect.textContent).toContain('DD/MM/YYYY')
  })

  it('calls onChange with updated dateFormat when date select changes', async () => {
    const onChange = jest.fn()
    renderWithProviders(
      <DateFormatSection title="Screen Date Format" value={emptyConfig} onChange={onChange} />
    )
    const dateSelect = screen.getByRole('combobox', { name: /^date format$/i })
    fireEvent.click(dateSelect)
    const option = await screen.findByRole('option', { name: 'MM/DD/YYYY' })
    fireEvent.click(option)
    expect(onChange).toHaveBeenCalledWith({ ...emptyConfig, dateFormat: 'MM/DD/YYYY' })
  })

  it('calls onChange when date format is changed from an existing value', async () => {
    const onChange = jest.fn()
    renderWithProviders(
      <DateFormatSection title="Screen Date Format" value={fullConfig} onChange={onChange} />
    )
    const dateSelect = screen.getByRole('combobox', { name: /^date format$/i })
    fireEvent.click(dateSelect)
    const option = await screen.findByRole('option', { name: 'MM/DD/YYYY' })
    fireEvent.click(option)
    expect(onChange).toHaveBeenCalledWith({ ...fullConfig, dateFormat: 'MM/DD/YYYY' })
  })

  // Kept for future integration if needed — time format and timezone selects are currently hidden
  // it('calls onChange with updated timeFormat when time select changes', async () => { ... })
})
