import { screen, fireEvent } from '@testing-library/react'
import { HierarchySection } from './hierarchy-section'
import { renderWithProviders } from '@/test/render-with-providers'
import type { HierarchyLevel } from '../../types/hierarchy'

const levels: HierarchyLevel[] = [{ level: 1, name: 'Block' }]

describe('HierarchySection (configuration page)', () => {
  it('renders title and calls onChange when a level name changes', () => {
    const onChange = jest.fn()
    renderWithProviders(
      <HierarchySection
        sectionId="dept"
        title="Department levels"
        levels={levels}
        onChange={onChange}
        ariaLevelKey="configuration.sections.lgdHierarchy.levelLabel"
      />
    )
    expect(screen.getByText('Department levels')).toBeInTheDocument()
    fireEvent.change(screen.getByDisplayValue('Block'), { target: { value: 'Zone' } })
    expect(onChange).toHaveBeenCalledWith([{ level: 1, name: 'Zone' }])
  })
})
