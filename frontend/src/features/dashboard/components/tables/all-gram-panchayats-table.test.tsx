import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from '@jest/globals'
import { renderWithProviders } from '@/test/render-with-providers'
import type { EntityPerformance } from '../../types'
import { AllGramPanchayatsTable } from './all-gram-panchayats-table'

const rows: EntityPerformance[] = [
  {
    id: 'g1',
    name: 'GP One',
    coverage: 30,
    regularity: 90,
    continuity: 0,
    quantity: 50,
    compositeScore: 55,
    status: 'good',
  },
  {
    id: 'g2',
    name: 'GP Two',
    coverage: 95,
    regularity: 20,
    continuity: 0,
    quantity: 60,
    compositeScore: 62,
    status: 'needs-attention',
  },
]

describe('AllGramPanchayatsTable', () => {
  it('uses default name column label', () => {
    renderWithProviders(<AllGramPanchayatsTable data={rows} />)
    expect(screen.getByText('Gram Panchayat')).toBeTruthy()
  })

  it('respects custom name column label', () => {
    renderWithProviders(<AllGramPanchayatsTable data={rows} nameColumnLabel="Village" />)
    expect(screen.getByText('Village')).toBeTruthy()
  })

  it('sorts by quantity when Quantity header is clicked', () => {
    renderWithProviders(<AllGramPanchayatsTable data={rows} />)
    const quantityBtn = screen.getByRole('button', { name: /Quantity \(LPCD\)/ })

    fireEvent.click(quantityBtn)
    expect(quantityBtn.closest('th')?.getAttribute('aria-sort')).toBe('descending')

    fireEvent.click(quantityBtn)
    expect(quantityBtn.closest('th')?.getAttribute('aria-sort')).toBe('ascending')
  })

  it('applies maxItems after sorting', () => {
    renderWithProviders(<AllGramPanchayatsTable data={rows} maxItems={1} />)
    const quantityBtn = screen.getByRole('button', { name: /Quantity \(LPCD\)/ })
    fireEvent.click(quantityBtn)

    expect(screen.getByText('GP Two')).toBeTruthy()
    expect(screen.queryByText('GP One')).toBeNull()
  })
})
