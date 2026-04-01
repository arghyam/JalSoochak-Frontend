import { useState } from 'react'
import { Box, Icon, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { BiSortAlt2 } from 'react-icons/bi'
import type { EntityPerformance } from '../../types'

interface OverallPerformanceTableProps {
  data: EntityPerformance[]
  maxItems?: number
  scrollMaxHeight?: string
  entityLabel?: string
}

type SortColumn = 'coverage' | 'quantity' | 'regularity' | null
type SortDirection = 'asc' | 'desc' | null

export function OverallPerformanceTable({
  data,
  maxItems,
  scrollMaxHeight = '416px',
  entityLabel,
}: OverallPerformanceTableProps) {
  const { t } = useTranslation('dashboard')
  const [sortColumn, setSortColumn] = useState<SortColumn>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const resolvedEntityLabel =
    entityLabel ?? t('overallPerformance.columns.entity', { defaultValue: 'State/UT' })
  const safeMaxItems =
    typeof maxItems === 'number' && Number.isFinite(maxItems) ? Math.max(0, maxItems) : undefined
  const sortedRows =
    sortColumn && sortDirection
      ? [...data].sort((a, b) => {
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

  return (
    <Box borderRadius="lg" overflow="visible" minW={0} w="full">
      <Box
        maxH={scrollMaxHeight}
        overflowY={isEmpty ? 'hidden' : 'auto'}
        overflowX="auto"
        w="full"
        maxW="100%"
        minW={0}
        pr={2}
        pb={2}
        cursor={{ base: 'grab', md: 'auto' }}
        sx={{
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': { width: '4px', height: '4px' },
          '&::-webkit-scrollbar-track': { bg: 'neutral.100', borderRadius: '999px' },
          '&::-webkit-scrollbar-thumb': { bg: 'neutral.300', borderRadius: '999px' },
          '&:active': {
            cursor: 'grabbing',
          },
        }}
      >
        <Box w="full" minW={{ base: 'max-content', md: '100%' }}>
          {!isEmpty ? (
            <Table
              size="sm"
              w="full"
              minW={{ base: 'max-content', md: '100%' }}
              sx={{ tableLayout: 'auto' }}
            >
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
                    px: { base: 2, md: 3 },
                    py: { base: 3, md: 5 },
                    whiteSpace: 'nowrap',
                  },
                }}
              >
                <Tr>
                  <Th>{resolvedEntityLabel}</Th>
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
                        {t('overallPerformance.columns.quantityMld', {
                          defaultValue: 'Quantity (MLD)',
                        })}
                      </Box>
                      <Icon as={BiSortAlt2} boxSize="16px" color="neutral.500" aria-hidden />
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
                        {t('overallPerformance.columns.quantityLpcd', {
                          defaultValue: 'Quantity (LPCD)',
                        })}
                      </Box>
                      <Icon as={BiSortAlt2} boxSize="16px" color="neutral.500" aria-hidden />
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
                        {t('overallPerformance.columns.regularity', {
                          defaultValue: 'Regularity (%)',
                        })}
                      </Box>
                      <Icon as={BiSortAlt2} boxSize="16px" color="neutral.500" aria-hidden />
                    </Box>
                  </Th>
                </Tr>
              </Thead>
              <Tbody
                sx={{
                  tr: {
                    cursor: 'pointer',
                  },
                  td: {
                    textStyle: 'bodyText7',
                    fontWeight: '400',
                    px: { base: 2, md: 3 },
                    py: { base: 2, md: 0 },
                    height: { base: 'auto', md: '40px' },
                    lineHeight: { base: '20px', md: '40px' },
                    whiteSpace: 'nowrap',
                  },
                }}
              >
                {rows.map((state) => (
                  <Tr key={state.id} _odd={{ bg: 'primary.25' }}>
                    <Td>{state.name}</Td>
                    <Td>{state.coverage.toFixed(0)}</Td>
                    <Td>{state.quantity}</Td>
                    <Td>{state.regularity.toFixed(0)}%</Td>
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
