import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { ActiveSchemesChart } from './active-schemes-chart'

const mockEChartsWrapper = jest.fn((_props: { option: unknown }) => (
  <div data-testid="echarts-wrapper" />
))

jest.mock('@/shared/components/common/echarts-wrapper', () => ({
  EChartsWrapper: (props: { option: unknown }) => mockEChartsWrapper(props),
}))

beforeEach(() => {
  mockEChartsWrapper.mockClear()
})

describe('ActiveSchemesChart', () => {
  it('shows only no data text when the pie data is empty', () => {
    renderWithProviders(<ActiveSchemesChart data={[]} />)

    expect(screen.getByText('No data available')).toBeTruthy()
    expect(mockEChartsWrapper).not.toHaveBeenCalled()
  })

  it('shows only no data text when the pie data contains only zero values', () => {
    renderWithProviders(<ActiveSchemesChart data={[{ label: 'Any', value: 0 }]} />)

    expect(screen.getByText('No data available')).toBeTruthy()
    expect(mockEChartsWrapper).not.toHaveBeenCalled()
  })

  it('hides the note when the pie data is empty', () => {
    renderWithProviders(
      <ActiveSchemesChart data={[]} note="Note: Schemes active for at least 30 days in a month." />
    )

    expect(screen.queryByText('Note: Schemes active for at least 30 days in a month.')).toBeNull()
  })

  it('hides the note when the pie data contains only zero values', () => {
    renderWithProviders(
      <ActiveSchemesChart
        data={[{ label: 'Any', value: 0 }]}
        note="Note: Schemes active for at least 30 days in a month."
      />
    )

    expect(screen.getByText('No data available')).toBeTruthy()
    expect(mockEChartsWrapper).not.toHaveBeenCalled()
    expect(screen.queryByText('Note: Schemes active for at least 30 days in a month.')).toBeNull()
  })

  it('renders chart when data has positive values', () => {
    renderWithProviders(
      <ActiveSchemesChart
        data={[
          { label: 'Active', value: 8 },
          { label: 'Inactive', value: 2 },
        ]}
      />
    )
    expect(mockEChartsWrapper).toHaveBeenCalled()
    expect(screen.queryByText('No data available')).toBeNull()
  })

  it('shows note when chart has data', () => {
    const note = 'Note: Schemes active for at least 30 days in a month.'
    renderWithProviders(<ActiveSchemesChart data={[{ label: 'Active', value: 5 }]} note={note} />)
    expect(screen.getByText(note)).toBeTruthy()
  })
})
