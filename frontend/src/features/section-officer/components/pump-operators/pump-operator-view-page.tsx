import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Papa from 'papaparse'
import {
  Box,
  Heading,
  Text,
  Flex,
  SimpleGrid,
  Spinner,
  Button,
  Link,
  Input,
  InputGroup,
  InputLeftElement,
  FormControl,
  FormLabel,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'
import { FiDownload } from 'react-icons/fi'
import { useDebounce } from '@/shared/hooks/use-debounce'
import { DataTable, DateRangePicker, PageHeader } from '@/shared/components/common'
import type { DataTableColumn } from '@/shared/components/common'
import type { DateRange } from '@/shared/components/common'
import { ROUTES } from '@/shared/constants/routes'
import {
  usePumpOperatorDetailsQuery,
  usePumpOperatorReadingsQuery,
  useOperatorAttendanceQuery,
} from '../../services/query/use-pump-operators-queries'
import { formatTimestamp } from '../../services/api/schemes-api'
import type { PumpOperatorReading } from '../../types/pump-operators'
import { sanitizeCsvData } from '../../utils/csv-sanitizer'

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

const formatDateToIso = (date: Date) => date.toISOString().split('T')[0]

const getDefaultAttendanceRange = (): DateRange => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const startDate = new Date(yesterday)
  startDate.setDate(startDate.getDate() - 29)

  return {
    startDate: formatDateToIso(startDate),
    endDate: formatDateToIso(yesterday),
  }
}

