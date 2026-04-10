import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from '@jest/globals'
import { renderWithProviders } from '@/test/render-with-providers'
import type { EntityPerformance } from '../../types'
import { AllBlocksTable } from './all-blocks-table'

const rows: EntityPerformance[] = [
  {
    id: 'b1',
    name: 'Block A',
    coverage: 50,
    regularity: 80,
    continuity: 0,
    quantity: 40,
    compositeScore: 60,
    status: 'good',
  },
  {
    id: 'b2',
    name: 'Block B',
    coverage: 90,
    regularity: 40,
    continuity: 0,
    quantity: 70,
    compositeScore: 65,
    status: 'needs-attention',
  },
]

function firstColumnOrder(container: HTMLElement) {
  return Array.from(container.querySelectorAll('tbody tr td:first-child')).map((cell) =>
    cell.textContent?.trim()
  )
}

describe('AllBlocksTable', () => {
  it('renders block names and metric cells', () => {
    renderWithProviders(<AllBlocksTable data={rows} />)

    expect(screen.getByText('Blocks')).toBeTruthy()
    expect(screen.getByText('Block A')).toBeTruthy()
    expect(screen.getByText('Block B')).toBeTruthy()
    expect(screen.getByText('50%')).toBeTruthy()
    expect(screen.getByText('40')).toBeTruthy()
  })

  it('limits visible rows when maxItems is set', () => {
    renderWithProviders(<AllBlocksTable data={rows} maxItems={1} />)

    expect(screen.getByText('Block A')).toBeTruthy()
    expect(screen.queryByText('Block B')).toBeNull()
  })

  it('sorts by coverage descending then ascending when header is toggled', () => {
    const { container } = renderWithProviders(<AllBlocksTable data={rows} />)
    const coverageBtn = screen.getByRole('button', { name: /Coverage/ })

    fireEvent.click(coverageBtn)
    expect(firstColumnOrder(container)).toEqual(['Block B', 'Block A'])
    expect(coverageBtn.closest('th')?.getAttribute('aria-sort')).toBe('descending')

    fireEvent.click(coverageBtn)
    expect(firstColumnOrder(container)).toEqual(['Block A', 'Block B'])
    expect(coverageBtn.closest('th')?.getAttribute('aria-sort')).toBe('ascending')
  })
})
