import { useState } from 'react'
import { Box, Icon, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { BiSortAlt2 } from 'react-icons/bi'
import type { PumpOperatorPerformanceData } from '../../types'

interface SchemePerformanceTableProps {
  data: PumpOperatorPerformanceData[]
  title: string
  maxItems?: number
  maxTableHeight?: string | number
  fillHeight?: boolean
}

type SortColumn = 'reportingRate' | 'waterSupplied' | null
type SortDirection = 'asc' | 'desc' | null

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

export function SchemePerformanceTable({
  data,
  title,
  maxItems,
  maxTableHeight = '330px',
  fillHeight = false,
}: SchemePerformanceTableProps) {
  const { t } = useTranslation('dashboard')
  const [sortColumn, setSortColumn] = useState<SortColumn>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const safeMaxItems =
    typeof maxItems === 'number' && Number.isFinite(maxItems) ? Math.max(0, maxItems) : undefined
  const sortedRows =
    sortColumn && sortDirection
      ? [...data].sort((a, b) => {
          return compareNullableNumbers(a[sortColumn], b[sortColumn], sortDirection)
        })
      : data
  const rows = typeof safeMaxItems === 'number' ? sortedRows.slice(0, safeMaxItems) : sortedRows

  const handleSort = (column: Exclude<SortColumn, null>) => {
    if (sortColumn !== column) {
      setSortColumn(column)
      setSortDirection('desc')
      return
    }
    setSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'))
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
      <Box
        maxH={fillHeight ? undefined : maxTableHeight}
        flex={fillHeight ? 1 : undefined}
        minH={fillHeight ? 0 : undefined}
        overflowY="auto"
        overflowX="auto"
        w="full"
        maxW="100%"
        minW={0}
        pr={2}
        pb={2}
        sx={{
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': { width: '4px', height: '4px' },
          '&::-webkit-scrollbar-track': { bg: 'neutral.100', borderRadius: '999px' },
          '&::-webkit-scrollbar-thumb': {
            bg: 'neutral.300',
            borderRadius: '999px',
            minHeight: '165px',
          },
        }}
      >
        <Table size="sm" w="max-content" minW="100%">
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
              },
            }}
          >
            <Tr>
              <Th>{t('pumpOperators.performanceTable.columns.name', { defaultValue: 'Name' })}</Th>
              <Th>
                {t('pumpOperators.performanceTable.columns.village', { defaultValue: 'Village' })}
              </Th>
              <Th>
                {t('pumpOperators.performanceTable.columns.block', { defaultValue: 'Block' })}
              </Th>
              <Th
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
                  <Icon as={BiSortAlt2} boxSize="16px" color="neutral.500" aria-hidden />
                </Box>
              </Th>
              <Th
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
                  <Icon as={BiSortAlt2} boxSize="16px" color="neutral.500" aria-hidden />
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
                py: 0,
                height: '40px',
                lineHeight: '40px',
                whiteSpace: 'nowrap',
              },
            }}
          >
            {rows.map((operator) => (
              <Tr key={operator.id} _odd={{ bg: 'primary.25' }}>
                <Td>{operator.name}</Td>
                <Td>{formatCellValue(operator.village)}</Td>
                <Td>{formatCellValue(operator.block)}</Td>
                <Td>{formatMetricValue(operator.reportingRate)}</Td>
                <Td>{formatMetricValue(operator.waterSupplied)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  )
}
