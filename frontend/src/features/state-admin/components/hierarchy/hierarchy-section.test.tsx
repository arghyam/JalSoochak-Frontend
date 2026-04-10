import { screen, fireEvent } from '@testing-library/react'
import { HierarchySection } from './hierarchy-section'
import { renderWithProviders } from '@/test/render-with-providers'
import type { HierarchyLevel } from '../../types/hierarchy'

function makeLevels(): HierarchyLevel[] {
  return [
    { level: 1, name: 'State' },
    { level: 2, name: 'District' },
  ]
}

describe('HierarchySection (hierarchy page)', () => {
  it('renders level inputs and calls onChange when name changes', () => {
    const onChange = jest.fn()
    renderWithProviders(
      <HierarchySection
        sectionId="lgd"
        title="LGD hierarchy"
        levels={makeLevels()}
        structuralChangesAllowed={false}
        onChange={onChange}
      />
    )
    expect(screen.getByText('LGD hierarchy')).toBeInTheDocument()
    const stateInput = screen.getByDisplayValue('State')
    fireEvent.change(stateInput, { target: { value: 'Province' } })
    expect(onChange).toHaveBeenCalledWith([
      { level: 1, name: 'Province' },
      { level: 2, name: 'District' },
    ])
  })

  it('adds a level when Add is clicked and structural changes are allowed', () => {
    const onChange = jest.fn()
    renderWithProviders(
      <HierarchySection
        sectionId="lgd"
        title="LGD"
        levels={makeLevels()}
        structuralChangesAllowed
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /add level/i }))
    expect(onChange).toHaveBeenCalledWith([
      { level: 1, name: 'State' },
      { level: 2, name: 'District' },
      { level: 3, name: '' },
    ])
  })

  it('deletes a level and reindexes', () => {
    const onChange = jest.fn()
    renderWithProviders(
      <HierarchySection
        sectionId="lgd"
        title="LGD"
        levels={makeLevels()}
        structuralChangesAllowed
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /delete level 2$/i }))
    expect(onChange).toHaveBeenCalledWith([{ level: 1, name: 'State' }])
  })

  it('shows field error and clears via onClearError when typing', () => {
    const onChange = jest.fn()
    const onClearError = jest.fn()
    renderWithProviders(
      <HierarchySection
        sectionId="lgd"
        title="LGD"
        levels={makeLevels()}
        structuralChangesAllowed={false}
        onChange={onChange}
        errors={{ 'lgd.0': 'Required' }}
        onClearError={onClearError}
      />
    )
    expect(screen.getByText('Required')).toBeInTheDocument()
    fireEvent.change(screen.getByDisplayValue('State'), { target: { value: 'X' } })
    expect(onClearError).toHaveBeenCalledWith('lgd.0')
  })
})
