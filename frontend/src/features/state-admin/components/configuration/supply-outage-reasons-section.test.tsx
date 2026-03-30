import { screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, jest } from '@jest/globals'
import { SupplyOutageReasonsSection } from './supply-outage-reasons-section'
import { renderWithProviders } from '@/test/render-with-providers'
import type { SupplyOutageReason } from '../../types/configuration'

const editableReason: SupplyOutageReason = {
  id: 'PUMP_FAILURE',
  name: 'Pump Failure',
  isDefault: true,
  editable: true,
}

const nonEditableReason: SupplyOutageReason = {
  id: 'OTHERS',
  name: 'Others',
  isDefault: true,
  editable: false,
}

describe('SupplyOutageReasonsSection', () => {
  it('renders all reasons', () => {
    renderWithProviders(
      <SupplyOutageReasonsSection
        title="Supply Outage Reasons"
        reasons={[editableReason, nonEditableReason]}
        onChange={jest.fn()}
      />
    )
    expect(screen.getByDisplayValue('Pump Failure')).toBeTruthy()
    expect(screen.getByDisplayValue('Others')).toBeTruthy()
  })

  it('shows delete button only for editable reasons', () => {
    renderWithProviders(
      <SupplyOutageReasonsSection
        title="Supply Outage Reasons"
        reasons={[editableReason, nonEditableReason]}
        onChange={jest.fn()}
      />
    )
    const deleteButtons = screen.queryAllByRole('button', { name: /delete/i })
    // Only editable reason gets a delete button
    expect(deleteButtons).toHaveLength(1)
  })

  it('calls onChange with reason removed when delete is clicked', () => {
    const onChange = jest.fn()
    renderWithProviders(
      <SupplyOutageReasonsSection
        title="Supply Outage Reasons"
        reasons={[editableReason, nonEditableReason]}
        onChange={onChange}
      />
    )
    const deleteButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)
    expect(onChange).toHaveBeenCalledWith([nonEditableReason])
  })

  it('calls onChange when reason name is edited', () => {
    const onChange = jest.fn()
    renderWithProviders(
      <SupplyOutageReasonsSection
        title="Supply Outage Reasons"
        reasons={[editableReason]}
        onChange={onChange}
      />
    )
    const input = screen.getByDisplayValue('Pump Failure')
    fireEvent.change(input, { target: { value: 'Pump Issue' } })
    expect(onChange).toHaveBeenCalledWith([{ ...editableReason, name: 'Pump Issue' }])
  })

  it('adds a new editable, non-default reason when Add New is clicked', () => {
    const onChange = jest.fn()
    renderWithProviders(
      <SupplyOutageReasonsSection
        title="Supply Outage Reasons"
        reasons={[editableReason]}
        onChange={onChange}
      />
    )
    const addButton = screen.getByRole('button', { name: /add new/i })
    fireEvent.click(addButton)
    const call = onChange.mock.calls[0][0] as SupplyOutageReason[]
    expect(call).toHaveLength(2)
    expect(call[1].isDefault).toBe(false)
    expect(call[1].editable).toBe(true)
    expect(call[1].name).toBe('')
  })

  it('does not add a new reason if the last reason name is empty', () => {
    const onChange = jest.fn()
    const emptyReason: SupplyOutageReason = { id: 'x', name: '', isDefault: false, editable: true }
    renderWithProviders(
      <SupplyOutageReasonsSection
        title="Supply Outage Reasons"
        reasons={[emptyReason]}
        onChange={onChange}
      />
    )
    const addButton = screen.getByRole('button', { name: /add new/i })
    fireEvent.click(addButton)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('shows field error message', () => {
    renderWithProviders(
      <SupplyOutageReasonsSection
        title="Supply Outage Reasons"
        reasons={[editableReason]}
        onChange={jest.fn()}
        errors={{ [`supplyOutageReason.${editableReason.id}`]: 'This field is required' }}
      />
    )
    expect(screen.getByText('This field is required')).toBeTruthy()
  })

  it('calls onClearError when reason name changes', () => {
    const onClearError = jest.fn()
    renderWithProviders(
      <SupplyOutageReasonsSection
        title="Supply Outage Reasons"
        reasons={[editableReason]}
        onChange={jest.fn()}
        onClearError={onClearError}
      />
    )
    const input = screen.getByDisplayValue('Pump Failure')
    fireEvent.change(input, { target: { value: 'Updated' } })
    expect(onClearError).toHaveBeenCalledWith(`supplyOutageReason.${editableReason.id}`)
  })
})
