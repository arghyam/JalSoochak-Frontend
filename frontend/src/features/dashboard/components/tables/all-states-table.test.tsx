import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from '@jest/globals'
import { renderWithProviders } from '@/test/render-with-providers'
import type { EntityPerformance } from '../../types'
import { AllStatesTable } from './all-states-table'

const tableData: EntityPerformance[] = [
  {
    id: 's1',
    name: 'Alpha',
    coverage: 65,
    regularity: 70,
    continuity: 0,
    quantity: 52,
    compositeScore: 62,
    status: 'needs-attention',
  },
  {
    id: 's2',
    name: 'Beta',
    coverage: 88,
    regularity: 82,
    continuity: 0,
    quantity: 68,
    compositeScore: 79,
    status: 'good',
  },
  {
    id: 's3',
    name: 'Gamma',
    coverage: 41,
    regularity: 91,
    continuity: 0,
    quantity: 45,
    compositeScore: 59,
    status: 'critical',
  },
]

function getStateOrder(container: HTMLElement) {
  return Array.from(container.querySelectorAll('tbody tr td:first-child')).map((cell) =>
    cell.textContent?.trim()
  )
}

describe('AllStatesTable', () => {
  it('renders only the 4 expected columns', () => {
    renderWithProviders(<AllStatesTable data={tableData} />)

    expect(screen.getByText('State/UT')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Quantity (MLD)' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Quantity (LPCD)' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Regularity (%)' })).toBeTruthy()
    expect(screen.queryByText('Average (%)')).toBeNull()
  })

  it('sorts by Quantity (MLD) descending then ascending on repeated clicks', () => {
    const { container } = renderWithProviders(<AllStatesTable data={tableData} />)
    const quantityMldButton = screen.getByRole('button', { name: 'Quantity (MLD)' })

    fireEvent.click(quantityMldButton)
    expect(getStateOrder(container)).toEqual(['Beta', 'Alpha', 'Gamma'])
    expect(quantityMldButton.closest('th')?.getAttribute('aria-sort')).toBe('descending')

    fireEvent.click(quantityMldButton)
    expect(getStateOrder(container)).toEqual(['Gamma', 'Alpha', 'Beta'])
    expect(quantityMldButton.closest('th')?.getAttribute('aria-sort')).toBe('ascending')
  })

  it('sorts by Quantity (LPCD) and Regularity when their headers are clicked', () => {
    const { container } = renderWithProviders(<AllStatesTable data={tableData} />)
    const quantityLpcdButton = screen.getByRole('button', { name: 'Quantity (LPCD)' })
    const regularityButton = screen.getByRole('button', { name: 'Regularity (%)' })

    fireEvent.click(quantityLpcdButton)
    expect(getStateOrder(container)).toEqual(['Beta', 'Alpha', 'Gamma'])
    expect(quantityLpcdButton.closest('th')?.getAttribute('aria-sort')).toBe('descending')

    fireEvent.click(regularityButton)
    expect(getStateOrder(container)).toEqual(['Gamma', 'Beta', 'Alpha'])
    expect(regularityButton.closest('th')?.getAttribute('aria-sort')).toBe('descending')
    expect(quantityLpcdButton.closest('th')?.getAttribute('aria-sort')).toBeNull()
  })
})
