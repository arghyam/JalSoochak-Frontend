import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import type { WaterSupplyOutageData } from '../../types'
import { SupplyOutageReasonsChart } from './supply-outage-reasons-chart'

const mockEChartsWrapper = jest.fn((_props: { option: unknown }) => (
  <div data-testid="echarts-wrapper" />
))

jest.mock('@/shared/components/common/echarts-wrapper', () => ({
  EChartsWrapper: (props: { option: unknown }) => mockEChartsWrapper(props),
}))

beforeEach(() => {
  mockEChartsWrapper.mockClear()
})

const chartData: WaterSupplyOutageData[] = [
  {
    label: 'District A',
    reasons: {
      electrical_failure: 10,
      pipeline_break: 20,
      pump_failure: 30,
      valve_issue: 40,
      source_drying: 50,
      motor_burnout: 15,
    },
    electricityFailure: 10,
    pipelineLeak: 20,
    pumpFailure: 30,
    valveIssue: 40,
    sourceDrying: 50,
  },
]

describe('SupplyOutageReasonsChart', () => {
  it('shows tooltip on hover and keeps emphasis color same as base slice color', () => {
    renderWithProviders(<SupplyOutageReasonsChart data={chartData} />)

    const mainOption = (
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
      .find((option) => Array.isArray(option?.series) && option.series.length > 0)

    const pieSeries = mainOption?.series?.[0]
    expect(mainOption?.tooltip?.show).toBe(true)

    const formatter = mainOption?.tooltip?.formatter
    expect(typeof formatter).toBe('function')
    const tooltipText = formatter?.({ name: 'Motor burnout', value: 15 })
    const pieData = pieSeries?.data ?? []

    expect(tooltipText).toContain('Motor burnout')
    expect(pieData).toHaveLength(6)
    expect(tooltipText).toContain('15.0')
    expect(tooltipText).toContain('%')

    pieData.forEach((slice) => {
      expect(slice.emphasis?.itemStyle?.color).toBe(slice.itemStyle?.color)
    })
  })

  it('shows only no data text when the pie data is empty', () => {
    renderWithProviders(<SupplyOutageReasonsChart data={[]} />)

    expect(screen.getByText('No data available')).toBeTruthy()
    expect(mockEChartsWrapper).not.toHaveBeenCalled()
  })

  it('shows no data available when outage reasons are missing instead of using legacy fields', () => {
    renderWithProviders(
      <SupplyOutageReasonsChart
        data={[
          {
            label: 'District B',
            electricityFailure: 10,
            pipelineLeak: 20,
            pumpFailure: 30,
            valveIssue: 40,
            sourceDrying: 50,
          },
        ]}
      />
    )

    expect(screen.getByText('No data available')).toBeTruthy()
    expect(mockEChartsWrapper).not.toHaveBeenCalled()
    expect(screen.queryByText('Electrical failure')).toBeNull()
    expect(screen.queryByText('Pipeline leak')).toBeNull()
  })

  it('drops zero-total reasons from the pie and legend', () => {
    renderWithProviders(
      <SupplyOutageReasonsChart
        data={[
          {
            label: 'District A',
            reasons: {
              electrical_failure: 10,
              pipeline_break: 0,
            },
            electricityFailure: 0,
            pipelineLeak: 0,
            pumpFailure: 0,
            valveIssue: 0,
            sourceDrying: 0,
          },
          {
            label: 'District B',
            reasons: {
              electrical_failure: 5,
              pipeline_break: 0,
            },
            electricityFailure: 0,
            pipelineLeak: 0,
            pumpFailure: 0,
            valveIssue: 0,
            sourceDrying: 0,
          },
        ]}
      />
    )

    const mainOption = (
      mockEChartsWrapper.mock.calls as Array<
        [
          {
            option?: {
              series?: Array<{
                data?: Array<{
                  name?: string
                  value?: number
                }>
              }>
            }
          },
        ]
      >
    )
      .map(([props]) => props.option)
      .find((option) => Array.isArray(option?.series) && option.series.length > 0)

    const pieData = mainOption?.series?.[0]?.data ?? []

    expect(pieData).toEqual([
      expect.objectContaining({
        name: 'Electrical failure',
        value: 15,
      }),
    ])
    expect(screen.getByText('Electrical failure')).toBeTruthy()
    expect(screen.queryByText('Pipeline break')).toBeNull()
  })
})
