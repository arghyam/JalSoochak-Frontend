import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
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
})
