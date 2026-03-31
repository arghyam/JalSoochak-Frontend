import { useEffect, useRef } from 'react'
import type { UIEvent } from 'react'
import { Box, Table, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import type { ReadingComplianceData } from '../../types'

interface ReadingComplianceTableProps {
  data: ReadingComplianceData[]
  title?: string
  maxItems?: number
  showVillageColumn?: boolean
  scrollAreaMaxH?: string | number
  onReachEnd?: () => void
}

export function ReadingComplianceTable({
  data,
  title,
  maxItems,
  showVillageColumn = true,
  scrollAreaMaxH = '432px',
  onReachEnd,
}: ReadingComplianceTableProps) {
  const { t } = useTranslation('dashboard')
  const hasReachedEndRef = useRef(false)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const resolvedTitle =
    title?.trim() ||
    t('outageAndSubmissionCharts.titles.readingCompliance', {
      defaultValue: 'Reading Compliance',
    })
  const safeMaxItems =
    typeof maxItems === 'number' && Number.isFinite(maxItems) ? Math.max(0, maxItems) : undefined
  const rows = typeof safeMaxItems === 'number' ? data.slice(0, safeMaxItems) : data
  const isEmpty = rows.length === 0
  const tableMinWidth = showVillageColumn ? '640px' : '100%'

  useEffect(() => {
    hasReachedEndRef.current = false
  }, [rows.length])

  useEffect(() => {
    if (!onReachEnd || rows.length === 0) {
      return
    }

    const container = scrollContainerRef.current

    if (!container) {
      return
    }

    const hasOverflow = container.scrollHeight - container.clientHeight > 24

    if (!hasOverflow && !hasReachedEndRef.current) {
      hasReachedEndRef.current = true
      onReachEnd()
    }
  }, [onReachEnd, rows.length])

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!onReachEnd) {
      return
    }

    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight

    if (distanceFromBottom > 48) {
      hasReachedEndRef.current = false
      return
    }

    if (distanceFromBottom <= 24 && !hasReachedEndRef.current) {
      hasReachedEndRef.current = true
      onReachEnd()
    }
  }

  return (
    <Box borderRadius="lg" overflow="hidden" w="full" minW={0}>
      <Box textStyle="bodyText3" fontWeight="400" mb="16px">
        {resolvedTitle}
      </Box>
      <Box
        ref={scrollContainerRef}
        maxH={scrollAreaMaxH}
        overflowY="auto"
        overflowX="auto"
        w="full"
        maxW="100%"
        minW={0}
        pr={2}
        pb={2}
        cursor={{ base: 'grab', md: 'auto' }}
        onScroll={handleScroll}
        sx={{
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': { width: '4px', height: '4px' },
          '&::-webkit-scrollbar-track': { bg: 'neutral.100', borderRadius: '999px' },
          '&::-webkit-scrollbar-thumb': {
            bg: 'neutral.300',
            borderRadius: '999px',
            minHeight: '165px',
          },
          '&:active': {
            cursor: 'grabbing',
          },
        }}
      >
        <Box w="full" minW={tableMinWidth}>
          <Table size="sm" w="full" minW={tableMinWidth} sx={{ tableLayout: 'auto' }}>
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
                  py: { base: 3, md: 4 },
                  whiteSpace: 'nowrap',
                },
              }}
            >
              <Tr>
                <Th>
                  {t('outageAndSubmissionCharts.tables.readingCompliance.columns.name', {
                    defaultValue: 'Name',
                  })}
                </Th>
                {showVillageColumn ? (
                  <Th>
                    {t('outageAndSubmissionCharts.tables.readingCompliance.columns.village', {
                      defaultValue: 'Village',
                    })}
                  </Th>
                ) : null}
                <Th>
                  {t('outageAndSubmissionCharts.tables.readingCompliance.columns.lastSubmission', {
                    defaultValue: 'Last Submission',
                  })}
                </Th>
                <Th>
                  {t('outageAndSubmissionCharts.tables.readingCompliance.columns.readingValue', {
                    defaultValue: 'Reading Value',
                  })}
                </Th>
              </Tr>
            </Thead>
            {!isEmpty ? (
              <Tbody
                sx={{
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
                {rows.map((row) => (
                  <Tr key={row.id} _odd={{ bg: 'primary.25' }}>
                    <Td>{row.name}</Td>
                    {showVillageColumn ? <Td>{row.village}</Td> : null}
                    <Td>{row.lastSubmission}</Td>
                    <Td>{row.readingValue}</Td>
                  </Tr>
                ))}
              </Tbody>
            ) : null}
          </Table>
          {isEmpty ? (
            <Box
              minH="200px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              color="neutral.500"
              borderTop="1px solid"
              borderColor="gray.100"
            >
              <Text>{t('common:noDataAvailable', { defaultValue: 'No data available' })}</Text>
            </Box>
          ) : null}
        </Box>
      </Box>
    </Box>
  )
}
