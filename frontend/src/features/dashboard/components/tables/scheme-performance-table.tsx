import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type RefObject,
} from 'react'
import {
  Box,
  Button,
  Flex,
  Icon,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useMediaQuery,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { LuArrowLeft, LuArrowRight, LuChevronsLeft, LuChevronsRight } from 'react-icons/lu'
import type { PumpOperatorPerformanceData } from '../../types'

interface SchemePerformanceTableProps {
  data: PumpOperatorPerformanceData[]
  title: string
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
}

type SortColumn = 'reportingRate' | 'waterSupplied' | null
type SortDirection = 'asc' | 'desc' | null

function SortIndicator({
  isActive,
  direction,
}: {
  isActive: boolean
  direction: Exclude<SortDirection, null>
}) {
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

const compareNullableNumbers = (
  left: number | null | undefined,
  right: number | null | undefined,
  direction: Exclude<SortDirection, null>
) => {
  const leftValue = typeof left === 'number' && Number.isFinite(left) ? left : null
  const rightValue = typeof right === 'number' && Number.isFinite(right) ? right : null

  if (leftValue === null && rightValue === null) {
    return 0
  }

  if (leftValue === null) {
    return 1
  }

  if (rightValue === null) {
    return -1
  }

  return direction === 'asc' ? leftValue - rightValue : rightValue - leftValue
}

const formatCellValue = (value: string | null | undefined) => value?.trim() || '-'

const formatMetricValue = (value: number | null | undefined, suffix = '') =>
  typeof value === 'number' && Number.isFinite(value) ? `${value}${suffix}` : '-'

function useResizeObserver(ref: RefObject<HTMLDivElement | null>, callback: () => void) {
  useEffect(() => {
    const node = ref.current
    if (!node || typeof ResizeObserver === 'undefined') {
      return
    }

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
  title,
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
}: SchemePerformanceTableProps) {
  const { t } = useTranslation('dashboard')
  const [enableHorizontalScroller] = useMediaQuery('(max-width: 1599px)')
  const [sortColumn, setSortColumn] = useState<SortColumn>('reportingRate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
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
  const responsiveTableMinWidth = enableHorizontalScroller ? 'max-content' : '100%'
  const sortedRows =
    sortColumn && sortDirection
      ? [...data].sort((a, b) => {
          return compareNullableNumbers(a[sortColumn], b[sortColumn], sortDirection)
        })
      : data
  const rows = typeof safeMaxItems === 'number' ? sortedRows.slice(0, safeMaxItems) : sortedRows
  const isEmpty = rows.length === 0

  const safeTotalPages = typeof totalPages === 'number' && totalPages > 0 ? totalPages : 0
  const safeCurrentPage =
    safeTotalPages > 0 ? Math.min(Math.max(1, currentPage), safeTotalPages) : 1
  const showPagination = safeTotalPages > 1

  const visiblePageNumbers = useMemo(() => {
    if (safeTotalPages <= 3) {
      return Array.from({ length: safeTotalPages }, (_, index) => index + 1)
    }
    if (safeCurrentPage <= 2) {
      return [1, 2, 3]
    }
    if (safeCurrentPage >= safeTotalPages - 1) {
      return [safeTotalPages - 2, safeTotalPages - 1, safeTotalPages]
    }
    return [safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1]
  }, [safeCurrentPage, safeTotalPages])

  const handlePageChange = (page: number) => {
    if (!onPageChange) {
      return
    }
    const clampedPage = Math.min(Math.max(1, page), safeTotalPages)
    onPageChange(clampedPage)
    scrollContainerRef.current?.scrollTo({ top: 0 })
  }

  const handleSort = (column: Exclude<SortColumn, null>) => {
    if (sortColumn !== column) {
      setSortColumn(column)
      setSortDirection('desc')
      return
    }
    setSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'))
  }

  const getTrackWidth = () => scrollbarTrackRef.current?.getBoundingClientRect().width ?? 0

  const updateScrollbarThumb = useCallback(() => {
    const node = scrollContainerRef.current
    const thumb = scrollbarThumbRef.current

    if (!node) {
      return
    }

    const maxScroll = node.scrollWidth - node.clientWidth
    const trackWidth = getTrackWidth()
    const nextHasOverflow = maxScroll > 0

    setHasHorizontalOverflow(nextHasOverflow)

    if (!nextHasOverflow || !thumb || trackWidth === 0) {
      if (thumb && !nextHasOverflow) {
        thumb.style.width = '0px'
        thumb.style.left = '0px'
      }
      if (!nextHasOverflow) {
        thumbLeftRef.current = 0
      }
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
    if (!hasHorizontalOverflow) {
      return
    }

    isDraggingThumb.current = true
    setIsThumbDragging(true)
    dragStartX.current = event.clientX
    dragStartLeft.current = thumbLeftRef.current
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleThumbPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingThumb.current) {
      return
    }

    const node = scrollContainerRef.current
    if (!node) {
      return
    }

    const trackWidth = getTrackWidth()
    if (trackWidth === 0) {
      return
    }

    const thumb = scrollbarThumbRef.current
    const thumbWidth = thumb?.getBoundingClientRect().width ?? 0
    const maxThumbTravel = Math.max(0, trackWidth - thumbWidth)

    if (maxThumbTravel === 0) {
      return
    }

    const delta = event.clientX - dragStartX.current
    const nextLeft = Math.min(Math.max(dragStartLeft.current + delta, 0), maxThumbTravel)
    const maxScroll = node.scrollWidth - node.clientWidth

    if (thumb) {
      thumb.style.left = `${nextLeft}px`
    }

    thumbLeftRef.current = nextLeft
    node.scrollLeft = (nextLeft / maxThumbTravel) * maxScroll
  }

  const handleThumbPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingThumb.current) {
      return
    }

    isDraggingThumb.current = false
    setIsThumbDragging(false)
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const handleThumbPointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingThumb.current) {
      return
    }

    isDraggingThumb.current = false
    setIsThumbDragging(false)
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

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
      <Box textStyle="bodyText3" fontWeight="400" mb="16px">
        {title}
      </Box>
      {isEmpty ? (
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
          <Text>{t('common:noDataAvailable', { defaultValue: 'No data available' })}</Text>
        </Box>
      ) : (
        <Box
          ref={scrollContainerRef}
          data-testid="scheme-performance-scroll-area"
          maxH={fillHeight ? undefined : maxTableHeight}
          flex={fillHeight ? 1 : undefined}
          minH={fillHeight ? 0 : undefined}
          overflowY="auto"
          overflowX={enableHorizontalScroller ? 'auto' : 'hidden'}
          w="full"
          maxW="100%"
          minW={0}
          pr={2}
          pb={2}
          onScroll={updateScrollbarThumb}
          sx={{
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { width: '4px', height: '0px' },
            '&::-webkit-scrollbar-track': { bg: 'neutral.100', borderRadius: '999px' },
            '&::-webkit-scrollbar-thumb': {
              bg: 'neutral.300',
              borderRadius: '999px',
              minHeight: '165px',
            },
          }}
        >
          <Box w="full" minW={responsiveTableMinWidth}>
            <Table size="sm" w="full" minW={responsiveTableMinWidth} sx={{ tableLayout: 'auto' }}>
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
                    px: 3,
                    py: 4,
                    whiteSpace: 'nowrap',
                  },
                }}
              >
                <Tr>
                  <Th w="260px" minW="260px" maxW="260px">
                    {t('pumpOperators.performanceTable.columns.name', { defaultValue: 'Name' })}
                  </Th>
                  {showVillageColumn ? (
                    <Th minW={enableHorizontalScroller ? '140px' : 'auto'}>
                      {secondaryColumnLabel ??
                        t('pumpOperators.performanceTable.columns.village', {
                          defaultValue: 'Village',
                        })}
                    </Th>
                  ) : null}
                  {showBlockColumn ? (
                    <Th minW={enableHorizontalScroller ? '140px' : 'auto'}>
                      {blockColumnLabel ??
                        t('pumpOperators.performanceTable.columns.block', {
                          defaultValue: 'Block',
                        })}
                    </Th>
                  ) : null}
                  <Th
                    minW={enableHorizontalScroller ? '170px' : 'auto'}
                    aria-sort={
                      sortColumn === 'reportingRate'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    <Box
                      as="button"
                      type="button"
                      onClick={() => handleSort('reportingRate')}
                      display="inline-flex"
                      alignItems="center"
                      gap={1}
                      cursor="pointer"
                      textAlign="left"
                      width="100%"
                      bg="none"
                      border="none"
                      p={0}
                    >
                      <Box as="span">
                        {t('pumpOperators.performanceTable.columns.reportingRate', {
                          defaultValue: 'Reporting Rate (%)',
                        })}
                      </Box>
                      <SortIndicator
                        isActive={sortColumn === 'reportingRate'}
                        direction={
                          sortColumn === 'reportingRate' && sortDirection ? sortDirection : 'desc'
                        }
                      />
                    </Box>
                  </Th>
                  <Th
                    minW={enableHorizontalScroller ? '150px' : 'auto'}
                    aria-sort={
                      sortColumn === 'waterSupplied'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    <Box
                      as="button"
                      type="button"
                      onClick={() => handleSort('waterSupplied')}
                      display="inline-flex"
                      alignItems="center"
                      gap={1}
                      cursor="pointer"
                      textAlign="left"
                      width="100%"
                      bg="none"
                      border="none"
                      p={0}
                    >
                      <Box as="span">
                        {t('pumpOperators.performanceTable.columns.waterSupplied', {
                          defaultValue: 'Water Supplied',
                        })}
                      </Box>
                      <SortIndicator
                        isActive={sortColumn === 'waterSupplied'}
                        direction={
                          sortColumn === 'waterSupplied' && sortDirection ? sortDirection : 'desc'
                        }
                      />
                    </Box>
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
                    whiteSpace: 'nowrap',
                  },
                }}
              >
                {rows.map((operator) => {
                  const villageValue = formatCellValue(operator.village)
                  const blockValue = formatCellValue(operator.block)

                  return (
                    <Tr key={operator.id} _odd={{ bg: 'primary.25' }}>
                      <Td
                        w="260px"
                        minW="260px"
                        maxW="260px"
                        overflow="hidden"
                        lineHeight="20px"
                        verticalAlign="top"
                      >
                        <Box
                          maxW="240px"
                          overflow="hidden"
                          textOverflow="ellipsis"
                          whiteSpace="nowrap"
                          title={operator.name}
                        >
                          {operator.name}
                        </Box>
                      </Td>
                      {showVillageColumn ? (
                        <Td overflow="hidden" lineHeight="20px" verticalAlign="top">
                          <Box
                            maxW="100%"
                            overflow="hidden"
                            textOverflow="ellipsis"
                            whiteSpace="nowrap"
                            title={villageValue}
                          >
                            {villageValue}
                          </Box>
                        </Td>
                      ) : null}
                      {showBlockColumn ? (
                        <Td overflow="hidden" lineHeight="20px" verticalAlign="top">
                          <Box
                            maxW="100%"
                            overflow="hidden"
                            textOverflow="ellipsis"
                            whiteSpace="nowrap"
                            title={blockValue}
                          >
                            {blockValue}
                          </Box>
                        </Td>
                      ) : null}
                      <Td>{formatMetricValue(operator.reportingRate)}</Td>
                      <Td>{formatMetricValue(operator.waterSupplied)}</Td>
                    </Tr>
                  )
                })}
              </Tbody>
            </Table>
          </Box>
        </Box>
      )}
      <Box
        mt="6px"
        display={enableHorizontalScroller ? 'block' : 'none'}
        opacity={enableHorizontalScroller && hasHorizontalOverflow ? 1 : 0}
        pointerEvents={enableHorizontalScroller && hasHorizontalOverflow ? 'auto' : 'none'}
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
            bg="neutral.300"
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
      {showPagination ? (
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
          {visiblePageNumbers.map((pageNumber) => (
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
          ))}
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
