import { screen } from '@testing-library/react'
import { describe, expect, it } from '@jest/globals'
import { renderWithProviders } from '@/test/render-with-providers'
import type { EntityPerformance } from '../../types'
import { AllDistrictsTable } from './all-districts-table'

const rows: EntityPerformance[] = [
  {
    id: 'd1',
    name: 'District X',
    coverage: 55,
    regularity: 66,
    continuity: 0,
    quantity: 44,
    compositeScore: 58,
    status: 'good',
  },
  {
    id: 'd2',
    name: 'District Y',
    coverage: 77,
    regularity: 88,
    continuity: 0,
    quantity: 33,
    compositeScore: 72,
    status: 'critical',
  },
]

describe('AllDistrictsTable', () => {
  it('renders district column headers and row data', () => {
    renderWithProviders(<AllDistrictsTable data={rows} />)

    expect(screen.getByText('District')).toBeTruthy()
    expect(screen.getByText('District X')).toBeTruthy()
    expect(screen.getByText('District Y')).toBeTruthy()
    expect(screen.getByText('55%')).toBeTruthy()
    expect(screen.getByText('44')).toBeTruthy()
    expect(screen.getByText('77%')).toBeTruthy()
  })

  it('slices rows when maxItems is provided', () => {
    renderWithProviders(<AllDistrictsTable data={rows} maxItems={1} />)

    expect(screen.getByText('District X')).toBeTruthy()
    expect(screen.queryByText('District Y')).toBeNull()
  })
})
