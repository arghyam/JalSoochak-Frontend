import { screen, fireEvent } from '@testing-library/react'
import { MeterChangeReasonsSection } from './meter-change-reasons-section'
import { renderWithProviders } from '@/test/render-with-providers'
import type { MeterChangeReason } from '../../types/configuration'

describe('MeterChangeReasonsSection', () => {
  it('renders reasons and propagates name changes', () => {
    const onChange = jest.fn()
    const reasons: MeterChangeReason[] = [{ id: 'r1', name: 'Replacement' }]
    renderWithProviders(
      <MeterChangeReasonsSection title="Meter reasons" reasons={reasons} onChange={onChange} />
    )
    expect(screen.getByText('Meter reasons')).toBeInTheDocument()
    fireEvent.change(screen.getByDisplayValue('Replacement'), { target: { value: 'New meter' } })
    expect(onChange).toHaveBeenCalledWith([{ id: 'r1', name: 'New meter' }])
  })

  it('removes a reason when delete is clicked', () => {
    const onChange = jest.fn()
    const reasons: MeterChangeReason[] = [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ]
    renderWithProviders(
      <MeterChangeReasonsSection title="Meter reasons" reasons={reasons} onChange={onChange} />
    )
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    fireEvent.click(deleteButtons[0])
    expect(onChange).toHaveBeenCalledWith([{ id: 'b', name: 'B' }])
  })

  it('does not delete the last row when required', () => {
    const onChange = jest.fn()
    const reasons: MeterChangeReason[] = [{ id: 'only', name: 'Solo' }]
    renderWithProviders(
      <MeterChangeReasonsSection
        title="Meter reasons"
        required
        reasons={reasons}
        onChange={onChange}
      />
    )
    const deleteBtn = screen.getByRole('button', { name: /delete/i })
    expect(deleteBtn).toBeDisabled()
    fireEvent.click(deleteBtn)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not add a new row when the last name is empty', () => {
    const onChange = jest.fn()
    const reasons: MeterChangeReason[] = [{ id: 'x', name: '   ' }]
    renderWithProviders(
      <MeterChangeReasonsSection title="Meter reasons" reasons={reasons} onChange={onChange} />
    )
    fireEvent.click(screen.getByRole('button', { name: /add new/i }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('shows validation error when provided', () => {
    renderWithProviders(
      <MeterChangeReasonsSection
        title="Meter reasons"
        reasons={[{ id: 'r1', name: '' }]}
        onChange={jest.fn()}
        errors={{ 'meterReason.r1': 'Required' }}
      />
    )
    expect(screen.getByText('Required')).toBeInTheDocument()
  })
})
