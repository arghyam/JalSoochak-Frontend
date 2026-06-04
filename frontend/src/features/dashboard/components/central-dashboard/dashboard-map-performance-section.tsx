import { Box, Grid, Portal, Text } from '@chakra-ui/react'
import { useEffect, useRef, type ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { IndiaMapChart } from '../charts'
import { OverallPerformanceTable } from '../tables'
import type { EntityPerformance } from '../../types'

type IndiaMapChartProps = ComponentProps<typeof IndiaMapChart>
type ResponsiveHeight = string | Record<string, string>

interface DashboardMapCardProps {
  height: ResponsiveHeight
  fullscreen?: boolean
  data: EntityPerformance[]
  tooltipData: EntityPerformance[]
  nationalBoundaryGeoJson?: IndiaMapChartProps['nationalBoundaryGeoJson']
  parentBoundaryGeoJson?: IndiaMapChartProps['parentBoundaryGeoJson']
  isLoading: boolean
  mapName: string
  onStateClick: NonNullable<IndiaMapChartProps['onStateClick']>
  onStateHover: NonNullable<IndiaMapChartProps['onStateHover']>
  onFullscreenToggle: NonNullable<IndiaMapChartProps['onFullscreenToggle']>
  isRegularityView: boolean
  onRegularityViewChange: NonNullable<IndiaMapChartProps['onRegularityViewChange']>
  hoveredRegion: EntityPerformance | null
  showViewTabs: boolean
  mapViewMode: NonNullable<IndiaMapChartProps['mapViewMode']>
  onMapViewModeChange: NonNullable<IndiaMapChartProps['onMapViewModeChange']>
  stateBorderData?: EntityPerformance[]
}

type DashboardMapPerformanceSectionMapProps = Omit<DashboardMapCardProps, 'height' | 'fullscreen'>

interface DashboardMapPerformanceSectionProps {
  activeLeafSelection: string
  shouldShowMapAlongsidePerformance: boolean
  isMapFullscreen: boolean
  onMapFullscreenClose: () => void
  performanceSummaryCardMaxHeight: ResponsiveHeight
  performanceSummaryTitle: string
  overallPerformanceTableData: EntityPerformance[]
  isOverallPerformanceLoading: boolean
  isOverallPerformanceError?: boolean
  overallPerformanceEntityLabel: string
  overallPerformanceScrollHeight: string
  onOverallPerformanceRowClick: (row: EntityPerformance) => void
  onOverallPerformanceRowHover: (row: EntityPerformance | null) => void
  mapProps: DashboardMapPerformanceSectionMapProps
}

function DashboardMapCard({
  height,
  fullscreen = false,
  data,
  tooltipData,
  nationalBoundaryGeoJson,
  parentBoundaryGeoJson,
  isLoading,
  mapName,
  onStateClick,
  onStateHover,
  onFullscreenToggle,
  isRegularityView,
  onRegularityViewChange,
  hoveredRegion,
  showViewTabs,
  mapViewMode,
  onMapViewModeChange,
  stateBorderData,
}: DashboardMapCardProps) {
  return (
    <Box
      bg="white"
      borderWidth="0.5px"
      borderRadius={fullscreen ? '16px' : '12px'}
      borderColor="#E4E4E7"
      pt="24px"
      pb="10px"
      pl="16px"
      pr="16px"
      w="full"
      h={height}
      minW={0}
      position="relative"
      boxShadow={fullscreen ? '0 24px 64px rgba(15, 23, 42, 0.16)' : 'none'}
    >
      <IndiaMapChart
        data={data}
        tooltipData={tooltipData}
        nationalBoundaryGeoJson={nationalBoundaryGeoJson}
        parentBoundaryGeoJson={parentBoundaryGeoJson}
        isLoading={isLoading}
        mapName={mapName}
        quantityViewUnit="percent"
        onStateClick={onStateClick}
        onStateHover={onStateHover}
        isFullscreen={fullscreen}
        onFullscreenToggle={onFullscreenToggle}
        isRegularityView={isRegularityView}
        onRegularityViewChange={onRegularityViewChange}
        hoveredRegion={hoveredRegion}
        showViewTabs={showViewTabs}
        mapViewMode={mapViewMode}
        onMapViewModeChange={onMapViewModeChange}
        stateBorderData={stateBorderData}
        height="100%"
      />
    </Box>
  )
}

export function DashboardMapPerformanceSection({
  activeLeafSelection,
  shouldShowMapAlongsidePerformance,
  isMapFullscreen,
  onMapFullscreenClose,
  performanceSummaryCardMaxHeight,
  performanceSummaryTitle,
  overallPerformanceTableData,
  isOverallPerformanceLoading,
  isOverallPerformanceError = false,
  overallPerformanceEntityLabel,
  overallPerformanceScrollHeight,
  onOverallPerformanceRowClick,
  onOverallPerformanceRowHover,
  mapProps,
}: DashboardMapPerformanceSectionProps) {
  const { t } = useTranslation('dashboard')
  const fullscreenMapContainerRef = useRef<HTMLDivElement>(null)
  const previousFocusedElementRef = useRef<HTMLElement | null>(null)
  const closeHandlerRef = useRef(onMapFullscreenClose)
  const isFullscreenOverlayOpen = shouldShowMapAlongsidePerformance && isMapFullscreen

  useEffect(() => {
    closeHandlerRef.current = onMapFullscreenClose
  }, [onMapFullscreenClose])

  useEffect(() => {
    if (!isFullscreenOverlayOpen) {
      return
    }

    previousFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeHandlerRef.current()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    const focusTimerId = window.setTimeout(() => {
      fullscreenMapContainerRef.current?.focus()
    }, 0)

    return () => {
      window.clearTimeout(focusTimerId)
      document.removeEventListener('keydown', handleKeyDown)

      if (
        previousFocusedElementRef.current &&
        document.contains(previousFocusedElementRef.current)
      ) {
        previousFocusedElementRef.current.focus()
      }

      previousFocusedElementRef.current = null
    }
  }, [isFullscreenOverlayOpen])

  return (
    <>
      {!activeLeafSelection ? (
        <Grid
          templateColumns={{
            base: '1fr',
            lg: shouldShowMapAlongsidePerformance ? 'repeat(2, minmax(0, 1fr))' : '1fr',
          }}
          gap={6}
          mb={6}
        >
          {shouldShowMapAlongsidePerformance ? (
            <DashboardMapCard height={{ base: '420px', sm: '520px', lg: '710px' }} {...mapProps} />
          ) : null}
          <Box
            bg="white"
            borderWidth="0.5px"
            borderRadius="12px"
            borderColor="#E4E4E7"
            pt="24px"
            pb="24px"
            pl="16px"
            pr="16px"
            w="full"
            h={shouldShowMapAlongsidePerformance ? performanceSummaryCardMaxHeight : 'auto'}
            maxH={performanceSummaryCardMaxHeight}
            minW={0}
          >
            <Text textStyle="bodyText3" fontWeight="400" mb={4}>
              {performanceSummaryTitle}
            </Text>
            <OverallPerformanceTable
              data={overallPerformanceTableData}
              isLoading={isOverallPerformanceLoading}
              errorMessage={
                isOverallPerformanceError
                  ? t('failedToLoadDataReload', {
                      defaultValue: 'Failed to load data. Please reload the page.',
                    })
                  : undefined
              }
              entityLabel={overallPerformanceEntityLabel}
              scrollMaxHeight={overallPerformanceScrollHeight}
              autoHeightWithinMax={!shouldShowMapAlongsidePerformance}
              onRowClick={onOverallPerformanceRowClick}
              onRowHover={onOverallPerformanceRowHover}
            />
          </Box>
        </Grid>
      ) : null}
      {shouldShowMapAlongsidePerformance && isMapFullscreen ? (
        <Portal>
          <Box
            position="fixed"
            inset={0}
            zIndex={1400}
            bg="rgba(15, 23, 42, 0.2)"
            p={{ base: 3, md: 6 }}
            display="flex"
            alignItems="center"
            justifyContent="center"
            onClick={onMapFullscreenClose}
          >
            <Box
              ref={fullscreenMapContainerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Fullscreen map"
              tabIndex={-1}
              w="full"
              maxW={{ base: '100%', lg: '1200px', xl: '1320px' }}
              h={{ base: '100%', md: '92vh' }}
              onClick={(event) => event.stopPropagation()}
            >
              <DashboardMapCard height="100%" fullscreen {...mapProps} />
            </Box>
          </Box>
        </Portal>
      ) : null}
    </>
  )
}
