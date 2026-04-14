import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import type { EntityPerformance } from '../../types'
import { PARENT_BOUNDARY_FEATURE_NAME } from '../../utils/map-registry'
import { IndiaMapChart } from './india-map-chart'

const mockEChartsWrapper = jest.fn((_props: Record<string, unknown>) => (
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
  EChartsWrapper: (props: Record<string, unknown>) => mockEChartsWrapper(props),
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
]

const chartDataWithoutBoundary = chartData.map(
  ({ boundaryGeoJson: _boundaryGeoJson, ...region }) => region
)

const parentBoundaryGeoJson = {
  type: 'Polygon',
  coordinates: [
    [
      [-1, -1],
      [2, -1],
      [2, 2],
      [-1, 2],
      [-1, -1],
    ],
  ],
}

describe('IndiaMapChart', () => {
  it('renders parent boundary overlay using the configured dark border color', () => {
    mockGetMap.mockReturnValue({})

    renderWithProviders(
      <IndiaMapChart
        data={chartData}
        mapName="tenant-boundary-department-201"
        parentBoundaryGeoJson={parentBoundaryGeoJson}
      />
    )

    const latestOption = mockEChartsWrapper.mock.calls.at(-1)?.[0]?.option as {
      series?: Array<{
        data?: Array<{ name?: string; silent?: boolean; itemStyle?: { borderColor?: string } }>
      }>
    }
    const overlay = latestOption.series?.[0]?.data?.find(
      (item) => item.name === PARENT_BOUNDARY_FEATURE_NAME
    )

    expect(overlay?.silent).toBe(true)
    expect(overlay?.itemStyle?.borderColor).toBe('#1c1c1c')
    expect(mockRegisterMap).toHaveBeenCalledWith(
      'tenant-boundary-department-201',
      expect.objectContaining({
        features: expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({
              name: PARENT_BOUNDARY_FEATURE_NAME,
            }),
          }),
        ]),
      })
    )
  })

  it('does not register a departmental map when only a parent overlay boundary is provided', () => {
    mockGetMap.mockReturnValue({})

    renderWithProviders(
      <IndiaMapChart
        data={chartDataWithoutBoundary}
        mapName="tenant-boundary-department-201"
        parentBoundaryGeoJson={parentBoundaryGeoJson}
      />
    )

    expect(mockRegisterMap).not.toHaveBeenCalled()

    renderWithProviders(
      <IndiaMapChart
        data={chartDataWithoutBoundary}
        mapName="tenant-boundary-department-201"
        parentBoundaryGeoJson={parentBoundaryGeoJson}
        isLoading
      />
    )

    const latestOption = mockEChartsWrapper.mock.calls.at(-1)?.[0]?.option as
      | {
          series?: Array<{
            data?: Array<{ name?: string; silent?: boolean; itemStyle?: { borderColor?: string } }>
          }>
        }
      | undefined
    const overlay = latestOption?.series?.[0]?.data?.find(
      (item) => item.name === PARENT_BOUNDARY_FEATURE_NAME
    )

    expect(overlay).toBeUndefined()
    expect(mockRegisterMap).not.toHaveBeenCalled()
  })

  it('shows no map available when a departmental map has no boundary geojson', () => {
    renderWithProviders(
      <IndiaMapChart data={chartDataWithoutBoundary} mapName="tenant-boundary-department-201" />
    )

    expect(screen.getByText('Map currently unavailable')).toBeTruthy()
    expect(screen.queryByText('Loading map...')).toBeNull()
    expect(mockEChartsWrapper).not.toHaveBeenCalled()
    expect(mockRegisterMap).not.toHaveBeenCalled()
  })

  it('shows loading state while departmental boundaries are still loading', () => {
    renderWithProviders(
      <IndiaMapChart
        data={chartDataWithoutBoundary}
        mapName="tenant-boundary-department-201"
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
      />
    )

    expect(screen.queryByText('Loading map...')).toBeNull()
    expect(mockEChartsWrapper).toHaveBeenCalled()
    expect(mockRegisterMap).toHaveBeenCalled()
    const latestOption = mockEChartsWrapper.mock.calls.at(-1)?.[0]?.option as {
      series?: Array<{ label?: { show?: boolean }; emphasis?: { label?: { show?: boolean } } }>
    }
    expect(latestOption.series?.[0]?.label?.show).toBe(false)
    expect(latestOption.series?.[0]?.emphasis?.label?.show).toBe(false)
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

  it('shows percent legend labels when switched to scheme quantity view', () => {
    renderWithProviders(<IndiaMapChart data={chartData} />)

    const toggle = screen.getByRole('checkbox')
    fireEvent.click(toggle)

    expect(screen.getByText('>=90%')).toBeTruthy()
    expect(screen.getByText('>=70%')).toBeTruthy()
    expect(screen.getByText('>=50%')).toBeTruthy()
    expect(screen.getByText('>=30%')).toBeTruthy()
    expect(screen.getByText('>=0%')).toBeTruthy()
  })

  it('shows percent legend labels even when quantity view unit is configured as MLD', () => {
    renderWithProviders(<IndiaMapChart data={chartData} quantityViewUnit="mld" />)

    const toggle = screen.getByRole('checkbox')
    fireEvent.click(toggle)

    expect(screen.getByText('>=90%')).toBeTruthy()
    expect(screen.getByText('>=70%')).toBeTruthy()
    expect(screen.getByText('>=50%')).toBeTruthy()
    expect(screen.getByText('>=30%')).toBeTruthy()
    expect(screen.getByText('>=0%')).toBeTruthy()
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

  it('keeps India map labels hidden on hover and selection states', () => {
    mockGetMap.mockReturnValue({})

    renderWithProviders(<IndiaMapChart data={chartData} />)

    const latestOption = mockEChartsWrapper.mock.calls.at(-1)?.[0]?.option as {
      series?: Array<{
        emphasis?: { label?: { show?: boolean; fontSize?: number; fontWeight?: string } }
        select?: { label?: { show?: boolean; fontSize?: number; fontWeight?: string } }
      }>
    }

    expect(latestOption.series?.[0]?.emphasis?.label?.show).toBe(false)
    expect(latestOption.series?.[0]?.select?.label?.show).toBe(false)
  })

  it('renders the map with the svg renderer', () => {
    mockGetMap.mockReturnValue({})

    renderWithProviders(<IndiaMapChart data={chartData} />)

    expect(mockEChartsWrapper).toHaveBeenCalled()
    expect(mockEChartsWrapper.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({
        renderer: 'svg',
      })
    )
  })

  it('binds handlers via onChartReady so they can refresh on navigation changes', () => {
    mockGetMap.mockReturnValue({})

    renderWithProviders(<IndiaMapChart data={chartData} />)

    const latestProps = mockEChartsWrapper.mock.calls.at(-1)?.[0] as Record<string, unknown>
    expect(latestProps.onChartReady).toBeTruthy()
    expect(latestProps.onChartReadyOnce).toBeUndefined()
  })
})
