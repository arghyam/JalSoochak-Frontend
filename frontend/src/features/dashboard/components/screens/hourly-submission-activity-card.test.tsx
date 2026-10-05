import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import type { HourlySubmissionActivityQueryParams } from '../../types'
import { HourlySubmissionActivityCard } from './hourly-submission-activity-card'

type QueryResult = {
  data?: { hourlyActivity: Array<{ hourStart: string; submissionCount: number }> }
  isLoading: boolean
  isError: boolean
}

const mockUseHourlySubmissionActivityQuery = jest.fn(
  (_options: { params: HourlySubmissionActivityQueryParams | null }): QueryResult => ({
    isLoading: false,
    isError: false,
  })
)

jest.mock('../../services/query/use-hourly-submission-activity-query', () => ({
  useHourlySubmissionActivityQuery: (options: {
    params: HourlySubmissionActivityQueryParams | null
  }) => mockUseHourlySubmissionActivityQuery(options),
}))

const mockChart = jest.fn((_props: { submissionsByHour: number[] }) => (
  <div data-testid="hourly-submission-chart" />
))

jest.mock('../charts/hourly-submission-chart', () => ({
  HourlySubmissionChart: (props: { submissionsByHour: number[] }) => mockChart(props),
}))

const params: HourlySubmissionActivityQueryParams = {
  tenantId: 16,
  lgdId: 10,
  startDate: '2026-03-01',
  endDate: '2026-03-31',
}

describe('HourlySubmissionActivityCard', () => {
  beforeEach(() => {
    mockUseHourlySubmissionActivityQuery.mockClear()
    mockChart.mockClear()
  })

  it('queries with the given scope and charts submissions by hour of day', () => {
    mockUseHourlySubmissionActivityQuery.mockReturnValue({
      data: {
        hourlyActivity: [
          { hourStart: '2026-03-01T09:00:00', submissionCount: 4 },
          { hourStart: '2026-03-02T09:00:00', submissionCount: 2 },
        ],
      },
      isLoading: false,
      isError: false,
    })

    renderWithProviders(<HourlySubmissionActivityCard params={params} />)

    expect(mockUseHourlySubmissionActivityQuery).toHaveBeenCalledWith({ params })
    expect(screen.getByText('Submissions by Hour of Day')).toBeTruthy()
    const submissionsByHour = mockChart.mock.calls.at(-1)?.[0].submissionsByHour
    expect(submissionsByHour?.[9]).toBe(6)
  })

  it('shows the empty state when nobody submitted in the range', () => {
    mockUseHourlySubmissionActivityQuery.mockReturnValue({
      data: { hourlyActivity: [] },
      isLoading: false,
      isError: false,
    })

    renderWithProviders(<HourlySubmissionActivityCard params={params} />)

    expect(screen.queryByTestId('hourly-submission-chart')).toBeNull()
  })

  it('shows the error message when the request fails', () => {
    mockUseHourlySubmissionActivityQuery.mockReturnValue({ isLoading: false, isError: true })

    renderWithProviders(
      <HourlySubmissionActivityCard params={params} errorMessage="Failed to load data." />
    )

    expect(screen.getByText('Failed to load data.')).toBeTruthy()
    expect(screen.queryByTestId('hourly-submission-chart')).toBeNull()
  })
})
