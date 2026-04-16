import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Box, Heading, Text, Flex, SimpleGrid, Spinner, Button, Link } from '@chakra-ui/react'
import { DataTable, PageHeader } from '@/shared/components/common'
import type { DataTableColumn } from '@/shared/components/common'
import { ROUTES } from '@/shared/constants/routes'
import {
  useSchemeDetailsQuery,
  useSchemeReadingsQuery,
} from '../../services/query/use-schemes-queries'
import { formatTimestamp } from '../../services/api/schemes-api'
import type { SchemeReadingRow } from '../../types/schemes'

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text textStyle="h10" fontWeight="500" mb={1}>
        {label}
      </Text>
      <Text textStyle="h10" fontWeight="400">
        {value}
      </Text>
    </Box>
  )
}

export function SchemeViewPage() {
  const { t } = useTranslation('section-officer')
  const { schemeId } = useParams<{ schemeId: string }>()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const {
    data: details,
    isLoading: detailsLoading,
    isError: detailsError,
    refetch: refetchDetails,
  } = useSchemeDetailsQuery(schemeId)

  const {
    data: readings,
    isLoading: readingsLoading,
    isError: readingsError,
    refetch: refetchReadings,
  } = useSchemeReadingsQuery(schemeId, page, pageSize)

  useEffect(() => {
    document.title = details
      ? `${details.schemeName} ${t('common.documentTitle')}`
      : `${t('pages.schemes.viewScheme')} ${t('common.documentTitle')}`
  }, [details, t])

  const readingsColumns: DataTableColumn<SchemeReadingRow>[] = [
    {
      key: 'pumpOperatorName',
      header: t('pages.schemes.columns.pumpOperator'),
      render: (row) => (
        <Link
          textStyle="h10"
          fontWeight="400"
          color="primary.500"
          cursor="pointer"
          _hover={{ textDecoration: 'underline' }}
          onClick={() =>
            navigate(
              ROUTES.STAFF_PUMP_OPERATORS_VIEW.replace(':operatorId', String(row.pumpOperatorId))
            )
          }
        >
          {row.pumpOperatorName}
        </Link>
      ),
    },
    {
      key: 'submittedAt',
      header: t('pages.schemes.columns.submissionDateTime'),
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.submittedAt ? formatTimestamp(row.submittedAt) : '—'}
        </Text>
      ),
    },
    {
      key: 'waterSupplied',
      header: t('pages.schemes.columns.waterSupplied'),
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.waterSupplied}
        </Text>
      ),
    },
    {
      key: 'readingValue',
      header: t('pages.schemes.columns.readingValue'),
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.readingValue}
        </Text>
      ),
    },
  ]

  return (
    <Box w="full" maxW="100%" minW={0}>
      <PageHeader>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={2}>
          {t('pages.schemes.heading')}
        </Heading>
        <Flex as="nav" aria-label="Breadcrumb" gap={2} flexWrap="wrap">
          <Link
            fontSize="14px"
            lineHeight="21px"
            color="neutral.500"
            _hover={{ textDecoration: 'underline' }}
            onClick={() => navigate(ROUTES.STAFF_SCHEMES)}
            cursor="pointer"
          >
            {t('pages.schemes.breadcrumb')}
          </Link>
          <Text fontSize="14px" lineHeight="21px" color="neutral.500" aria-hidden="true">
            /
          </Text>
          <Text fontSize="14px" lineHeight="21px" color="#26272B" aria-current="page">
            {t('pages.schemes.viewScheme')}
          </Text>
        </Flex>
      </PageHeader>

      {detailsLoading && (
        <Flex role="status" aria-live="polite" align="center" minH="200px" gap={3}>
          <Spinner size="md" color="primary.500" />
          <Text color="neutral.600">{t('pages.schemes.loading')}</Text>
        </Flex>
      )}

      {detailsError && (
        <Flex align="flex-start" direction="column" gap={3} mt={4} role="alert">
          <Text color="red.500">{t('pages.schemes.error')}</Text>
          <Button variant="secondary" size="sm" onClick={() => void refetchDetails()}>
            {t('common.retry')}
          </Button>
        </Flex>
      )}

      {!detailsLoading && !detailsError && details && (
        <Box
          bg="white"
          borderWidth="0.5px"
          borderColor="neutral.200"
          borderRadius="12px"
          w="full"
          py={6}
          px={{ base: 3, md: 4 }}
          mb={6}
        >
          <Heading as="h2" size="h3" fontWeight="400" mb={6}>
            {t('pages.schemes.schemeDetails')}
          </Heading>
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            <DetailField
              label={t('pages.schemes.detailFields.schemeName')}
              value={details.schemeName}
            />
            <DetailField
              label={t('pages.schemes.detailFields.stateSchemeId')}
              value={details.stateSchemeId}
            />
            <DetailField
              label={t('pages.schemes.detailFields.lastSubmission')}
              value={details.lastSubmissionAt ? formatTimestamp(details.lastSubmissionAt) : '—'}
            />
            <DetailField
              label={t('pages.schemes.detailFields.reportingRate')}
              value={
                details.reportingRatePercent !== null && details.reportingRatePercent !== undefined
                  ? `${details.reportingRatePercent}%`
                  : '—'
              }
            />
          </SimpleGrid>
        </Box>
      )}

      {readingsLoading && (
        <Flex role="status" aria-live="polite" align="center" minH="120px" gap={3}>
          <Spinner size="md" color="primary.500" />
          <Text color="neutral.600">{t('pages.schemes.loadingSubmissions')}</Text>
        </Flex>
      )}

      {readingsError && (
        <Flex align="flex-start" direction="column" gap={3} mt={4} role="alert">
          <Text color="red.500">{t('pages.schemes.errorSubmissions')}</Text>
          <Button variant="secondary" size="sm" onClick={() => void refetchReadings()}>
            {t('common.retry')}
          </Button>
        </Flex>
      )}

      {!readingsLoading && !readingsError && (
        <DataTable
          columns={readingsColumns}
          data={readings?.content ?? []}
          getRowKey={(row) => `${row.pumpOperatorId}-${row.submittedAt}`}
          emptyMessage={t('pages.schemes.noSubmissionsFound')}
          pagination={{
            enabled: true,
            page,
            pageSize,
            totalItems: readings?.totalElements ?? 0,
            onPageChange: setPage,
            onPageSizeChange: (size) => {
              setPageSize(size)
              setPage(1)
            },
          }}
        />
      )}
    </Box>
  )
}
