import { screen, fireEvent, within } from '@testing-library/react'
import { describe, expect, it, jest } from '@jest/globals'
import { MapLevelsSection } from './map-levels-section'
import { renderWithProviders } from '@/test/render-with-providers'

const baseProps = {
  title: 'LGD Map Levels',
  infoTooltip: 'Controls which LGD administrative levels are visible on the map.',
  levelCount: 3,
  levelLabelKey: 'configuration.sections.lgdMapLevels.displayLevelLabel',
  value: [true, true, false],
  onChange: jest.fn(),
}

describe('MapLevelsSection', () => {
  it('renders the section title', () => {
    renderWithProviders(<MapLevelsSection {...baseProps} />)
    expect(screen.getByText('LGD Map Levels')).toBeTruthy()
  })

  it('renders a radio group for each level', () => {
    renderWithProviders(<MapLevelsSection {...baseProps} />)
    const radioGroups = screen.getAllByRole('radiogroup')
    expect(radioGroups).toHaveLength(3)
  })

  it('reflects current values: Yes radio checked for true, No for false', () => {
    renderWithProviders(<MapLevelsSection {...baseProps} value={[true, false, false]} />)
    const yesRadios = screen.getAllByRole('radio', { name: /Yes/i }) as HTMLInputElement[]
    const noRadios = screen.getAllByRole('radio', { name: /No/i }) as HTMLInputElement[]
    expect(yesRadios[0].checked).toBe(true)
    expect(noRadios[1].checked).toBe(true)
    expect(noRadios[2].checked).toBe(true)
  })

  it('disables the radio inputs in the next level when the previous level is false', () => {
    renderWithProviders(<MapLevelsSection {...baseProps} value={[true, false, false]} />)
    const radioGroups = screen.getAllByRole('radiogroup')
    const thirdGroupRadios = within(radioGroups[2]).getAllByRole('radio') as HTMLInputElement[]
    expect(thirdGroupRadios.every((r) => r.disabled)).toBe(true)
  })

  it('calls onChange with cascade when No is selected for a middle level', () => {
    const onChange = jest.fn()
    renderWithProviders(
      <MapLevelsSection {...baseProps} value={[true, true, true]} onChange={onChange} />
    )
    const noRadios = screen.getAllByRole('radio', { name: /No/i })
    fireEvent.click(noRadios[1])
    const updated = (onChange.mock.calls[0] as [boolean[]])[0]
    expect(updated[1]).toBe(false)
    expect(updated[2]).toBe(false)
  })

  it('calls onChange with true when Yes is selected for a disabled level', () => {
    const onChange = jest.fn()
    renderWithProviders(
      <MapLevelsSection {...baseProps} value={[true, false, false]} onChange={onChange} />
    )
    const yesRadios = screen.getAllByRole('radio', { name: /Yes/i })
    fireEvent.click(yesRadios[1])
    const updated = (onChange.mock.calls[0] as [boolean[]])[0]
    expect(updated[1]).toBe(true)
  })
})
