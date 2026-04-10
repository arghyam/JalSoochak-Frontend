import { screen } from '@testing-library/react'
import { BarLineChart } from '@/shared/components/charts/bar-line-chart'
import { IngestionSuccessRateChart } from './ingestion-success-rate-chart'
import { renderWithProviders } from '@/test/render-with-providers'
import type { IngestionDataPoint } from '../../types/overview'

jest.mock('@/shared/components/charts/bar-line-chart', () => ({
  BarLineChart: jest.fn(() => <div data-testid="bar-line-chart-mock" />),
}))

const BarLineChartMock = BarLineChart as unknown as jest.Mock

describe('IngestionSuccessRateChart', () => {
  beforeEach(() => {
    BarLineChartMock.mockClear()
  })

  it('renders section heading and forwards data to BarLineChart', () => {
    const data: IngestionDataPoint[] = [
      { month: 'Jan', successfulIngestions: 10, failedIngestions: 1 },
    ]
    renderWithProviders(<IngestionSuccessRateChart data={data} />)
    expect(
      screen.getByRole('heading', { name: /ingestion success rate over time/i })
    ).toBeInTheDocument()
    expect(screen.getByTestId('bar-line-chart-mock')).toBeInTheDocument()
    expect(BarLineChartMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data,
        xKey: 'month',
        barKey: 'successfulIngestions',
        lineKey: 'failedIngestions',
      }),
      {}
    )
  })
})
