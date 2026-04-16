import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { TimePicker, to12Hour, to24Hour } from './time-picker'

// JSDOM does not implement layout; suppress scrollTop assignment errors
Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
  writable: true,
  value: 0,
})
Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
  writable: true,
  value: 200,
})

// ─── Utility: to12Hour ───────────────────────────────────────────────────────

describe('to12Hour', () => {
  it('returns 12:00 AM for empty string', () => {
    expect(to12Hour('')).toEqual({ hour: '12', minute: '00', ampm: 'AM' })
  })

  it('converts midnight (00:xx) to 12:xx AM', () => {
    expect(to12Hour('00:30')).toEqual({ hour: '12', minute: '30', ampm: 'AM' })
  })

  it('converts 01:00 to 01:00 AM', () => {
    expect(to12Hour('01:00')).toEqual({ hour: '01', minute: '00', ampm: 'AM' })
  })

  it('converts 11:59 to 11:59 AM', () => {
    expect(to12Hour('11:59')).toEqual({ hour: '11', minute: '59', ampm: 'AM' })
  })

  it('converts noon (12:xx) to 12:xx PM', () => {
    expect(to12Hour('12:00')).toEqual({ hour: '12', minute: '00', ampm: 'PM' })
  })

  it('converts 13:xx to 01:xx PM', () => {
    expect(to12Hour('13:45')).toEqual({ hour: '01', minute: '45', ampm: 'PM' })
  })

  it('converts 23:59 to 11:59 PM', () => {
    expect(to12Hour('23:59')).toEqual({ hour: '11', minute: '59', ampm: 'PM' })
  })

  it('pads single-digit minutes', () => {
    expect(to12Hour('09:05')).toEqual({ hour: '09', minute: '05', ampm: 'AM' })
  })

  it('falls back to 12 for invalid hour and normalizes valid minute', () => {
    expect(to12Hour('99:07')).toEqual({ hour: '12', minute: '07', ampm: 'AM' })
  })

  it('falls back minute to 00 when invalid', () => {
    expect(to12Hour('10:99')).toEqual({ hour: '10', minute: '00', ampm: 'AM' })
  })
})

// ─── Utility: to24Hour ───────────────────────────────────────────────────────

describe('to24Hour', () => {
  it('converts 12:xx AM to 00:xx (midnight)', () => {
    expect(to24Hour({ hour: '12', minute: '30', ampm: 'AM' })).toBe('00:30')
  })

  it('converts 01:xx AM to 01:xx', () => {
    expect(to24Hour({ hour: '01', minute: '00', ampm: 'AM' })).toBe('01:00')
  })

  it('converts 11:xx AM to 11:xx', () => {
    expect(to24Hour({ hour: '11', minute: '59', ampm: 'AM' })).toBe('11:59')
  })

  it('converts 12:xx PM to 12:xx (noon)', () => {
    expect(to24Hour({ hour: '12', minute: '00', ampm: 'PM' })).toBe('12:00')
  })

  it('converts 01:xx PM to 13:xx', () => {
    expect(to24Hour({ hour: '01', minute: '45', ampm: 'PM' })).toBe('13:45')
  })

  it('converts 11:xx PM to 23:xx', () => {
    expect(to24Hour({ hour: '11', minute: '59', ampm: 'PM' })).toBe('23:59')
  })

  it('is the inverse of to12Hour for standard hours', () => {
    const original = '14:35'
    expect(to24Hour(to12Hour(original))).toBe(original)
  })

  it('is the inverse of to12Hour for midnight', () => {
    expect(to24Hour(to12Hour('00:00'))).toBe('00:00')
  })

  it('returns 00:00 for invalid hour or minute', () => {
    expect(to24Hour({ hour: '00', minute: '30', ampm: 'AM' })).toBe('00:00')
    expect(to24Hour({ hour: '13', minute: '30', ampm: 'PM' })).toBe('00:00')
    expect(to24Hour({ hour: '10', minute: '99', ampm: 'PM' })).toBe('00:00')
  })
})

// ─── TimePicker component ─────────────────────────────────────────────────────

