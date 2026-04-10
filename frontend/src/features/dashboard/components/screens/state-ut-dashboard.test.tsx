import { screen } from '@testing-library/react'
import { describe, expect, it, jest } from '@jest/globals'
import { renderWithProviders } from '@/test/render-with-providers'
import type { DashboardData, EntityPerformance } from '../../types'
import { StateUtDashboardScreen } from './state-ut-dashboard'

jest.mock('./reading-submission-status-card', () => ({
  ReadingSubmissionStatusCard: () => <div data-testid="reading-submission-status-card" />,
}))

jest.mock('../charts', () => ({
  ReadingSubmissionRateChart: () => <div data-testid="reading-submission-rate-chart" />,
}))

jest.mock('@/shared/components/common', () => {
  const actual = jest.requireActual<typeof import('@/shared/components/common')>(
    '@/shared/components/common'
  )
  return {
    ...actual,
    ChartEmptyState: () => <div data-testid="chart-empty-state" />,
  }
})

const baseDashboard: DashboardData = {
  level: 'state',
  kpis: {
    totalSchemes: 0,
    totalRuralHouseholds: 0,
    functionalTapConnections: 0,
  },
  mapData: [],
  demandSupply: [],
  readingSubmissionStatus: [{ label: 'On time', value: 10 }],
  readingCompliance: [],
  pumpOperators: [],
  waterSupplyOutages: [],
  topPerformers: [],
  worstPerformers: [],
  regularityData: [],
  continuityData: [],
}

const supplyRateRow: EntityPerformance = {
  id: 'x',
  name: 'Unit',
  coverage: 1,
  regularity: 2,
  continuity: 0,
  quantity: 3,
  compositeScore: 4,
  status: 'good',
}

describe('StateUtDashboardScreen', () => {
  it('renders submission status card and rate chart when supply data exists', () => {
    renderWithProviders(
      <StateUtDashboardScreen
        data={baseDashboard}
        supplySubmissionRateData={[supplyRateRow]}
        supplySubmissionRateLabel="Blocks"
      />
    )

    expect(screen.getByTestId('reading-submission-status-card')).toBeTruthy()
    expect(screen.getByTestId('reading-submission-rate-chart')).toBeTruthy()
    expect(screen.queryByTestId('chart-empty-state')).toBeNull()
  })

  it('renders empty state for submission rate when there is no data', () => {
    renderWithProviders(
      <StateUtDashboardScreen
        data={baseDashboard}
        supplySubmissionRateData={[]}
        supplySubmissionRateLabel="Districts"
      />
    )

    expect(screen.getByTestId('reading-submission-status-card')).toBeTruthy()
    expect(screen.getByTestId('chart-empty-state')).toBeTruthy()
    expect(screen.queryByTestId('reading-submission-rate-chart')).toBeNull()
  })
})
