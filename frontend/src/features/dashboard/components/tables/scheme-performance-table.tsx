import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import {
  Box,
  Button,
  Flex,
  Icon,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { LuArrowLeft, LuArrowRight, LuChevronsLeft, LuChevronsRight } from 'react-icons/lu'
import { FiDownload } from 'react-icons/fi'
import type {
  PumpOperatorPerformanceData,
  SchemePerformanceSortBy,
  SuppliedLgdLocation,
} from '../../types'
import { ActionTooltip, ChartInfoTooltip, LoadingSpinner } from '@/shared/components/common'

const MAX_SCHEME_NAME_CHARS = 20

interface SchemePerformanceTableProps {
  data: PumpOperatorPerformanceData[]
  isLoading?: boolean
  errorMessage?: string
  title: string
  tooltipContent?: ReactNode
  maxItems?: number
  maxTableHeight?: string | number
  fillHeight?: boolean
  showVillageColumn?: boolean
  secondaryColumnLabel?: string
  showBlockColumn?: boolean
  blockColumnLabel?: string
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  sortBy?: SchemePerformanceSortBy
  sortDir?: 'asc' | 'desc'
  onSortChange?: (sortBy: SchemePerformanceSortBy, sortDir: 'asc' | 'desc') => void
  onDownload?: () => void
  isDownloading?: boolean
}

function SortIndicator({ isActive, direction }: { isActive: boolean; direction: 'asc' | 'desc' }) {
  const activeColor = 'var(--chakra-colors-primary-500)'
  const inactiveColor = 'var(--chakra-colors-neutral-500)'
  const topArrowFill = isActive && direction === 'asc' ? activeColor : inactiveColor
  const bottomArrowFill = isActive && direction === 'desc' ? activeColor : inactiveColor

  return (
    <Icon viewBox="0 0 16 16" boxSize="16px" aria-hidden flexShrink={0}>
      <path
        d="M8.00001 2C8.18565 2 8.36373 2.07902 8.49498 2.21967L11.295 5.21967C11.5683 5.51257 11.5683 5.98744 11.295 6.28034C11.0216 6.57321 10.5784 6.57321 10.305 6.28034L8.00001 3.81066L5.69498 6.28034C5.42161 6.57321 4.9784 6.57321 4.70502 6.28034C4.43166 5.98744 4.43166 5.51257 4.70502 5.21967L7.50504 2.21967C7.63629 2.07902 7.81437 2 8.00001 2Z"
        fill={topArrowFill}
      />
      <path
        d="M4.70502 9.71969C4.9784 9.42681 5.42161 9.42681 5.69498 9.71969L8.00001 12.1894L10.305 9.71969C10.5784 9.42681 11.0216 9.42681 11.295 9.71969C11.5683 10.0126 11.5683 10.4875 11.295 10.7803L8.49498 13.7803C8.22163 14.0732 7.77839 14.0732 7.50504 13.7803L4.70502 10.7803C4.43166 10.4875 4.43166 10.0126 4.70502 9.71969Z"
        fill={bottomArrowFill}
      />
    </Icon>
  )
}

const formatCellValue = (value: string | null | undefined) => value?.trim() || '-'

const formatReportingRateValue = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? `${Number(value.toFixed(2))}` : '-'

const formatWaterSupplied = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value)
    ? `${new Intl.NumberFormat('en-IN').format(Math.round(value))} L`
    : '-'

function truncateSchemeName(name: string): { display: string; isTruncated: boolean } {
  if (name.length <= MAX_SCHEME_NAME_CHARS) return { display: name, isTruncated: false }
  return { display: name.slice(0, MAX_SCHEME_NAME_CHARS - 3) + '...', isTruncated: true }
}

