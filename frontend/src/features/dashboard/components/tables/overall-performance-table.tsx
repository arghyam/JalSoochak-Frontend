import { useMemo, useState } from 'react'
import { Box, Icon, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import type { KeyboardEvent } from 'react'
import type { EntityPerformance } from '../../types'
import { LoadingSpinner } from '@/shared/components/common'

interface OverallPerformanceTableProps {
  data: EntityPerformance[]
  isLoading?: boolean
  errorMessage?: string
  maxItems?: number
  scrollMaxHeight?: string
  autoHeightWithinMax?: boolean
  entityLabel?: string
  onRowClick?: (row: EntityPerformance) => void
  onRowHover?: (row: EntityPerformance | null) => void
}

type SortColumn = 'name' | 'coverage' | 'quantity' | 'regularity' | 'households' | null
type SortDirection = 'asc' | 'desc' | null

const MISSING_METRIC_VALUE = -1

const getMetricValue = (row: EntityPerformance, column: Exclude<SortColumn, 'name' | null>) => {
  const value = row[column]
  return typeof value === 'number' && Number.isFinite(value) ? value : MISSING_METRIC_VALUE
}

const resolveAriaSort = (isActive: boolean, direction: SortDirection) => {
  if (!isActive) {
    return undefined
  }
  return direction === 'asc' ? 'ascending' : 'descending'
}

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

function MetricColumnHeader({
  label,
  column,
  sortColumn,
  sortDirection,
  onSort,
}: {
  label: string
  column: Exclude<SortColumn, 'name' | null>
  sortColumn: SortColumn
  sortDirection: SortDirection
  onSort: (column: Exclude<SortColumn, 'name' | null>) => void
}) {
  const isActive = sortColumn === column
  const ariaSort = resolveAriaSort(isActive, sortDirection)

  return (
    <Th aria-sort={ariaSort}>
      {/* The label wraps inside its own box while the indicator stays a sibling
          flex item, so a unit like "(MLD)" moves to a second line but the
          indicator stays on the first line beside the column name. */}
      <Box
        as="button"
        type="button"
        onClick={() => onSort(column)}
        display="flex"
        alignItems="flex-start"
        justifyContent="flex-start"
        gap={1}
        cursor="pointer"
        textAlign="left"
        width="100%"
        minW={0}
        bg="none"
        border="none"
        p={0}
      >
        <Box as="span" whiteSpace="normal" lineHeight="18px" minW={0}>
          {label}
        </Box>
        <SortIndicator
          isActive={isActive}
          direction={isActive && sortDirection ? sortDirection : 'desc'}
        />
      </Box>
    </Th>
  )
}

export function OverallPerformanceTable({
  data,
  isLoading = false,
  errorMessage,
  maxItems,
  scrollMaxHeight = '416px',
  autoHeightWithinMax = false,
  entityLabel,
  onRowClick,
  onRowHover,
}: OverallPerformanceTableProps) {
  const { t, i18n } = useTranslation('dashboard')
  const [sortColumn, setSortColumn] = useState<SortColumn>('regularity')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const numberLocale = i18n.resolvedLanguage === 'hi' ? 'hi-IN' : 'en-IN'
  const householdFormatter = useMemo(
    () => new Intl.NumberFormat(numberLocale, { maximumFractionDigits: 0 }),
    [numberLocale]
  )
  const formatHouseholds = (value: number | undefined) =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0
      ? householdFormatter.format(value)
      : '-'
  const resolvedEntityLabel =
    entityLabel ?? t('overallPerformance.columns.entity', { defaultValue: 'State/UT' })
  const safeMaxItems =
    typeof maxItems === 'number' && Number.isFinite(maxItems) ? Math.max(0, maxItems) : undefined
  const sortedRows =
    sortColumn && sortDirection
      ? [...data].sort((a, b) => {
          if (sortColumn === 'name') {
            return sortDirection === 'asc'
              ? a.name.localeCompare(b.name)
              : b.name.localeCompare(a.name)
          }

          const aValue = getMetricValue(a, sortColumn)
          const bValue = getMetricValue(b, sortColumn)
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
        })
      : data
  const rows = typeof safeMaxItems === 'number' ? sortedRows.slice(0, safeMaxItems) : sortedRows
  const isEmpty = rows.length === 0

  const handleSort = (column: Exclude<SortColumn, null>) => {
    if (sortColumn !== column) {
      setSortColumn(column)
      setSortDirection('desc')
      return
    }
    setSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'))
  }

  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, row: EntityPerformance) => {
    if (!onRowClick) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onRowClick(row)
    }
  }

  return (
    <Box borderRadius="lg" overflow="visible" minW={0} w="full">
      <Box
        h={autoHeightWithinMax ? 'auto' : scrollMaxHeight}
        maxH={scrollMaxHeight}
        overflowY={isEmpty || errorMessage ? 'hidden' : 'auto'}
        overflowX="auto"
        w="full"
        maxW="100%"
        minW={0}
        pr={2}
        pb={2}
        cursor="grab"
        sx={{
          WebkitOverflowScrolling: 'touch',
          scrollbarGutter: 'stable',
          '&::-webkit-scrollbar': { width: '4px', height: '4px' },
          '&::-webkit-scrollbar-track': { bg: 'neutral.100', borderRadius: '999px' },
          '&::-webkit-scrollbar-thumb': { bg: 'neutral.300', borderRadius: '999px' },
          '&::-webkit-scrollbar-thumb:vertical': { bg: 'primary.300' },
          '&::-webkit-scrollbar-thumb:horizontal': { bg: 'primary.300' },
          '&:active': {
            cursor: 'grabbing',
          },
        }}
      >
        <Box w="full" minW={0}>
          {isLoading ? (
            <Box minH={scrollMaxHeight} display="flex" alignItems="center" justifyContent="center">
              <LoadingSpinner />
            </Box>
          ) : !isEmpty && !errorMessage ? (
            <Table size="sm" w="full" minW="100%" sx={{ tableLayout: 'auto' }}>
              <Thead
                sx={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  bg: 'white',
                  th: {
                    textStyle: 'bodyText7',
                    fontSize: '14px',
                    textTransform: 'none',
                    fontWeight: '500',
                    px: { base: 2, md: 2 },
                    py: { base: 3, md: 4 },
                    // Two-line headers must start at the top so single-line
                    // labels line up with the first line of the wrapped ones.
                    verticalAlign: 'top',
                  },
                }}
              >
                <Tr>
                  {/* Capped so the name column takes a fixed share of the card
                      instead of absorbing all the slack left by the metrics. */}
                  <Th
                    width={{ base: '30%', lg: '26%' }}
                    aria-sort={resolveAriaSort(sortColumn === 'name', sortDirection)}
                  >
                    <Box
                      as="button"
                      type="button"
                      onClick={() => handleSort('name')}
                      display="flex"
                      alignItems="flex-start"
                      gap={1}
                      cursor="pointer"
                      textAlign="left"
                      width="100%"
                      minW={0}
                      bg="none"
                      border="none"
                      p={0}
                    >
                      {/* minW={0} lets a long localised label ellipsize instead of
                          widening the column past the name values it labels. */}
                      <Box
                        as="span"
                        title={resolvedEntityLabel}
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                        minW={0}
                      >
                        {resolvedEntityLabel}
                      </Box>
                      <SortIndicator
                        isActive={sortColumn === 'name'}
                        direction={sortColumn === 'name' && sortDirection ? sortDirection : 'desc'}
                      />
                    </Box>
                  </Th>
                  <MetricColumnHeader
                    label={t('overallPerformance.columns.regularity', {
                      defaultValue: 'Regularity (%)',
                    })}
                    column="regularity"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <MetricColumnHeader
                    label={t('overallPerformance.columns.quantityMld', {
                      defaultValue: 'Quantity (MLD)',
                    })}
                    column="coverage"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <MetricColumnHeader
                    label={t('overallPerformance.columns.quantityLpcd', {
                      defaultValue: 'Quantity (LPCD)',
                    })}
                    column="quantity"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <MetricColumnHeader
                    label={t('overallPerformance.columns.households', {
                      defaultValue: 'Household',
                    })}
                    column="households"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </Tr>
              </Thead>
              <Tbody
                sx={{
                  td: {
                    textStyle: 'bodyText7',
                    fontSize: '14px',
                    fontWeight: '400',
                    px: { base: 2, md: 2 },
                    py: { base: 2, md: 0 },
                    height: { base: 'auto', md: '40px' },
                    lineHeight: { base: '20px', md: '40px' },
                    whiteSpace: 'nowrap',
                  },
                  'td:first-of-type': {
                    textAlign: 'left',
                  },
                  'td:not(:first-of-type)': {
                    textAlign: 'left',
                  },
                }}
              >
                {rows.map((state) => (
                  <Tr
                    key={state.id}
                    _odd={{ bg: 'primary.25' }}
                    cursor={onRowClick ? 'pointer' : 'default'}
                    _hover={onRowClick ? { bg: 'primary.50' } : undefined}
                    onClick={onRowClick ? () => onRowClick(state) : undefined}
                    onMouseEnter={onRowHover ? () => onRowHover(state) : undefined}
                    onMouseLeave={onRowHover ? () => onRowHover(null) : undefined}
                    tabIndex={onRowHover ? 0 : undefined}
                    role={onRowClick ? 'button' : undefined}
                    onKeyDown={onRowClick ? (event) => handleRowKeyDown(event, state) : undefined}
                    onFocus={onRowHover ? () => onRowHover(state) : undefined}
                    onBlur={onRowHover ? () => onRowHover(null) : undefined}
                  >
                    <Td>
                      {/* Also the column's minimum width: narrowest at lg, where
                          the map sits beside this card. */}
                      <Box
                        title={state.name}
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                        maxW={{
                          base: '200px',
                          md: '180px',
                          lg: '140px',
                          xl: '180px',
                          '2xl': '210px',
                        }}
                      >
                        {state.name}
                      </Box>
                    </Td>
                    <Td>{state.regularity.toFixed(1)}%</Td>
                    <Td>{state.coverage.toFixed(1)}</Td>
                    <Td>{state.quantity}</Td>
                    <Td>{formatHouseholds(state.households)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <Box
              minH={scrollMaxHeight}
              display="flex"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              color="neutral.600"
            >
              {errorMessage ??
                t('overallPerformance.noData', { defaultValue: 'No data available' })}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