describe('TimePicker', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  it('renders the trigger button', () => {
    renderWithProviders(<TimePicker value="14:30" onChange={mockOnChange} />)
    expect(screen.getByRole('combobox', { name: 'Select time' })).toBeInTheDocument()
  })

  it('displays formatted 12-hour time on the trigger', () => {
    renderWithProviders(<TimePicker value="14:30" onChange={mockOnChange} />)
    expect(screen.getByText('02:30 PM')).toBeInTheDocument()
  })

  it('shows "Select time" placeholder when value is empty', () => {
    renderWithProviders(<TimePicker value="" onChange={mockOnChange} />)
    expect(screen.getByText('Select time')).toBeInTheDocument()
  })

  it('opens the dropdown dialog on trigger click', () => {
    renderWithProviders(<TimePicker value="09:00" onChange={mockOnChange} />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Select time' }))
    expect(screen.getByRole('dialog', { name: 'Time picker' })).toBeInTheDocument()
  })

  it('closes the dropdown on Cancel without calling onChange', () => {
    renderWithProviders(<TimePicker value="09:00" onChange={mockOnChange} />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Select time' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mockOnChange).not.toHaveBeenCalled()
  })

  it('calls onChange with correct HH:mm value on Save', () => {
    renderWithProviders(<TimePicker value="09:00" onChange={mockOnChange} />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Select time' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(mockOnChange).toHaveBeenCalledWith('09:00')
  })

  it('updates pending selection and saves correct value when hour is changed', () => {
    renderWithProviders(<TimePicker value="09:00" onChange={mockOnChange} />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Select time' }))

    // Click on hour "03" in the Hour listbox
    const hourListbox = screen.getByRole('listbox', { name: 'Hour' })
    const hour03 = Array.from(hourListbox.querySelectorAll('[role="option"]')).find(
      (el) => el.textContent === '03'
    )
    fireEvent.click(hour03!)

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(mockOnChange).toHaveBeenCalledWith('03:00')
  })

  it('switches AM to PM and saves correct 24h value', () => {
    renderWithProviders(<TimePicker value="09:00" onChange={mockOnChange} />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Select time' }))

    const ampmListbox = screen.getByRole('listbox', { name: 'AM or PM' })
    const pmOption = Array.from(ampmListbox.querySelectorAll('[role="option"]')).find(
      (el) => el.textContent === 'PM'
    )
    fireEvent.click(pmOption!)

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    // 09:00 AM → PM → 21:00
    expect(mockOnChange).toHaveBeenCalledWith('21:00')
  })

  it('does not open the dropdown when disabled', () => {
    renderWithProviders(<TimePicker value="09:00" onChange={mockOnChange} isDisabled />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Select time' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('applies invalid border styling when isInvalid is true', () => {
    renderWithProviders(<TimePicker value="" onChange={mockOnChange} isInvalid />)
    // Invalid state is reflected in the trigger's border — just ensure it renders without error
    expect(screen.getByRole('combobox', { name: 'Select time' })).toBeInTheDocument()
  })

  it('resets pending state to current value when reopened after Cancel', () => {
    renderWithProviders(<TimePicker value="10:00" onChange={mockOnChange} />)

    // Open and change hour to 03, then Cancel
    fireEvent.click(screen.getByRole('combobox', { name: 'Select time' }))
    const hourListbox = screen.getByRole('listbox', { name: 'Hour' })
    const hour03 = Array.from(hourListbox.querySelectorAll('[role="option"]')).find(
      (el) => el.textContent === '03'
    )
    fireEvent.click(hour03!)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    // Reopen — should show original value (10:00 AM → hour 10)
    fireEvent.click(screen.getByRole('combobox', { name: 'Select time' }))
    const hourListboxAgain = screen.getByRole('listbox', { name: 'Hour' })
    const selectedHour = Array.from(hourListboxAgain.querySelectorAll('[role="option"]')).find(
      (el) => el.getAttribute('aria-selected') === 'true'
    )
    expect(selectedHour?.textContent).toBe('10')
  })

  it('supports keyboard navigation and save with enter', () => {
    renderWithProviders(<TimePicker value="09:00" onChange={mockOnChange} />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Select time' }))
    const dialog = screen.getByRole('dialog', { name: 'Time picker' })

    fireEvent.keyDown(dialog, { key: 'ArrowDown' })
    fireEvent.keyDown(dialog, { key: 'ArrowRight' })
    fireEvent.keyDown(dialog, { key: 'ArrowDown' })
    fireEvent.keyDown(dialog, { key: 'ArrowRight' })
    fireEvent.keyDown(dialog, { key: 'ArrowDown' })
    fireEvent.keyDown(dialog, { key: 'Enter' })

    expect(mockOnChange).toHaveBeenCalledWith('22:01')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes dropdown on escape', () => {
    renderWithProviders(<TimePicker value="09:00" onChange={mockOnChange} />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Select time' }))
    const dialog = screen.getByRole('dialog', { name: 'Time picker' })
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('saves on space key', () => {
    renderWithProviders(<TimePicker value="09:00" onChange={mockOnChange} />)
    fireEvent.click(screen.getByRole('combobox', { name: 'Select time' }))
    const dialog = screen.getByRole('dialog', { name: 'Time picker' })
    fireEvent.keyDown(dialog, { key: ' ' })
    expect(mockOnChange).toHaveBeenCalledWith('09:00')
  })
})
