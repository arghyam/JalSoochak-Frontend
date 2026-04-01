import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import type { ReadingSubmissionStatusData } from '../../types'
import { ReadingSubmissionStatusChart } from './reading-submission-status-chart'

const mockEChartsWrapper = jest.fn((_props: { option: unknown }) => (
  <div data-testid="echarts-wrapper" />
))

jest.mock('@/shared/components/common/echarts-wrapper', () => ({
  EChartsWrapper: (props: { option: unknown }) => mockEChartsWrapper(props),
}))

beforeEach(() => {
  mockEChartsWrapper.mockClear()
})

const chartData: ReadingSubmissionStatusData[] = [
  { label: 'Complaint Submission', value: 64 },
  { label: 'Anomalous Submissions', value: 36 },
]

describe('ReadingSubmissionStatusChart', () => {
  it('shows hover tooltip value and keeps same slice color on emphasis', () => {
    renderWithProviders(<ReadingSubmissionStatusChart data={chartData} height="336px" />)

    const option = (
      mockEChartsWrapper.mock.calls as Array<
        [
          {
            option?: {
              tooltip?: { show?: boolean; formatter?: (params: unknown) => string }
              series?: Array<{
                data?: Array<{
                  itemStyle?: { color?: string }
                  emphasis?: { itemStyle?: { color?: string } }
                }>
              }>
            }
          },
        ]
      >
    )
      .map(([props]) => props.option)
      .find((entry) => entry?.tooltip?.show === true)

    expect(option?.tooltip?.show).toBe(true)

    const formatter = option?.tooltip?.formatter
    expect(typeof formatter).toBe('function')
    const tooltipText = formatter?.({ name: 'Complaint Submission', value: 64 })
    expect(tooltipText).toContain('Complaint Submission')
    expect(tooltipText).toContain('64.0')
    expect(tooltipText).toContain('%')

    const pieData = option?.series?.[0]?.data ?? []
    pieData.forEach((slice) => {
      expect(slice.emphasis?.itemStyle?.color).toBe(slice.itemStyle?.color)
    })
  })

  it('shows only no data text when the pie data is empty', () => {
    renderWithProviders(<ReadingSubmissionStatusChart data={[]} height="336px" />)

    expect(screen.getByText('No data available')).toBeTruthy()
    expect(mockEChartsWrapper).not.toHaveBeenCalled()
  })

  it('shows only no data text when all pie values are zero', () => {
    renderWithProviders(
      <ReadingSubmissionStatusChart
        data={[
          { label: 'Complaint Submission', value: 0 },
          { label: 'Anomalous Submissions', value: 0 },
        ]}
        height="336px"
      />
    )

    expect(screen.getByText('No data available')).toBeTruthy()
    expect(mockEChartsWrapper).not.toHaveBeenCalled()
  })
})