export function PumpOperatorViewPage() {
  const { t } = useTranslation('section-officer')
  const { operatorId } = useParams<{ operatorId: string }>()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false)
  const [attendanceRange, setAttendanceRange] = useState<DateRange | null>(
    getDefaultAttendanceRange
  )
  const debouncedSearch = useDebounce(searchQuery, 400)

  const [prevDebounced, setPrevDebounced] = useState(debouncedSearch)
  if (prevDebounced !== debouncedSearch) {
    setPrevDebounced(debouncedSearch)
    setPage(1)
  }

  const {
    data: details,
    isLoading: detailsLoading,
    isError: detailsError,
    refetch: refetchDetails,
  } = usePumpOperatorDetailsQuery(operatorId)

  const {
    data: readings,
    isLoading: readingsLoading,
    isError: readingsError,
    refetch: refetchReadings,
  } = usePumpOperatorReadingsQuery(operatorId, page, pageSize, debouncedSearch)

  const { refetch: refetchAttendance } = useOperatorAttendanceQuery(
    details?.uuid,
    attendanceRange?.startDate,
    attendanceRange?.endDate
  )

  const handleOpenAttendanceModal = () => {
    setAttendanceRange(getDefaultAttendanceRange())
    setIsAttendanceModalOpen(true)
  }

  const handleCloseAttendanceModal = () => {
    if (isDownloading) return
    setIsAttendanceModalOpen(false)
  }

  const handleDownloadAttendance = async () => {
    try {
      setIsDownloading(true)
      const { data: attendance } = await refetchAttendance()

      if (!attendance || attendance.length === 0) {
        return
      }

      // Sanitize filename: remove unsafe characters
      const safeName = (details?.name ?? 'operator').replace(/[/\\:*?"<>|]/g, '_')
      const fileName = `${safeName}_attendance.csv`

      // Build CSV data: horizontal metadata rows + attendance table
      const csvData = [
        ['Name', '', 'Phone Number', ''],
        [details?.name ?? '', '', details?.phoneNumber ?? '', ''],
        ['', '', '', ''],
        ['date', 'attendance'],
        ...attendance.map((record) => [record.date, record.attendance.toString()]),
      ]

      // Sanitize all cells to prevent CSV formula injection
      const sanitizedCsvData = sanitizeCsvData(csvData as (string | number | boolean)[][])
      const csv = Papa.unparse(sanitizedCsvData)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', fileName)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setIsAttendanceModalOpen(false)
    } finally {
      setIsDownloading(false)
    }
  }

  useEffect(() => {
    const operatorName = details?.name?.trim()
    document.title = operatorName
      ? `${operatorName} ${t('common.documentTitle')}`
      : `${t('pages.pumpOperators.viewPumpOperator')} ${t('common.documentTitle')}`
  }, [details, t])

  const readingsColumns: DataTableColumn<PumpOperatorReading>[] = [
    {
      key: 'schemeName',
      header: t('pages.pumpOperators.columns.schemeName'),
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.schemeName}
        </Text>
      ),
    },
    {
      key: 'stateSchemeId',
      header: t('pages.pumpOperators.columns.stateSchemeId'),
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.stateSchemeId}
        </Text>
      ),
    },
    {
      key: 'readingAt',
      header: t('pages.pumpOperators.columns.submissionDateTime'),
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.readingAt ? formatTimestamp(row.readingAt) : '—'}
        </Text>
      ),
    },
    {
      key: 'waterSupplied',
      header: t('pages.pumpOperators.columns.waterSupplied'),
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.waterSupplied !== null && row.waterSupplied !== undefined ? row.waterSupplied : '—'}
        </Text>
      ),
    },
    {
      key: 'readingValue',
      header: t('pages.pumpOperators.columns.readingValue'),
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.readingValue}
        </Text>
      ),
    },
  ]

  return (
    <Box w="full" maxW="100%" minW={0}>
      <PageHeader
        rightContent={
          <Button
            variant="secondary"
            size="sm"
            fontWeight="600"
            isLoading={isDownloading}
            isDisabled={!details?.uuid || isDownloading}
            onClick={handleOpenAttendanceModal}
            aria-label={t('pages.pumpOperators.downloadAttendance')}
          >
            <FiDownload
              aria-hidden="true"
              size={16}
              style={{ marginRight: '4px', flexShrink: 0 }}
            />
            {t('pages.pumpOperators.downloadAttendance')}
          </Button>
        }
      >
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={2}>
          {t('pages.pumpOperators.heading')}
        </Heading>
        <Flex as="nav" aria-label="Breadcrumb" gap={2} flexWrap="wrap">
          <Link
            fontSize="14px"
            lineHeight="21px"
            color="neutral.500"
            _hover={{ textDecoration: 'underline' }}
            onClick={() => navigate(ROUTES.STAFF_PUMP_OPERATORS)}
            cursor="pointer"
          >
            {t('pages.pumpOperators.breadcrumb')}
          </Link>
          <Text fontSize="14px" lineHeight="21px" color="neutral.500" aria-hidden="true">
            /
          </Text>
          <Text fontSize="14px" lineHeight="21px" color="#26272B" aria-current="page">
            {t('pages.pumpOperators.viewPumpOperator')}
          </Text>
        </Flex>
      </PageHeader>

      {detailsLoading && (
        <Flex role="status" aria-live="polite" align="center" minH="200px" gap={3}>
          <Spinner size="md" color="primary.500" />
          <Text color="neutral.600">{t('pages.pumpOperators.loadingDetails')}</Text>
        </Flex>
      )}

      {detailsError && (
        <Flex align="flex-start" direction="column" gap={3} mt={4} role="alert">
          <Text color="red.500">{t('pages.pumpOperators.errorDetails')}</Text>
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
            {t('pages.pumpOperators.pumpOperatorDetails')}
          </Heading>
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            <DetailField
              label={t('pages.pumpOperators.detailFields.name')}
              value={details.name ?? '—'}
            />
            <DetailField
              label={t('pages.pumpOperators.detailFields.phoneNumber')}
              value={details.phoneNumber ?? '—'}
            />
            <DetailField
              label={t('pages.pumpOperators.detailFields.reportingRate')}
              value={
                details.reportingRatePercent !== null && details.reportingRatePercent !== undefined
                  ? `${details.reportingRatePercent}%`
                  : '—'
              }
            />
            <DetailField
              label={t('pages.pumpOperators.detailFields.lastSubmission')}
              value={details.lastSubmissionAt ? formatTimestamp(details.lastSubmissionAt) : '—'}
            />
          </SimpleGrid>
        </Box>
      )}

      <Flex
        as="section"
        aria-label="Filter readings"
        justify="flex-start"
        align="center"
        mb={6}
        py={3}
        px={{ base: 3, md: 6 }}
        h={{ base: 'auto', md: 16 }}
        gap={{ base: 3, md: 4 }}
        flexDirection={{ base: 'column', md: 'row' }}
        borderWidth="0.5px"
        borderColor="neutral.200"
        borderRadius="12px"
        bg="white"
      >
        <InputGroup w={{ base: 'full', md: '260px' }} flexShrink={0}>
          <InputLeftElement pointerEvents="none" h={8}>
            <SearchIcon color="neutral.300" aria-hidden="true" />
          </InputLeftElement>
          <Input
            placeholder={t('pages.pumpOperators.searchReadingsPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label={t('pages.pumpOperators.searchReadingsPlaceholder')}
            bg="white"
            h={8}
            borderWidth="1px"
            borderRadius="4px"
            borderColor="neutral.300"
            _placeholder={{ color: 'neutral.300' }}
          />
        </InputGroup>
      </Flex>

      {readingsLoading && (
        <Flex role="status" aria-live="polite" align="center" minH="120px" gap={3}>
          <Spinner size="md" color="primary.500" />
          <Text color="neutral.600">{t('pages.pumpOperators.loadingReadings')}</Text>
        </Flex>
      )}

      {readingsError && (
        <Flex align="flex-start" direction="column" gap={3} mt={4} role="alert">
          <Text color="red.500">{t('pages.pumpOperators.errorReadings')}</Text>
          <Button variant="secondary" size="sm" onClick={() => void refetchReadings()}>
            {t('common.retry')}
          </Button>
        </Flex>
      )}

      {!readingsLoading && !readingsError && (
        <DataTable
          columns={readingsColumns}
          data={readings?.content ?? []}
          getRowKey={(row) => `${row.schemeId}-${row.readingAt}`}
          emptyMessage={t('pages.pumpOperators.noReadingsFound')}
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

      <Modal isOpen={isAttendanceModalOpen} onClose={handleCloseAttendanceModal} isCentered>
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent
          maxW="465px"
          height={{ base: '420px', md: '470px' }}
          borderRadius="12px"
          p={6}
        >
          <ModalHeader p={0} textStyle="h6" fontWeight="600">
            {t('pages.pumpOperators.attendanceModal.title')}
          </ModalHeader>
          <ModalBody p={0} mt={5}>
            <FormControl>
              <FormLabel mb={1.5}>
                <Text textStyle="h10" fontWeight="500" color="neutral.700">
                  {t('pages.pumpOperators.attendanceModal.dateRangeLabel')}
                </Text>
              </FormLabel>
              <DateRangePicker
                value={attendanceRange}
                onChange={setAttendanceRange}
                placeholder={t('pages.pumpOperators.attendanceModal.dateRangePlaceholder')}
                width="100%"
                height="40px"
                borderRadius="6px"
                fontSize="sm"
                textColor="neutral.500"
                borderColor="neutral.300"
                isFilter={false}
                popoverPlacement="bottom-end"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter p={0} mt={6} gap={3}>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCloseAttendanceModal}
              isDisabled={isDownloading}
            >
              {t('pages.pumpOperators.attendanceModal.cancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => void handleDownloadAttendance()}
              isLoading={isDownloading}
              isDisabled={!attendanceRange?.startDate || !attendanceRange?.endDate}
            >
              {t('pages.pumpOperators.attendanceModal.download')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
