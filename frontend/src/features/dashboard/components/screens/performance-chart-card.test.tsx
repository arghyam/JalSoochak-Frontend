import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { cleanup, screen } from '@testing-library/react'
import i18n from '@/app/i18n'
import { renderWithProviders } from '@/test/render-with-providers'
import { PerformanceChartCard } from './performance-chart-card'

const mockMonthlyTrendChart = jest.fn((props: { xAxisLabel?: string }) => (
  <div data-testid="monthly-trend-chart">{props.xAxisLabel}</div>
))

jest.mock('../charts', () => ({
  MetricPerformanceChart: () => <div />,
  MonthlyTrendChart: (props: { xAxisLabel?: string }) => mockMonthlyTrendChart(props),
}))

const renderTimeChart = (metric: 'quantity' | 'regularity') =>
  renderWithProviders(
    <PerformanceChartCard
      title="Performance"
      viewByAriaLabel="View by"
      viewBy="time"
      onViewByChange={jest.fn()}
      data={[]}
      metric={metric}
      timeTrendData={[{ period: '2026-05-07', value: 10 }]}
      entityLabel="Entity"
      yAxisLabel="Value"
      seriesName="Series"
      cardHeight="400px"
      quantityTimeScaleTab="day"
      onQuantityTimeScaleTabChange={jest.fn()}
      regularityTimeScaleTab="quarter"
      onRegularityTimeScaleTabChange={jest.fn()}
    />
  )

describe('PerformanceChartCard time scale localization', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('hi')
  })

  afterEach(async () => {
    cleanup()
    await i18n.changeLanguage('en')
  })

  it('localizes quantity performance time scale labels', () => {
    renderTimeChart('quantity')

    expect(screen.getByTestId('monthly-trend-chart').textContent).toBe('दिन')
    expect(screen.getByRole('button', { name: 'दिन' }).textContent).toBe('D')
    expect(screen.getByRole('button', { name: 'तिमाही' }).textContent).toBe('Q')
  })

  it('localizes regularity performance time scale labels', () => {
    renderTimeChart('regularity')

    expect(screen.getByTestId('monthly-trend-chart').textContent).toBe('तिमाही')
    expect(screen.getByRole('button', { name: 'सप्ताह' }).textContent).toBe('W')
    expect(screen.getByRole('button', { name: 'वर्ष' }).textContent).toBe('Y')
  })
})
