import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, screen } from '@testing-library/react'
import { DateRangePicker } from './date-range-picker'
import { renderWithProviders } from '@/test/render-with-providers'

describe('DateRangePicker', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-03-01T09:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('clamps a typed future end date back to today', () => {
    renderWithProviders(<DateRangePicker value={null} onChange={jest.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Duration' }))

    const [startDateInput, endDateInput] = screen.getAllByPlaceholderText('dd/mm/yyyy')
    fireEvent.change(startDateInput, { target: { value: '28/02/2026' } })
    fireEvent.change(endDateInput, { target: { value: '02/03/2026' } })

    expect((endDateInput as HTMLInputElement).value).toBe('01/03/2026')
  })

  it('caps the native end date picker at today', () => {
    const { container } = renderWithProviders(<DateRangePicker value={null} onChange={jest.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Duration' }))

    const endDateNativeInput = container.querySelectorAll('input[type="date"]')[1]

    expect(endDateNativeInput?.getAttribute('max')).toBe('2026-03-01')
  })

  it('uses the provided max date for the default filter range and native date caps', () => {
    const { container } = renderWithProviders(
      <DateRangePicker value={null} onChange={jest.fn()} isFilter={true} maxDate="2026-02-28" />
    )

    expect(screen.getByText('30/01/2026-28/02/2026')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Duration' }))

    const [startDateNativeInput, endDateNativeInput] =
      container.querySelectorAll('input[type="date"]')

    expect(startDateNativeInput?.getAttribute('max')).toBe('2026-02-28')
    expect(endDateNativeInput?.getAttribute('max')).toBe('2026-02-28')
  })

  it('clamps a typed date to the provided max date', () => {
    renderWithProviders(<DateRangePicker value={null} onChange={jest.fn()} maxDate="2026-02-28" />)

    fireEvent.click(screen.getByRole('button', { name: 'Duration' }))

    const [startDateInput, endDateInput] = screen.getAllByPlaceholderText('dd/mm/yyyy')
    fireEvent.change(startDateInput, { target: { value: '28/02/2026' } })
    fireEvent.change(endDateInput, { target: { value: '01/03/2026' } })

    expect((endDateInput as HTMLInputElement).value).toBe('28/02/2026')
  })

  it('caps the native start date picker at today', () => {
    const { container } = renderWithProviders(<DateRangePicker value={null} onChange={jest.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Duration' }))

    const startDateNativeInput = container.querySelector('input[type="date"]:not([min])')

    expect(startDateNativeInput?.getAttribute('max')).toBe('2026-03-01')
  })

  it('clamps a typed future start date back to today', () => {
    renderWithProviders(<DateRangePicker value={null} onChange={jest.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Duration' }))

    const [startDateInput] = screen.getAllByPlaceholderText('dd/mm/yyyy')
    fireEvent.change(startDateInput, { target: { value: '03/03/2026' } })

    expect((startDateInput as HTMLInputElement).value).toBe('01/03/2026')
  })

  it('keeps this week preset applyable by clamping the end date to today', () => {
    renderWithProviders(<DateRangePicker value={null} onChange={jest.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Duration' }))
    fireEvent.click(screen.getByText('This week'))

    const [startDateInput, endDateInput] = screen.getAllByPlaceholderText('dd/mm/yyyy')

    expect((startDateInput as HTMLInputElement).value).toBe('23/02/2026')
    expect((endDateInput as HTMLInputElement).value).toBe('01/03/2026')
    expect((screen.getByText('Apply').closest('button') as HTMLButtonElement).disabled).toBe(false)
  })

  it('keeps this month preset applyable by clamping the end date to today', () => {
    renderWithProviders(<DateRangePicker value={null} onChange={jest.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Duration' }))
    fireEvent.click(screen.getByText('This month'))

    const [startDateInput, endDateInput] = screen.getAllByPlaceholderText('dd/mm/yyyy')

    expect((startDateInput as HTMLInputElement).value).toBe('01/03/2026')
    expect((endDateInput as HTMLInputElement).value).toBe('01/03/2026')
    expect((screen.getByText('Apply').closest('button') as HTMLButtonElement).disabled).toBe(false)
  })

  it('uses the provided date format for manual input', () => {
    renderWithProviders(
      <DateRangePicker value={null} onChange={jest.fn()} dateFormat="MM-DD-YYYY" />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Duration' }))

    const [startDateInput, endDateInput] = screen.getAllByPlaceholderText('dd/mm/yyyy')
    fireEvent.change(startDateInput, { target: { value: '28/02/2026' } })
    fireEvent.change(endDateInput, { target: { value: '02/03/2026' } })

    expect((endDateInput as HTMLInputElement).value).toBe('01/03/2026')
  })

  it('shows the full year in the collapsed date range label', () => {
    renderWithProviders(
      <DateRangePicker
        value={{ startDate: '2026-02-01', endDate: '2026-02-28' }}
        onChange={jest.fn()}
      />
    )

    expect(screen.getByText('01/02/2026-28/02/2026')).toBeTruthy()
  })
})
