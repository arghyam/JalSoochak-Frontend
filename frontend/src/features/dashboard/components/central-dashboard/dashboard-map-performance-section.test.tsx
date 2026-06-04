import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, jest } from '@jest/globals'
import { renderWithProviders } from '@/test/render-with-providers'
import type { EntityPerformance } from '../../types'
import { DashboardMapPerformanceSection } from './dashboard-map-performance-section'

jest.mock('../charts', () => ({
  IndiaMapChart: ({
    data,
    isFullscreen,
    mapViewMode,
  }: {
    data: EntityPerformance[]
    isFullscreen?: boolean
    mapViewMode?: 'state' | 'district'
  }) => (
    <div data-testid={isFullscreen ? 'fullscreen-map' : 'inline-map'}>
      {mapViewMode}:{data.length}
    </div>
  ),
}))

jest.mock('../tables', () => ({
  OverallPerformanceTable: ({
    data,
    autoHeightWithinMax,
    errorMessage,
  }: {
    data: EntityPerformance[]
    autoHeightWithinMax?: boolean
    errorMessage?: string
  }) => (
    <div data-testid="performance-table">
      {autoHeightWithinMax ? 'auto' : 'fixed'}:{data.length}
      {errorMessage ? `:${errorMessage}` : ''}
    </div>
  ),
}))

const rows: EntityPerformance[] = [
  {
    id: 'state-1',
    name: 'Alpha',
    coverage: 90,
    regularity: 80,
    continuity: 0,
    quantity: 70,
    compositeScore: 82,
    status: 'good',
  },
]

const mapProps = {
  data: rows,
  tooltipData: rows,
  isLoading: false,
  mapName: 'india',
  onStateClick: jest.fn(),
  onStateHover: jest.fn(),
  onFullscreenToggle: jest.fn(),
  isRegularityView: true,
  onRegularityViewChange: jest.fn(),
  hoveredRegion: null,
  showViewTabs: true,
  mapViewMode: 'district' as const,
  onMapViewModeChange: jest.fn(),
}

describe('DashboardMapPerformanceSection', () => {
  it('renders map and performance table for non-leaf dashboard selections', () => {
    renderWithProviders(
      <DashboardMapPerformanceSection
        activeLeafSelection=""
        shouldShowMapAlongsidePerformance
        isMapFullscreen={false}
        onMapFullscreenClose={jest.fn()}
        performanceSummaryCardMaxHeight={{ base: '420px', sm: '520px', lg: '710px' }}
        performanceSummaryTitle="Performance Summary"
        overallPerformanceTableData={rows}
        isOverallPerformanceLoading={false}
        overallPerformanceEntityLabel="State/UT"
        overallPerformanceScrollHeight="620px"
        onOverallPerformanceRowClick={jest.fn()}
        onOverallPerformanceRowHover={jest.fn()}
        mapProps={mapProps}
      />
    )

    expect(screen.getByTestId('inline-map').textContent).toBe('district:1')
    expect(screen.getByText('Performance Summary')).toBeTruthy()
    expect(screen.getByTestId('performance-table').textContent).toBe('fixed:1')
  })

  it('passes a neutral reload message to the performance table on API failure', () => {
    renderWithProviders(
      <DashboardMapPerformanceSection
        activeLeafSelection=""
        shouldShowMapAlongsidePerformance
        isMapFullscreen={false}
        onMapFullscreenClose={jest.fn()}
        performanceSummaryCardMaxHeight={{ base: '420px', sm: '520px', lg: '710px' }}
        performanceSummaryTitle="Performance Summary"
        overallPerformanceTableData={[]}
        isOverallPerformanceLoading={false}
        isOverallPerformanceError
        overallPerformanceEntityLabel="State/UT"
        overallPerformanceScrollHeight="620px"
        onOverallPerformanceRowClick={jest.fn()}
        onOverallPerformanceRowHover={jest.fn()}
        mapProps={mapProps}
      />
    )

    expect(screen.getByTestId('performance-table').textContent).toContain(
      'Failed to load data. Please reload the page.'
    )
  })

  it('hides the section for leaf selections and closes fullscreen from the overlay', () => {
    const onMapFullscreenClose = jest.fn()

    renderWithProviders(
      <DashboardMapPerformanceSection
        activeLeafSelection="Village 1"
        shouldShowMapAlongsidePerformance
        isMapFullscreen
        onMapFullscreenClose={onMapFullscreenClose}
        performanceSummaryCardMaxHeight={{ base: '420px', sm: '520px', lg: '710px' }}
        performanceSummaryTitle="Performance Summary"
        overallPerformanceTableData={rows}
        isOverallPerformanceLoading={false}
        overallPerformanceEntityLabel="State/UT"
        overallPerformanceScrollHeight="620px"
        onOverallPerformanceRowClick={jest.fn()}
        onOverallPerformanceRowHover={jest.fn()}
        mapProps={mapProps}
      />
    )

    expect(screen.queryByTestId('performance-table')).toBeNull()
    fireEvent.click(
      screen.getByTestId('fullscreen-map').parentElement?.parentElement
        ?.parentElement as HTMLElement
    )
    expect(onMapFullscreenClose).toHaveBeenCalledTimes(1)
  })

  it('focuses fullscreen map, closes on Escape, and restores focus when closed', async () => {
    const onMapFullscreenClose = jest.fn()
    const previousFocusTarget = document.createElement('button')
    document.body.appendChild(previousFocusTarget)
    previousFocusTarget.focus()

    const fullscreenProps = (
      <DashboardMapPerformanceSection
        activeLeafSelection=""
        shouldShowMapAlongsidePerformance
        isMapFullscreen
        onMapFullscreenClose={onMapFullscreenClose}
        performanceSummaryCardMaxHeight={{ base: '420px', sm: '520px', lg: '710px' }}
        performanceSummaryTitle="Performance Summary"
        overallPerformanceTableData={rows}
        isOverallPerformanceLoading={false}
        overallPerformanceEntityLabel="State/UT"
        overallPerformanceScrollHeight="620px"
        onOverallPerformanceRowClick={jest.fn()}
        onOverallPerformanceRowHover={jest.fn()}
        mapProps={mapProps}
      />
    )

    const { rerender, unmount } = renderWithProviders(fullscreenProps)
    const dialog = screen.getByRole('dialog')

    await waitFor(() => expect(document.activeElement).toBe(dialog))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onMapFullscreenClose).toHaveBeenCalledTimes(1)

    rerender(
      <DashboardMapPerformanceSection
        activeLeafSelection=""
        shouldShowMapAlongsidePerformance
        isMapFullscreen={false}
        onMapFullscreenClose={onMapFullscreenClose}
        performanceSummaryCardMaxHeight={{ base: '420px', sm: '520px', lg: '710px' }}
        performanceSummaryTitle="Performance Summary"
        overallPerformanceTableData={rows}
        isOverallPerformanceLoading={false}
        overallPerformanceEntityLabel="State/UT"
        overallPerformanceScrollHeight="620px"
        onOverallPerformanceRowClick={jest.fn()}
        onOverallPerformanceRowHover={jest.fn()}
        mapProps={mapProps}
      />
    )

    expect(document.activeElement).toBe(previousFocusTarget)
    unmount()
    previousFocusTarget.remove()
  })
})