function renderLocationCell(
  locations: SuppliedLgdLocation[] | undefined,
  fallback: string
): ReactNode {
  if (!locations?.length) return fallback

  const first = locations[0].title
  if (locations.length === 1) {
    return (
      <Box maxW="100%" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" title={first}>
        {first}
      </Box>
    )
  }

  return (
    <Popover trigger="hover" placement="top" isLazy openDelay={0} closeDelay={150}>
      <PopoverTrigger>
        <Text
          textStyle="bodyText7"
          fontWeight="400"
          cursor="default"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {first}{' '}
          <Text as="span" color="primary.500" fontWeight="500">
            +{locations.length - 1}
          </Text>
        </Text>
      </PopoverTrigger>
      <PopoverContent w="auto" minW="200px" maxW="320px" boxShadow="md">
        <PopoverBody maxH="250px" overflowY="auto" p={2}>
          {locations.map((loc) => (
            <Text key={loc.lgdId} textStyle="bodyText7" py={1} px={1}>
              {loc.title}
            </Text>
          ))}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}

function useResizeObserver(ref: RefObject<HTMLDivElement | null>, callback: () => void) {
  useEffect(() => {
    const node = ref.current
    if (!node || typeof ResizeObserver === 'undefined') return

    const resizeObserver = new ResizeObserver(() => {
      callback()
    })
    resizeObserver.observe(node)
    return () => {
      resizeObserver.disconnect()
    }
  }, [callback, ref])
}

export function SchemePerformanceTable({
  data,
  isLoading = false,
  errorMessage,
  title,
  tooltipContent,
  maxItems,
  maxTableHeight = '330px',
  fillHeight = false,
  showVillageColumn = true,
  secondaryColumnLabel,
  showBlockColumn = true,
  blockColumnLabel,
  currentPage = 1,
  totalPages = 0,
  onPageChange,
  sortBy = 'reportingRate',
  sortDir = 'desc',
  onSortChange,
  onDownload,
  isDownloading = false,
}: SchemePerformanceTableProps) {
  const { t } = useTranslation('dashboard')
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const scrollbarTrackRef = useRef<HTMLDivElement | null>(null)
  const scrollbarThumbRef = useRef<HTMLDivElement | null>(null)
  const isDraggingThumb = useRef(false)
  const dragStartX = useRef(0)
  const dragStartLeft = useRef(0)
  const thumbLeftRef = useRef(0)
  const [hasHorizontalOverflow, setHasHorizontalOverflow] = useState(false)
  const [isThumbDragging, setIsThumbDragging] = useState(false)

  const safeMaxItems =
    typeof maxItems === 'number' && Number.isFinite(maxItems) ? Math.max(0, maxItems) : undefined
  const areaColumnCount = (showVillageColumn ? 1 : 0) + (showBlockColumn ? 1 : 0)
  const nameColumnWidth = '37.5%'
  const areaColumnWidth = areaColumnCount > 0 ? `${25 / areaColumnCount}%` : undefined
  const rows = typeof safeMaxItems === 'number' ? data.slice(0, safeMaxItems) : data
  const isEmpty = rows.length === 0

  const safeTotalPages = typeof totalPages === 'number' && totalPages > 0 ? totalPages : 0
  const safeCurrentPage =
    safeTotalPages > 0 ? Math.min(Math.max(1, currentPage), safeTotalPages) : 1
  const showPagination = safeTotalPages > 1

  const handleSort = (column: SchemePerformanceSortBy) => {
    if (!onSortChange) return
    if (sortBy !== column) {
      onSortChange(column, 'desc')
      return
    }
    onSortChange(column, sortDir === 'desc' ? 'asc' : 'desc')
  }

  const visiblePageNumbers = (() => {
    if (safeTotalPages <= 3) {
      return Array.from({ length: safeTotalPages }, (_, index) => index + 1) as (
        | number
        | 'ellipsis'
      )[]
    }
    const pages: (number | 'ellipsis')[] = []
    const startPage = Math.min(Math.max(1, safeCurrentPage), safeTotalPages - 1)
    const secondPage = startPage + 1
    pages.push(startPage, secondPage)
    if (secondPage < safeTotalPages) {
      pages.push('ellipsis', safeTotalPages)
    }
    return pages
  })()

  const handlePageChange = (page: number) => {
    if (!onPageChange) return
    const clampedPage = Math.min(Math.max(1, page), safeTotalPages)
    onPageChange(clampedPage)
    scrollContainerRef.current?.scrollTo({ top: 0 })
  }

  const getTrackWidth = () => scrollbarTrackRef.current?.getBoundingClientRect().width ?? 0

  const updateScrollbarThumb = useCallback(() => {
    const node = scrollContainerRef.current
    const thumb = scrollbarThumbRef.current

    if (!node) return

    const maxScroll = node.scrollWidth - node.clientWidth
    const trackWidth = getTrackWidth()
    const nextHasOverflow = maxScroll > 0

    setHasHorizontalOverflow(nextHasOverflow)

    if (!nextHasOverflow || !thumb || trackWidth === 0) {
      if (thumb && !nextHasOverflow) {
        thumb.style.width = '0px'
        thumb.style.left = '0px'
      }
      if (!nextHasOverflow) thumbLeftRef.current = 0
      return
    }

    const visibleRatio = node.clientWidth / node.scrollWidth
    const thumbWidth = Math.min(Math.max(trackWidth * visibleRatio, 48), trackWidth)
    const maxThumbTravel = Math.max(0, trackWidth - thumbWidth)
    const nextLeft = maxThumbTravel === 0 ? 0 : (node.scrollLeft / maxScroll) * maxThumbTravel

    thumb.style.width = `${thumbWidth}px`
    thumb.style.left = `${nextLeft}px`
    thumbLeftRef.current = nextLeft
  }, [])

  useResizeObserver(scrollContainerRef, updateScrollbarThumb)
  useResizeObserver(scrollbarTrackRef, updateScrollbarThumb)

  useEffect(() => {
    updateScrollbarThumb()
  }, [rows.length, showVillageColumn, showBlockColumn, hasHorizontalOverflow, updateScrollbarThumb])

  const handleThumbPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!hasHorizontalOverflow) return
    isDraggingThumb.current = true
    setIsThumbDragging(true)
    dragStartX.current = event.clientX
    dragStartLeft.current = thumbLeftRef.current
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleThumbPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingThumb.current) return
    const node = scrollContainerRef.current
    if (!node) return
    const trackWidth = getTrackWidth()
    if (trackWidth === 0) return
    const thumb = scrollbarThumbRef.current
    const thumbWidth = thumb?.getBoundingClientRect().width ?? 0
    const maxThumbTravel = Math.max(0, trackWidth - thumbWidth)
    if (maxThumbTravel === 0) return
    const delta = event.clientX - dragStartX.current
    const nextLeft = Math.min(Math.max(dragStartLeft.current + delta, 0), maxThumbTravel)
    const maxScroll = node.scrollWidth - node.clientWidth
    if (thumb) thumb.style.left = `${nextLeft}px`
    thumbLeftRef.current = nextLeft
    node.scrollLeft = (nextLeft / maxThumbTravel) * maxScroll
  }

  const handleThumbPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingThumb.current) return
    isDraggingThumb.current = false
    setIsThumbDragging(false)
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const handleThumbPointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingThumb.current) return
    isDraggingThumb.current = false
    setIsThumbDragging(false)
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const sortableHeaderButton = (column: SchemePerformanceSortBy, label: string) => (
    <Box
      as="button"
      type="button"
      onClick={() => handleSort(column)}
      display="inline-flex"
      alignItems="center"
      gap={1}
      cursor="pointer"
      textAlign="left"
      width="fit-content"
      bg="none"
      border="none"
      p={0}
    >
      <Box as="span">{label}</Box>
      <SortIndicator
        isActive={sortBy === column}
        direction={sortBy === column ? (sortDir ?? 'desc') : 'desc'}
      />
    </Box>
  )

  return (
    <Box
      borderRadius="lg"
      overflow="hidden"
      w="full"
      minW={0}
      h={fillHeight ? '100%' : 'auto'}
      display="flex"
      flexDirection="column"
    >
      <Flex align="center" justify="space-between" gap="6px" mb="16px">
        <Flex align="center" gap="6px" flex={1} minW={0}>
          <Box textStyle="bodyText3" fontWeight="400">
            {title}
          </Box>
          {tooltipContent ? (
            <ChartInfoTooltip
              tooltipContent={tooltipContent}
              ariaLabel={t('aria.chartInfo', { title, defaultValue: '{{title}} info' })}
            />
          ) : null}
        </Flex>
        {onDownload ? (
          <Button
            variant="secondary"
            size="sm"
            fontWeight="600"
            flexShrink={0}
            aria-label={t('pumpOperators.performanceTable.downloadAria', {
              defaultValue: 'Download schemes performance',
            })}
            onClick={onDownload}
            isLoading={isDownloading}
            loadingText={t('pumpOperators.performanceTable.downloading', {
              defaultValue: 'Downloading...',
            })}
          >
            <FiDownload
              aria-hidden="true"
              size={16}
              style={{ marginRight: '4px', flexShrink: 0 }}
            />
            {t('pumpOperators.performanceTable.download', { defaultValue: 'Download' })}
          </Button>
        ) : null}
      </Flex>

      {isLoading ? (
        <Box
          flex={fillHeight ? 1 : undefined}
          minH={fillHeight ? 0 : '200px'}
          h={fillHeight ? '100%' : '200px'}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <LoadingSpinner />
        </Box>
      ) : errorMessage || isEmpty ? (
        <Box
          flex={fillHeight ? 1 : undefined}
          minH={fillHeight ? 0 : '200px'}
          h={fillHeight ? '100%' : '200px'}
          display="flex"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          color="neutral.600"
        >
          <Text>
            {errorMessage ?? t('common:noDataAvailable', { defaultValue: 'No data available' })}
          </Text>
        </Box>
      ) : (
        <Box
          ref={scrollContainerRef}
          data-testid="scheme-performance-scroll-area"
          h={fillHeight ? undefined : maxTableHeight}
          maxH={fillHeight ? undefined : maxTableHeight}
          flex={fillHeight ? 1 : undefined}
          minH={fillHeight ? 0 : undefined}
          overflowY="auto"
          overflowX="auto"
          w="full"
          maxW="100%"
          minW={0}
          pr={0}
          pb={2}
          onScroll={updateScrollbarThumb}
          sx={{
            WebkitOverflowScrolling: 'touch',
            scrollbarGutter: 'stable',
            '&::-webkit-scrollbar': { width: '4px', height: '4px' },
            '&::-webkit-scrollbar-button': { display: 'none' },
            '&::-webkit-scrollbar-track': { bg: 'neutral.100', borderRadius: '999px' },
            '&::-webkit-scrollbar-thumb': { bg: 'neutral.300', borderRadius: '999px' },
            '&::-webkit-scrollbar-thumb:vertical': { bg: 'primary.300' },
            '&::-webkit-scrollbar-thumb:horizontal': { bg: 'primary.300' },
          }}
        >
          <Box w="full" minW="400px">
            <Table size="sm" w="full" minW="400px" sx={{ tableLayout: 'auto' }}>
              <colgroup>
                <col style={{ width: nameColumnWidth }} />
                {showVillageColumn ? <col style={{ width: areaColumnWidth }} /> : null}
                {showBlockColumn ? <col style={{ width: areaColumnWidth }} /> : null}
                <col style={{ width: '12.5%' }} />
                <col style={{ width: '25%' }} />
              </colgroup>
              <Thead
                sx={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  bg: 'white',
                  th: {
                    textStyle: 'bodyText7',
                    textTransform: 'none',
                    fontWeight: '500',
                    px: '10px',
                    py: 4,
                  },
                }}
              >
                <Tr>
                  {/* Scheme Name */}
                  <Th
                    textAlign="left"
                    whiteSpace="nowrap"
                    aria-sort={
                      sortBy === 'schemeName'
                        ? sortDir === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    {sortableHeaderButton(
                      'schemeName',
                      t('pumpOperators.performanceTable.columns.name', {
                        defaultValue: 'Scheme Name',
                      })
                    )}
                  </Th>

                  {/* Village / secondary area */}
                  {showVillageColumn ? (
                    <Th
                      textAlign="left"
                      whiteSpace="nowrap"
                      aria-sort={
                        sortBy === 'location'
                          ? sortDir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : undefined
                      }
                    >
                      {sortableHeaderButton(
                        'location',
                        secondaryColumnLabel ??
                          t('pumpOperators.performanceTable.columns.village', {
                            defaultValue: 'Village',
                          })
                      )}
                    </Th>
                  ) : null}

                  {/* Block*/}
                  {showBlockColumn ? (
                    <Th
                      textAlign="left"
                      whiteSpace="nowrap"
                      aria-sort={
                        sortBy === 'location'
                          ? sortDir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : undefined
                      }
                    >
                      {sortableHeaderButton(
                        'location',
                        blockColumnLabel ??
                          t('pumpOperators.performanceTable.columns.block', {
                            defaultValue: 'Block',
                          })
                      )}
                    </Th>
                  ) : null}

                  {/* Reporting Rate*/}
                  <Th
                    textAlign="center"
                    whiteSpace="normal"
                    aria-sort={
                      sortBy === 'reportingRate'
                        ? sortDir === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    {sortableHeaderButton(
                      'reportingRate',
                      t('pumpOperators.performanceTable.columns.reportingRate', {
                        defaultValue: 'Reporting Rate (%)',
                      })
                    )}
                  </Th>

                  {/* Water Supplied*/}
                  <Th
                    textAlign="center"
                    whiteSpace="normal"
                    aria-sort={
                      sortBy === 'totalWaterSupplied'
                        ? sortDir === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    {sortableHeaderButton(
                      'totalWaterSupplied',
                      t('pumpOperators.performanceTable.columns.waterSupplied', {
                        defaultValue: 'Water Supplied',
                      })
                    )}
                  </Th>
                </Tr>
              </Thead>
              <Tbody
                sx={{
                  td: {
                    textStyle: 'bodyText7',
                    fontWeight: '400',
                    px: 3,
                    py: 3,
                  },
                }}
              >
                {rows.map((operator) => {
                  const villageValue = formatCellValue(operator.village)
                  const blockValue = formatCellValue(operator.block)
                  const { display: nameDisplay, isTruncated } = truncateSchemeName(operator.name)

                  return (
                    <Tr key={operator.id} _odd={{ bg: 'primary.25' }}>
                      {/* Scheme Name*/}
                      <Td textAlign="left" overflow="hidden" lineHeight="20px" verticalAlign="top">
                        {isTruncated ? (
                          <ActionTooltip label={operator.name} openDelay={300}>
                            <Text
                              textStyle="bodyText7"
                              fontWeight="400"
                              whiteSpace="nowrap"
                              cursor="default"
                            >
                              {nameDisplay}
                            </Text>
                          </ActionTooltip>
                        ) : (
                          <Text textStyle="bodyText7" fontWeight="400" whiteSpace="nowrap">
                            {nameDisplay}
                          </Text>
                        )}
                      </Td>

                      {/* Village */}
                      {showVillageColumn ? (
                        <Td
                          textAlign="left"
                          overflow="hidden"
                          lineHeight="20px"
                          verticalAlign="top"
                        >
                          {renderLocationCell(operator.suppliedLocations, villageValue)}
                        </Td>
                      ) : null}

                      {/* Block */}
                      {showBlockColumn ? (
                        <Td
                          textAlign="left"
                          overflow="hidden"
                          lineHeight="20px"
                          verticalAlign="top"
                        >
                          {renderLocationCell(operator.suppliedLocations, blockValue)}
                        </Td>
                      ) : null}

                      {/* Reporting Rate — center-aligned */}
                      <Td textAlign="center">{formatReportingRateValue(operator.reportingRate)}</Td>

                      {/* Water Supplied — center-aligned with Indian formatting + unit */}
                      <Td textAlign="center">{formatWaterSupplied(operator.waterSupplied)}</Td>
                    </Tr>
                  )
                })}
              </Tbody>
            </Table>
          </Box>
        </Box>
      )}

      {!isLoading ? (
        <Box
          data-testid="scheme-performance-horizontal-scrollbar"
          mt="6px"
          display="none"
          opacity={hasHorizontalOverflow ? 1 : 0}
          pointerEvents={hasHorizontalOverflow ? 'auto' : 'none'}
        >
          <Box
            ref={scrollbarTrackRef}
            height="4px"
            bg="neutral.200"
            borderRadius="999px"
            position="relative"
          >
            <Box
              ref={scrollbarThumbRef}
              role="presentation"
              position="absolute"
              top={0}
              left={0}
              height="4px"
              width="0px"
              maxW="100%"
              bg="primary.300"
              borderRadius="999px"
              cursor={hasHorizontalOverflow ? (isThumbDragging ? 'grabbing' : 'grab') : 'default'}
              onPointerDown={handleThumbPointerDown}
              onPointerMove={handleThumbPointerMove}
              onPointerUp={handleThumbPointerUp}
              onPointerLeave={handleThumbPointerUp}
              onPointerCancel={handleThumbPointerCancel}
            />
          </Box>
        </Box>
      ) : null}

      {!isLoading && showPagination ? (
        <Flex
          mt={4}
          align="center"
          justify="center"
          gap={{ base: 1, sm: 1.5 }}
          wrap="wrap"
          w="full"
          maxW="100%"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePageChange(1)}
            isDisabled={safeCurrentPage === 1}
            px={{ base: 1.5, sm: 2 }}
            minW={0}
            aria-label={t('pumpOperators.performanceTable.pagination.first', {
              defaultValue: 'First page',
            })}
          >
            <Icon as={LuChevronsLeft} boxSize={4} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Icon as={LuArrowLeft} boxSize={4} />}
            onClick={() => handlePageChange(safeCurrentPage - 1)}
            isDisabled={safeCurrentPage === 1}
            px={{ base: 1.5, sm: 2 }}
            minW={0}
            aria-label={t('pumpOperators.details.pagination.previous', {
              defaultValue: 'Previous',
            })}
          >
            <Text as="span" display={{ base: 'none', sm: 'inline' }}>
              {t('pumpOperators.details.pagination.previous', { defaultValue: 'Previous' })}
            </Text>
          </Button>
          {visiblePageNumbers.map((pageNumber, index) =>
            pageNumber === 'ellipsis' ? (
              <Text key={`ellipsis-${index}`} px={1} color="neutral.500" aria-hidden="true">
                ...
              </Text>
            ) : (
              <Button
                key={pageNumber}
                variant="outline"
                size="sm"
                minW="34px"
                px={0}
                borderRadius="8px"
                borderColor="#D4D4D8"
                bg={safeCurrentPage === pageNumber ? '#3291D1' : 'white'}
                color={safeCurrentPage === pageNumber ? 'white' : 'neutral.700'}
                _hover={{
                  bg: safeCurrentPage === pageNumber ? '#3291D1' : 'neutral.100',
                }}
                onClick={() => handlePageChange(pageNumber)}
                flexShrink={0}
              >
                {pageNumber}
              </Button>
            )
          )}
          <Button
            variant="ghost"
            size="sm"
            rightIcon={<Icon as={LuArrowRight} boxSize={4} />}
            onClick={() => handlePageChange(safeCurrentPage + 1)}
            isDisabled={safeCurrentPage === safeTotalPages}
            px={{ base: 1.5, sm: 2 }}
            minW={0}
            aria-label={t('pumpOperators.details.pagination.next', {
              defaultValue: 'Next',
            })}
          >
            <Text as="span" display={{ base: 'none', sm: 'inline' }}>
              {t('pumpOperators.details.pagination.next', { defaultValue: 'Next' })}
            </Text>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePageChange(safeTotalPages)}
            isDisabled={safeCurrentPage === safeTotalPages}
            px={{ base: 1.5, sm: 2 }}
            minW={0}
            aria-label={t('pumpOperators.performanceTable.pagination.last', {
              defaultValue: 'Last page',
            })}
          >
            <Icon as={LuChevronsRight} boxSize={4} />
          </Button>
        </Flex>
      ) : null}
    </Box>
  )
}
