import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { SchemeStatusDonutChart } from './scheme-status-donut-chart'

const mockEChartsWrapper = jest.fn((_props: { option: unknown }) => (
  <div data-testid="echarts-wrapper" />
))

jest.mock('@/shared/components/common/echarts-wrapper', () => ({
  EChartsWrapper: (props: { option: unknown }) => mockEChartsWrapper(props),
}))

beforeEach(() => {
  mockEChartsWrapper.mockClear()
})

type ChartOption = {
  tooltip: { formatter: (params: unknown) => string }
  series: [{ data: { name: string; itemStyle: { color: string } }[] }]
}

const lastOption = () => mockEChartsWrapper.mock.calls.at(-1)?.[0].option as ChartOption

describe('SchemeStatusDonutChart', () => {
  it('shows only no data text when the bucket list is empty', () => {
    renderWithProviders(<SchemeStatusDonutChart dimension="operatingStatus" data={[]} />)

    expect(screen.getByText('No data available')).toBeTruthy()
    expect(mockEChartsWrapper).not.toHaveBeenCalled()
  })

  it('shows only no data text when every bucket count is zero', () => {
    renderWithProviders(
      <SchemeStatusDonutChart
        dimension="operatingStatus"
        data={[{ code: 1, label: 'Operative', count: 0 }]}
      />
    )

    expect(screen.getByText('No data available')).toBeTruthy()
    expect(mockEChartsWrapper).not.toHaveBeenCalled()
  })

  it('renders the chart when data has positive values', () => {
    renderWithProviders(
      <SchemeStatusDonutChart
        dimension="operatingStatus"
        data={[
          { code: 1, label: 'Operative', count: 8 },
          { code: 0, label: 'Non-Operative', count: 2 },
        ]}
      />
    )

    expect(mockEChartsWrapper).toHaveBeenCalled()
    expect(screen.queryByText('No data available')).toBeNull()
  })

  it('colors slices by code rather than array index', () => {
    renderWithProviders(
      <SchemeStatusDonutChart
        dimension="operatingStatus"
        data={[
          { code: 2, label: 'Partially Operative', count: 3 },
          { code: 0, label: 'Non-Operative', count: 1 },
        ]}
      />
    )

    const [partiallyOperative, nonOperative] = lastOption().series[0].data
    // Colors must track the status, not slice position — a reordered array should not repaint.
    expect(partiallyOperative.itemStyle.color).not.toBe(nonOperative.itemStyle.color)
  })

  it('labels a slice from its code rather than the server-supplied string', () => {
    renderWithProviders(
      <SchemeStatusDonutChart
        dimension="operatingStatus"
        data={[{ code: 1, label: 'GARBAGE', count: 3 }]}
      />
    )

    expect(lastOption().series[0].data[0].name).toBe('Operative')
  })

  it('falls back to the server label for a code outside the vocabulary', () => {
    renderWithProviders(
      <SchemeStatusDonutChart
        dimension="operatingStatus"
        data={[{ code: 99, label: 'Future Status', count: 1 }]}
      />
    )

    expect(lastOption().series[0].data[0].name).toBe('Future Status')
  })

  it('labels an unrecorded status as Unknown', () => {
    renderWithProviders(
      <SchemeStatusDonutChart
        dimension="operatingStatus"
        data={[{ code: null, label: '', count: 1 }]}
      />
    )

    expect(lastOption().series[0].data[0].name).toBe('Unknown')
  })

  it('resolves the same code to a different label per dimension', () => {
    renderWithProviders(
      <SchemeStatusDonutChart dimension="workStatus" data={[{ code: 1, label: '', count: 1 }]} />
    )
    expect(lastOption().series[0].data[0].name).toBe('Ongoing')

    renderWithProviders(
      <SchemeStatusDonutChart
        dimension="operatingStatus"
        data={[{ code: 1, label: '', count: 1 }]}
      />
    )
    expect(lastOption().series[0].data[0].name).toBe('Operative')
  })

  it('escapes an unrecognised label before it reaches tooltip HTML', () => {
    renderWithProviders(
      <SchemeStatusDonutChart
        dimension="operatingStatus"
        data={[{ code: 99, label: '<img src=x onerror=alert(1)>', count: 1 }]}
      />
    )

    const html = lastOption().tooltip.formatter({ name: '<img src=x onerror=alert(1)>', value: 1 })
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img')
  })

  it('renders the count as an integer rather than a decimal', () => {
    renderWithProviders(
      <SchemeStatusDonutChart
        dimension="operatingStatus"
        data={[{ code: 1, label: 'Operative', count: 8 }]}
      />
    )

    const html = lastOption().tooltip.formatter({ name: 'Operative', value: 8 })
    expect(html).toContain('<br/>8 (')
    expect(html).not.toContain('8.0')
  })
})
