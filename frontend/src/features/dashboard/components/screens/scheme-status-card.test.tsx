import '@testing-library/jest-dom/jest-globals'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render-with-providers'
import { SchemeStatusCard } from './scheme-status-card'
import type { SchemeStatusCount, SchemeStatusDimension } from '@/shared/constants/scheme-status'

const mockDonutChart = jest.fn(
  (_props: { dimension: SchemeStatusDimension; data: SchemeStatusCount[] }) => (
    <div data-testid="donut" />
  )
)

jest.mock('../charts', () => ({
  SchemeStatusDonutChart: (props: {
    dimension: SchemeStatusDimension
    data: SchemeStatusCount[]
  }) => mockDonutChart(props),
}))

beforeEach(() => {
  mockDonutChart.mockClear()
})

const workStatusCounts: SchemeStatusCount[] = [{ code: 1, label: 'Ongoing', count: 5 }]
const operatingStatusCounts: SchemeStatusCount[] = [{ code: 1, label: 'Operative', count: 5 }]

describe('SchemeStatusCard', () => {
  it('defaults to the operating status dimension', () => {
    renderWithProviders(
      <SchemeStatusCard
        workStatusCounts={workStatusCounts}
        operatingStatusCounts={operatingStatusCounts}
        totalCount={5}
      />
    )

    expect(mockDonutChart).toHaveBeenCalledWith(
      expect.objectContaining({ dimension: 'operatingStatus', data: operatingStatusCounts })
    )
  })

  it('switches to work status buckets when the toggle is clicked, and back', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <SchemeStatusCard
        workStatusCounts={workStatusCounts}
        operatingStatusCounts={operatingStatusCounts}
        totalCount={5}
      />
    )

    await user.click(screen.getByText('Work'))
    expect(mockDonutChart).toHaveBeenLastCalledWith(
      expect.objectContaining({ dimension: 'workStatus', data: workStatusCounts })
    )

    await user.click(screen.getByText('Operating'))
    expect(mockDonutChart).toHaveBeenLastCalledWith(
      expect.objectContaining({ dimension: 'operatingStatus', data: operatingStatusCounts })
    )
  })

  it('keeps the total readout unchanged across a toggle switch', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <SchemeStatusCard
        workStatusCounts={workStatusCounts}
        operatingStatusCounts={operatingStatusCounts}
        totalCount={42}
      />
    )

    expect(screen.getByText('Total: 42')).toBeTruthy()
    await user.click(screen.getByText('Work'))
    expect(screen.getByText('Total: 42')).toBeTruthy()
  })

  it('shows a spinner and hides the toggle while loading', () => {
    renderWithProviders(
      <SchemeStatusCard workStatusCounts={[]} operatingStatusCounts={[]} totalCount={0} isLoading />
    )

    expect(screen.queryByText('Work')).toBeNull()
    expect(screen.queryByText('Operating')).toBeNull()
    expect(mockDonutChart).not.toHaveBeenCalled()
  })

  it('shows the error state and hides the toggle on error', () => {
    renderWithProviders(
      <SchemeStatusCard
        workStatusCounts={[]}
        operatingStatusCounts={[]}
        totalCount={0}
        errorMessage="Failed to load"
      />
    )

    expect(screen.getByText('Failed to load')).toBeTruthy()
    expect(screen.queryByText('Work')).toBeNull()
    expect(mockDonutChart).not.toHaveBeenCalled()
  })

  it('lets the user switch to a populated dimension when the selected one is empty', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <SchemeStatusCard
        workStatusCounts={workStatusCounts}
        operatingStatusCounts={[]}
        totalCount={5}
      />
    )

    // Operating status (the default) is empty, but the toggle must stay usable.
    expect(mockDonutChart).toHaveBeenCalledWith(
      expect.objectContaining({ dimension: 'operatingStatus', data: [] })
    )
    await user.click(screen.getByText('Work'))
    expect(mockDonutChart).toHaveBeenLastCalledWith(
      expect.objectContaining({ dimension: 'workStatus', data: workStatusCounts })
    )
  })

  it('renders both dimensions empty without crashing', () => {
    renderWithProviders(
      <SchemeStatusCard workStatusCounts={[]} operatingStatusCounts={[]} totalCount={0} />
    )

    expect(screen.getByText('Total: 0')).toBeTruthy()
  })

  it('honours an explicit default dimension override', () => {
    renderWithProviders(
      <SchemeStatusCard
        workStatusCounts={workStatusCounts}
        operatingStatusCounts={operatingStatusCounts}
        totalCount={5}
        defaultDimension="workStatus"
      />
    )

    expect(mockDonutChart).toHaveBeenCalledWith(
      expect.objectContaining({ dimension: 'workStatus', data: workStatusCounts })
    )
  })

  it('renders the tooltip only when content is supplied', () => {
    const { rerender } = renderWithProviders(
      <SchemeStatusCard
        workStatusCounts={workStatusCounts}
        operatingStatusCounts={operatingStatusCounts}
        totalCount={5}
      />
    )
    expect(screen.queryByLabelText(/info/i)).toBeNull()

    rerender(
      <SchemeStatusCard
        workStatusCounts={workStatusCounts}
        operatingStatusCounts={operatingStatusCounts}
        totalCount={5}
        tooltipContent="Explains the chart"
      />
    )
    expect(screen.getByLabelText(/info/i)).toBeTruthy()
  })
})
