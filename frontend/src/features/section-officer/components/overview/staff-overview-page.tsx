import { useEffect, useState } from 'react'
import { Box, Flex, Heading, SimpleGrid, Spinner, Stack, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
// import { BsDroplet } from 'react-icons/bs'
import TapIconComponent from '@/shared/components/layout/tap-icon'
import { MdOutlineWaterDrop, MdOutlineTrendingUp } from 'react-icons/md'
import { ChartEmptyState, DateRangePicker, PageHeader, StatCard } from '@/shared/components/common'
import type { DateRange } from '@/shared/components/common'
import {
  SupplyOutageReasonsChart,
  ReadingSubmissionRateChart,
} from '@/features/dashboard/components/charts'
import { SupplyOutageDistributionChart } from '@/shared/components/charts/supply-outage-distribution-chart'
import {
  useSchemesCountQuery,
  useOutageReasonsQuery,
  useNonSubmissionReasonsQuery,
  useSubmissionStatusQuery,
} from '../../services/query/use-overview-queries'
import { IoCloseCircleOutline } from 'react-icons/io5'

function getDefaultDateRange(): DateRange {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const start = new Date(now)
  start.setDate(now.getDate() - 29)
  return { startDate: toIso(start), endDate: toIso(now) }
}

const CHART_HEIGHT = '340px'
const PIE_SIZE = 260

export function StaffOverviewPage() {
  const { t } = useTranslation('section-officer')
  const [dateRange, setDateRange] = useState<DateRange>(() => getDefaultDateRange())

  const { data: schemesCountData, isLoading: isSchemesCountLoading } = useSchemesCountQuery()

  const {
    data: outageReasonsData,
    isLoading: isOutageReasonsLoading,
    isError: isOutageReasonsError,
  } = useOutageReasonsQuery(dateRange.startDate, dateRange.endDate)

  const {
    data: nonSubmissionData,
    isLoading: isNonSubmissionLoading,
    isError: isNonSubmissionError,
  } = useNonSubmissionReasonsQuery(dateRange.startDate, dateRange.endDate)

  const {
    data: submissionStatusData,
    isLoading: isSubmissionStatusLoading,
    isError: isSubmissionStatusError,
  } = useSubmissionStatusQuery(dateRange.startDate, dateRange.endDate)

  useEffect(() => {
    document.title = `${t('pages.overview.heading')} | JalSoochak`
  }, [t])

  const schemeCount = isSchemesCountLoading ? '…' : String(schemesCountData?.schemeCount ?? 0)

  const statsCards = [
    {
      title: t('pages.overview.stats.totalSchemes'),
      value: schemeCount,
      icon: TapIconComponent,
      iconBg: '#EBF4FA',
      iconColor: '#3291D1',
    },
    {
      title: t('pages.overview.stats.quantityMld'),
      value: '—',
      icon: MdOutlineWaterDrop,
      iconBg: '#EBF4FA',
      iconColor: '#3291D1',
    },
    {
      title: t('pages.overview.stats.anomaliesFlagged'),
      value: '—',
      icon: IoCloseCircleOutline,
      iconBg: '#FEF3C7',
      iconColor: '#D97706',
    },
    {
      title: t('pages.overview.stats.escalations'),
      value: '—',
      icon: MdOutlineTrendingUp,
      iconBg: '#FEE2E2',
      iconColor: '#DC2626',
    },
  ]

  return (
    <Box w="full">
      <PageHeader
        rightContent={
          <DateRangePicker
            isFilter
            value={dateRange}
            onChange={(next) => {
              if (next) setDateRange(next)
            }}
          />
        }
      >
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
          {t('pages.overview.heading')}
        </Heading>
      </PageHeader>

      <Stack gap={{ base: 4, md: 6 }}>
        {/* Metric cards */}
        <SimpleGrid
          as="section"
          aria-label={t('pages.overview.stats.totalSchemes')}
          columns={{ base: 1, sm: 2, md: 2, lg: 4 }}
          spacing={{ base: 4, md: 7 }}
        >
          {statsCards.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              iconBg={stat.iconBg}
              iconColor={stat.iconColor}
            />
          ))}
        </SimpleGrid>

        {/* Row 1: Outage Reasons */}
        <ChartRow title={t('pages.overview.charts.outageReasons.title')}>
          <ChartCell isLoading={isOutageReasonsLoading} isError={isOutageReasonsError}>
            <SupplyOutageReasonsChart
              data={outageReasonsData?.pieData ?? []}
              height={CHART_HEIGHT}
              pieSize={PIE_SIZE}
            />
          </ChartCell>
          <ChartCell isLoading={isOutageReasonsLoading} isError={isOutageReasonsError}>
            <SupplyOutageDistributionChart
              data={outageReasonsData?.histogramData ?? []}
              height={CHART_HEIGHT}
              xAxisLabel={t('pages.overview.charts.outageReasons.xAxisLabel')}
            />
          </ChartCell>
        </ChartRow>

        {/* Row 2: Non-Submission Reasons */}
        <ChartRow title={t('pages.overview.charts.nonSubmissionReasons.title')}>
          <ChartCell isLoading={isNonSubmissionLoading} isError={isNonSubmissionError}>
            <SupplyOutageReasonsChart
              data={nonSubmissionData?.pieData ?? []}
              height={CHART_HEIGHT}
              pieSize={PIE_SIZE}
            />
          </ChartCell>
          <ChartCell isLoading={isNonSubmissionLoading} isError={isNonSubmissionError}>
            <SupplyOutageDistributionChart
              data={nonSubmissionData?.histogramData ?? []}
              height={CHART_HEIGHT}
              xAxisLabel={t('pages.overview.charts.nonSubmissionReasons.xAxisLabel')}
            />
          </ChartCell>
        </ChartRow>

        {/* Row 3: Submission Status */}
        <ChartRow title={t('pages.overview.charts.submissionStatus.title')}>
          <ChartCell isLoading={isSubmissionStatusLoading} isError={isSubmissionStatusError}>
            <SupplyOutageReasonsChart
              data={submissionStatusData?.pieData ?? []}
              height={CHART_HEIGHT}
              pieSize={PIE_SIZE}
            />
          </ChartCell>
          <ChartCell isLoading={isSubmissionStatusLoading} isError={isSubmissionStatusError}>
            <ReadingSubmissionRateChart
              data={submissionStatusData?.barData ?? []}
              height={CHART_HEIGHT}
              entityLabel={t('pages.overview.charts.submissionStatus.xAxisLabel')}
            />
          </ChartCell>
        </ChartRow>
      </Stack>
    </Box>
  )
}

interface ChartRowProps {
  readonly title: string
  readonly children: React.ReactNode
}

function ChartRow({ title, children }: ChartRowProps) {
  return (
    <Box as="section">
      <Text textStyle="h6" fontWeight="600" mb={3} color="neutral.800">
        {title}
      </Text>
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 4, md: 6 }}>
        {children}
      </SimpleGrid>
    </Box>
  )
}

interface ChartCellProps {
  readonly isLoading: boolean
  readonly isError: boolean
  readonly children: React.ReactNode
}

function ChartCell({ isLoading, isError, children }: ChartCellProps) {
  let content: React.ReactNode
  if (isLoading) {
    content = (
      <Flex h="340px" align="center" justify="center">
        <Spinner size="md" color="primary.500" />
      </Flex>
    )
  } else if (isError) {
    content = <ChartEmptyState minHeight="340px" message="Failed to load data" />
  } else {
    content = children
  }

  return (
    <Box
      bg="white"
      borderRadius="12px"
      border="1px solid"
      borderColor="neutral.100"
      p={{ base: 4, md: 5 }}
      overflow="hidden"
    >
      {content}
    </Box>
  )
}
