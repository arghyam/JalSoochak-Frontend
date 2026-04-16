import { useState } from 'react'
import { Box, Icon, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import type { KeyboardEvent } from 'react'
import type { EntityPerformance } from '../../types'

interface OverallPerformanceTableProps {
  data: EntityPerformance[]
  maxItems?: number
  scrollMaxHeight?: string
  entityLabel?: string
  onRowClick?: (row: EntityPerformance) => void
  onRowHover?: (row: EntityPerformance | null) => void
}

type SortColumn = 'name' | 'coverage' | 'quantity' | 'regularity' | null
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

export function OverallPerformanceTable({
  data,
  maxItems,
  scrollMaxHeight = '416px',
  entityLabel,
  onRowClick,
  onRowHover,
}: OverallPerformanceTableProps) {
  const { t } = useTranslation('dashboard')
  const [sortColumn, setSortColumn] = useState<SortColumn>('regularity')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
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

          const aValue = a[sortColumn]
          const bValue = b[sortColumn]
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
        h={scrollMaxHeight}
        maxH={scrollMaxHeight}
        overflowY={isEmpty ? 'hidden' : 'auto'}
        overflowX={{ base: 'scroll', md: 'auto' }}
        w="full"
        maxW="100%"
        minW={0}
        pr={2}
        pb={2}
        cursor={{ base: 'grab', md: 'auto' }}
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
        <Box w="full" minW={{ base: '520px', sm: '420px', md: '100%' }}>
          {!isEmpty ? (
            <Table
              size="sm"
              w="full"
              minW={{ base: '520px', sm: '420px', md: '100%' }}
              sx={{ tableLayout: 'fixed' }}
            >
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
                    px: { base: 2, md: 3 },
                    py: { base: 3, md: 5 },
                  },
                  'th:first-of-type': {
                    width: { base: '160px', md: '200px' },
                    minWidth: { base: '160px', md: '200px' },
                    maxWidth: { base: '160px', md: '200px' },
                  },
                }}
              >
                <Tr>
                  <Th
                    aria-sort={
                      sortColumn === 'name'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    <Box
                      as="button"
                      type="button"
                      onClick={() => handleSort('name')}
                      display="flex"
                      alignItems="center"
                      gap={1}
                      cursor="pointer"
                      textAlign="left"
                      width="100%"
                      minW={0}
                      bg="none"
                      border="none"
                      p={0}
                    >
                      <Box as="span" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                        {resolvedEntityLabel}
                      </Box>
                      <SortIndicator
                        isActive={sortColumn === 'name'}
                        direction={sortColumn === 'name' && sortDirection ? sortDirection : 'desc'}
                      />
                    </Box>
                  </Th>
                  <Th
                    aria-sort={
                      sortColumn === 'regularity'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    <Box
                      as="button"
                      type="button"
                      onClick={() => handleSort('regularity')}
                      display="flex"
                      alignItems="center"
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
                      <Box as="span" whiteSpace="normal">
                        {t('overallPerformance.columns.regularity', {
                          defaultValue: 'Regularity (%)',
                        })}
                      </Box>
                      <SortIndicator
                        isActive={sortColumn === 'regularity'}
                        direction={
                          sortColumn === 'regularity' && sortDirection ? sortDirection : 'desc'
                        }
                      />
                    </Box>
                  </Th>
                  <Th
                    aria-sort={
                      sortColumn === 'coverage'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    <Box
                      as="button"
                      type="button"
                      onClick={() => handleSort('coverage')}
                      display="flex"
                      alignItems="center"
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
                      <Box as="span" whiteSpace="normal">
                        {t('overallPerformance.columns.quantityMld', {
                          defaultValue: 'Quantity (MLD)',
                        })}
                      </Box>
                      <SortIndicator
                        isActive={sortColumn === 'coverage'}
                        direction={
                          sortColumn === 'coverage' && sortDirection ? sortDirection : 'desc'
                        }
                      />
                    </Box>
                  </Th>
                  <Th
                    aria-sort={
                      sortColumn === 'quantity'
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    <Box
                      as="button"
                      type="button"
                      onClick={() => handleSort('quantity')}
                      display="flex"
                      alignItems="center"
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
                      <Box as="span" whiteSpace="normal">
                        {t('overallPerformance.columns.quantityLpcd', {
                          defaultValue: 'Quantity (LPCD)',
                        })}
                      </Box>
                      <SortIndicator
                        isActive={sortColumn === 'quantity'}
                        direction={
                          sortColumn === 'quantity' && sortDirection ? sortDirection : 'desc'
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
                    fontSize: '14px',
                    fontWeight: '400',
                    px: { base: 2, md: 3 },
                    py: { base: 2, md: 0 },
                    height: { base: 'auto', md: '40px' },
                    lineHeight: { base: '20px', md: '40px' },
                    whiteSpace: 'nowrap',
                  },
                  'td:first-of-type': {
                    width: { base: '160px', md: '200px' },
                    minWidth: { base: '160px', md: '200px' },
                    maxWidth: { base: '160px', md: '200px' },
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
                      <Box
                        title={state.name}
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                        maxW={{ base: '160px', md: '200px' }}
                      >
                        {state.name}
                      </Box>
                    </Td>
                    <Td>{state.regularity.toFixed(1)}%</Td>
                    <Td>{state.coverage.toFixed(1)}</Td>
                    <Td>{state.quantity}</Td>
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
              {t('overallPerformance.noData', { defaultValue: 'No data available' })}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
