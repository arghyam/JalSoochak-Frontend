import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import type { EntityPerformance } from '../../types'
import { IndiaMapChart } from './india-map-chart'

const mockEChartsWrapper = jest.fn((_props: { option: unknown }) => (
  <div data-testid="echarts-wrapper" />
))
const mockGetMap = jest.fn()
const mockRegisterMap = jest.fn()

jest.mock('echarts', () => ({
  getMap: (...args: unknown[]) => mockGetMap(...args),
  registerMap: (...args: unknown[]) => mockRegisterMap(...args),
  format: {
    encodeHTML: (value: string) => value,
  },
}))

jest.mock('@/shared/components/common', () => ({
  EChartsWrapper: (props: { option: unknown }) => mockEChartsWrapper(props),
  Toggle: (props: {
    isChecked: boolean
    onChange: (event: { target: { checked: boolean } }) => void
  }) => (
    <input
      type="checkbox"
      checked={props.isChecked}
      onChange={(event) => props.onChange({ target: { checked: event.target.checked } })}
    />
  ),
}))

beforeEach(() => {
  mockEChartsWrapper.mockClear()
  mockGetMap.mockReset()
  mockRegisterMap.mockReset()
  mockGetMap.mockReturnValue(null)
})

const chartData: EntityPerformance[] = [
  {
    id: 'region-1',
    name: 'Region 1',
    coverage: 65,
    regularity: 72,
    continuity: 0,
    quantity: 54,
    compositeScore: 64,
    status: 'needs-attention',
  },
]

describe('IndiaMapChart', () => {
  it('shows no map available when a departmental map has no boundary geojson', () => {
    renderWithProviders(
      <IndiaMapChart
        data={chartData}
        mapName="tenant-boundary-department-201"
        fallbackToIndiaMap={false}
      />
    )

    expect(screen.getByText('Map currently unavailable')).toBeTruthy()
    expect(screen.queryByText('Loading map...')).toBeNull()
    expect(mockEChartsWrapper).not.toHaveBeenCalled()
    expect(mockRegisterMap).not.toHaveBeenCalled()
  })

  it('shows loading state while departmental boundaries are still loading', () => {
    renderWithProviders(
      <IndiaMapChart
        data={chartData}
        mapName="tenant-boundary-department-201"
        fallbackToIndiaMap={false}
        isLoading
      />
    )

    expect(screen.getByText('Loading map...')).toBeTruthy()
    expect(screen.queryByText('Map currently unavailable')).toBeNull()
    expect(mockEChartsWrapper).not.toHaveBeenCalled()
  })

  it('renders departmental maps immediately when boundary geojson is available', () => {
    renderWithProviders(
      <IndiaMapChart
        data={[
          {
            id: 'region-1',
            name: 'Lower Assam Zone',
            coverage: 65,
            regularity: 72,
            continuity: 0,
            quantity: 54,
            compositeScore: 64,
            status: 'needs-attention',
            boundaryGeoJson: {
              type: 'Polygon',
              coordinates: [
                [
                  [0, 0],
                  [1, 0],
                  [1, 1],
                  [0, 1],
                  [0, 0],
                ],
              ],
            },
          },
        ]}
        mapName="tenant-boundary-department-201"
        fallbackToIndiaMap={false}
      />
    )

    expect(screen.queryByText('Loading map...')).toBeNull()
    expect(mockEChartsWrapper).toHaveBeenCalled()
    expect(mockRegisterMap).toHaveBeenCalled()
    const latestOption = mockEChartsWrapper.mock.calls.at(-1)?.[0]?.option as {
      series?: Array<{ label?: { show?: boolean }; emphasis?: { label?: { show?: boolean } } }>
    }
    expect(latestOption.series?.[0]?.label?.show).toBe(true)
    expect(latestOption.series?.[0]?.emphasis?.label?.show).toBe(true)
    expect(mockRegisterMap).toHaveBeenCalledWith(
      'tenant-boundary-department-201',
      expect.objectContaining({
        features: [
          expect.objectContaining({
            properties: expect.objectContaining({
              name: 'Lower Assam Zone',
              cp: [0.5, 0.5],
            }),
          }),
        ],
      })
    )
  })

  it('shows MLD legend labels when switched to quantity view', () => {
    renderWithProviders(<IndiaMapChart data={chartData} />)

    const toggle = screen.getByRole('checkbox')
    fireEvent.click(toggle)

    expect(screen.getByText('>=90 MLD')).toBeTruthy()
    expect(screen.getByText('>=70 MLD')).toBeTruthy()
    expect(screen.getByText('>=50 MLD')).toBeTruthy()
    expect(screen.getByText('>=30 MLD')).toBeTruthy()
    expect(screen.getByText('>=0 MLD')).toBeTruthy()
  })

  it('uses bucket hover colors for selected regions instead of the default map select color', () => {
    mockGetMap.mockReturnValue({})

    renderWithProviders(<IndiaMapChart data={chartData} />)

    const latestOption = mockEChartsWrapper.mock.calls.at(-1)?.[0]?.option as {
      series?: Array<{
        selectedMode?: string | boolean
        data?: Array<{
          itemStyle?: { areaColor?: string }
          emphasis?: { itemStyle?: { areaColor?: string } }
          select?: { itemStyle?: { areaColor?: string } }
        }>
      }>
    }

    expect(latestOption.series?.[0]?.selectedMode).toBe('single')
    expect(latestOption.series?.[0]?.data?.[0]?.select?.itemStyle?.areaColor).toBe(
      latestOption.series?.[0]?.data?.[0]?.emphasis?.itemStyle?.areaColor
    )
    expect(latestOption.series?.[0]?.data?.[0]?.select?.itemStyle?.areaColor).not.toBe(
      latestOption.series?.[0]?.data?.[0]?.itemStyle?.areaColor
    )
  })
})
