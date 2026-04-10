import { screen } from '@testing-library/react'
import { describe, expect, it } from '@jest/globals'
import { renderWithProviders } from '@/test/render-with-providers'
import type { EntityPerformance } from '../../types'
import { PerformanceTable } from './performance-table'

const entities: EntityPerformance[] = [
  {
    id: 'e1',
    name: 'Entity One',
    coverage: 12.3,
    regularity: 45.6,
    continuity: 7.8,
    quantity: 100,
    compositeScore: 56.78,
    status: 'good',
  },
]

describe('PerformanceTable', () => {
  it('renders title and status chip for each row', () => {
    renderWithProviders(<PerformanceTable data={entities} title="Top performers" />)

    expect(screen.getByText('Top performers')).toBeTruthy()
    expect(screen.getByText('Entity One')).toBeTruthy()
    expect(screen.getByText('12.3%')).toBeTruthy()
    expect(screen.getByText('45.6%')).toBeTruthy()
    expect(screen.getByText('7.8')).toBeTruthy()
    expect(screen.getByText('56.78')).toBeTruthy()
    expect(screen.getByText('Good')).toBeTruthy()
  })

  it('renders empty table body when data is empty', () => {
    renderWithProviders(<PerformanceTable data={[]} title="Empty" />)

    expect(screen.queryByText('Entity One')).toBeNull()
    expect(screen.getByRole('columnheader', { name: 'Entity' })).toBeTruthy()
  })
})
