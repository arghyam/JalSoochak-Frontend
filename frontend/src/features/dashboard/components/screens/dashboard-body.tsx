import { useMemo, useState } from 'react'
import { Box, Flex, Grid, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import type {
  DashboardData,
  EntityPerformance,
  PumpOperatorPerformanceData,
  VillagePumpOperatorDetails,
  WaterSupplyOutageData,
} from '../../types'
import {
  SupplyOutageReasonsChart,
  MonthlyTrendChart,
  ReadingSubmissionRateChart,
  SupplyOutageDistributionChart,
} from '../charts'
import { BlockDashboardScreen } from './block-dashboard'
import { DistrictDashboardScreen } from './district-dashboard'
import { GramPanchayatDashboardScreen } from './gram-panchayat-dashboard'
import { PerformanceChartCard } from './performance-chart-card'
import { StateUtDashboardScreen } from './state-ut-dashboard'
import { ChartEmptyState, ViewBySelect } from '@/shared/components/common'
import type { MonthlyTrendPoint } from '../charts/monthly-trend-chart'
import { VillageDashboardScreen } from './village-dashboard'
import { useOutageDistributionState } from './use-outage-distribution-state'

type DashboardBodyProps = {
  data: DashboardData
  performanceScreenKey?: string | null
  isStateSelected: boolean
  isDepartmentStateSelected?: boolean
  isDistrictSelected: boolean
  isBlockSelected: boolean
  isGramPanchayatSelected: boolean
  isDepartmentZoneSelected?: boolean
  isDepartmentCircleSelected?: boolean
  isDepartmentDivisionSelected?: boolean
  selectedVillage: string
  quantityPerformanceData: EntityPerformance[]
  quantityTimeTrendData: MonthlyTrendPoint[]
  isQuantityTimeTrendLoading?: boolean
  isQuantityTimeTrendAwaitingParams?: boolean
  regularityPerformanceData: EntityPerformance[]
  regularityTimeTrendData: MonthlyTrendPoint[]
  isRegularityTimeTrendLoading?: boolean
  districtTableData: EntityPerformance[]
  blockTableData: EntityPerformance[]
  gramPanchayatTableData: EntityPerformance[]
  villageTableData: EntityPerformance[]
  supplySubmissionRateData: EntityPerformance[]
  supplySubmissionRateLabel: string
  waterSupplyOutagesData: WaterSupplyOutageData[]
  waterSupplyOutageDistributionData: WaterSupplyOutageData[]
  pumpOperatorsTotal: number
  operatorsPerformanceTable: PumpOperatorPerformanceData[]
  villagePhotoEvidenceRows: DashboardData['readingCompliance']
  villagePumpOperatorDetails?: VillagePumpOperatorDetails
  villagePumpOperators?: VillagePumpOperatorDetails[]
  tenantCode?: string
  schemeId?: number
}

type ViewBy = 'geography' | 'time'

export function DashboardBody({
  data,
  performanceScreenKey = null,
  isStateSelected,
  isDepartmentStateSelected = false,
  isDistrictSelected,
  isBlockSelected,
  isGramPanchayatSelected,
  isDepartmentZoneSelected = false,
  isDepartmentCircleSelected = false,
  isDepartmentDivisionSelected = false,
  selectedVillage,
  quantityPerformanceData,
  quantityTimeTrendData,
  isQuantityTimeTrendLoading = false,
  isQuantityTimeTrendAwaitingParams = false,
  regularityPerformanceData,
  regularityTimeTrendData,
  isRegularityTimeTrendLoading = false,
  blockTableData,
  gramPanchayatTableData,
  villageTableData,
  supplySubmissionRateData,
  supplySubmissionRateLabel,
  waterSupplyOutagesData,
  waterSupplyOutageDistributionData,
  pumpOperatorsTotal,
  operatorsPerformanceTable,
  villagePhotoEvidenceRows,
  villagePumpOperatorDetails,
  villagePumpOperators,
  tenantCode,
  schemeId,
}: DashboardBodyProps) {
  const { t } = useTranslation('dashboard')
  const [outageDistributionViewBy, setOutageDistributionViewBy] = useState<ViewBy>('geography')
  const isAdministrativeStateScreen =
    isStateSelected &&
    !isDistrictSelected &&
    !isBlockSelected &&
    !isGramPanchayatSelected &&
    !isDepartmentZoneSelected &&
    !isDepartmentCircleSelected &&
    !isDepartmentDivisionSelected &&
    !selectedVillage
  const isDepartmentStateScreen =
    isDepartmentStateSelected &&
    !isDistrictSelected &&
    !isBlockSelected &&
    !isGramPanchayatSelected &&
    !isDepartmentZoneSelected &&
    !isDepartmentCircleSelected &&
    !isDepartmentDivisionSelected &&
    !selectedVillage
  const isStateScreen = isAdministrativeStateScreen || isDepartmentStateScreen
  const isDistrictScreen =
    (isDistrictSelected || isDepartmentZoneSelected) &&
    !isBlockSelected &&
    !isGramPanchayatSelected &&
    !isDepartmentCircleSelected &&
    !isDepartmentDivisionSelected &&
    !selectedVillage
  const isBlockScreen =
    (isBlockSelected || isDepartmentCircleSelected) &&
    !isGramPanchayatSelected &&
    !isDepartmentDivisionSelected &&
    !selectedVillage
  const isGramPanchayatScreen =
    (isGramPanchayatSelected || isDepartmentDivisionSelected) && !selectedVillage

  const outageDistributionTimeTrendData = useMemo(
    () => data.supplyOutageTrend ?? [],
    [data.supplyOutageTrend]
  )
  const {
    hasOutageReasonsData,
    hasGeographyData,
    hasTimeTrendData,
    isOutageDistributionSelectDisabled,
  } = useOutageDistributionState({
    waterSupplyOutagesData,
    outageDistributionViewBy,
    waterSupplyOutageDistributionData,
    outageDistributionTimeTrendData,
  })
  const geographyEntityLabel = isAdministrativeStateScreen
    ? t('performanceCharts.viewBy.districts', { defaultValue: 'Districts' })
    : supplySubmissionRateLabel
  return (
    <>
      {/* Quantity + Regularity Charts */}
      {!selectedVillage && !isDistrictScreen && !isBlockScreen && !isGramPanchayatScreen ? (
        <PerformanceChartsSection
          key={performanceScreenKey ?? 'hidden-performance-screen'}
          quantityPerformanceData={quantityPerformanceData}
          quantityTimeTrendData={quantityTimeTrendData}
          isQuantityTimeTrendLoading={isQuantityTimeTrendLoading}
          isQuantityTimeTrendAwaitingParams={isQuantityTimeTrendAwaitingParams}
          regularityPerformanceData={regularityPerformanceData}
          regularityTimeTrendData={regularityTimeTrendData}
          isRegularityTimeTrendLoading={isRegularityTimeTrendLoading}
          geographyEntityLabel={geographyEntityLabel}
        />
      ) : null}

      {isDistrictScreen ? (
        <DistrictDashboardScreen
          data={data}
          waterSupplyOutagesData={waterSupplyOutagesData}
          waterSupplyOutageDistributionData={waterSupplyOutageDistributionData}
          quantityPerformanceData={quantityPerformanceData}
          quantityTimeTrendData={quantityTimeTrendData}
          isQuantityTimeTrendLoading={isQuantityTimeTrendLoading}
          isQuantityTimeTrendAwaitingParams={isQuantityTimeTrendAwaitingParams}
          regularityPerformanceData={regularityPerformanceData}
          regularityTimeTrendData={regularityTimeTrendData}
          isRegularityTimeTrendLoading={isRegularityTimeTrendLoading}
          blockTableData={blockTableData}
          supplySubmissionRateData={supplySubmissionRateData}
          supplySubmissionRateLabel={supplySubmissionRateLabel}
          childEntityLabel={supplySubmissionRateLabel}
          operatorsPerformanceTable={operatorsPerformanceTable}
          pumpOperatorsTotal={pumpOperatorsTotal}
        />
      ) : null}
      {isBlockScreen ? (
        <BlockDashboardScreen
          data={data}
          waterSupplyOutagesData={waterSupplyOutagesData}
          waterSupplyOutageDistributionData={waterSupplyOutageDistributionData}
          quantityPerformanceData={quantityPerformanceData}
          quantityTimeTrendData={quantityTimeTrendData}
          isQuantityTimeTrendLoading={isQuantityTimeTrendLoading}
          isQuantityTimeTrendAwaitingParams={isQuantityTimeTrendAwaitingParams}
          regularityPerformanceData={regularityPerformanceData}
          regularityTimeTrendData={regularityTimeTrendData}
          isRegularityTimeTrendLoading={isRegularityTimeTrendLoading}
          gramPanchayatTableData={gramPanchayatTableData}
          supplySubmissionRateData={supplySubmissionRateData}
          supplySubmissionRateLabel={supplySubmissionRateLabel}
          childEntityLabel={supplySubmissionRateLabel}
          pumpOperatorsTotal={pumpOperatorsTotal}
          operatorsPerformanceTable={operatorsPerformanceTable}
          showSupplyOutageReasons
          showReadingSubmissionRate
          showReadingSubmissionSection
        />
      ) : null}
      {isGramPanchayatScreen ? (
        <GramPanchayatDashboardScreen
          data={data}
          waterSupplyOutagesData={waterSupplyOutagesData}
          waterSupplyOutageDistributionData={waterSupplyOutageDistributionData}
          quantityPerformanceData={quantityPerformanceData}
          quantityTimeTrendData={quantityTimeTrendData}
          isQuantityTimeTrendLoading={isQuantityTimeTrendLoading}
          isQuantityTimeTrendAwaitingParams={isQuantityTimeTrendAwaitingParams}
          regularityPerformanceData={regularityPerformanceData}
          regularityTimeTrendData={regularityTimeTrendData}
          isRegularityTimeTrendLoading={isRegularityTimeTrendLoading}
          villageTableData={villageTableData}
          supplySubmissionRateData={supplySubmissionRateData}
          supplySubmissionRateLabel={supplySubmissionRateLabel}
          childEntityLabel={supplySubmissionRateLabel}
          pumpOperatorsTotal={pumpOperatorsTotal}
          operatorsPerformanceTable={operatorsPerformanceTable}
        />
      ) : null}

      {selectedVillage && villagePumpOperatorDetails ? (
        <VillageDashboardScreen
          key={`${selectedVillage}:${schemeId ?? villagePumpOperatorDetails.schemeId ?? 'unknown-scheme'}`}
          data={data}
          villagePhotoEvidenceRows={villagePhotoEvidenceRows}
          waterSupplyOutagesData={waterSupplyOutagesData}
          villagePumpOperatorDetails={villagePumpOperatorDetails}
          villagePumpOperators={villagePumpOperators}
          tenantCode={tenantCode}
          schemeId={schemeId}
          quantityTimeTrendData={quantityTimeTrendData}
          regularityTimeTrendData={regularityTimeTrendData}
          isQuantityTimeTrendLoading={isQuantityTimeTrendLoading}
          isRegularityTimeTrendLoading={isRegularityTimeTrendLoading}
        />
      ) : null}

      {/* Supply outage reasons + distribution/submission */}
      {!selectedVillage &&
      !isDistrictScreen &&
      !isBlockSelected &&
      !isGramPanchayatScreen &&
      !isDepartmentCircleSelected ? (
        <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }} gap={6} mb={6}>
          <Box
            bg="white"
            borderWidth="0.5px"
            borderRadius="12px"
            borderColor="#E4E4E7"
            pt="24px"
            pb="24px"
            pl="16px"
            pr="16px"
            h="510px"
            w="full"
            minW={0}
          >
            <Text textStyle="bodyText3" fontWeight="400" mb="40px">
              {t('outageAndSubmissionCharts.titles.supplyOutageReasons', {
                defaultValue: 'Supply Outage Reasons',
              })}
            </Text>
            <SupplyOutageReasonsChart data={waterSupplyOutagesData} height="336px" />
          </Box>
          <Box
            bg="white"
            borderWidth="1px"
            borderRadius="lg"
            px={4}
            py={6}
            h="510px"
            minW={0}
            display="flex"
            flexDirection="column"
          >
            {isStateScreen ? (
              <>
                <Flex align="center" justify="space-between" mb="16px">
                  <Text textStyle="bodyText3" fontWeight="400">
                    {t('outageAndSubmissionCharts.titles.supplyOutageDistribution', {
                      defaultValue: 'Supply Outage Distribution',
                    })}
                  </Text>
                  <ViewBySelect
                    ariaLabel={t('outageAndSubmissionCharts.ariaViewByState', {
                      defaultValue: 'State supply outage distribution view by',
                    })}
                    value={outageDistributionViewBy}
                    onChange={setOutageDistributionViewBy}
                    disabled={isOutageDistributionSelectDisabled}
                  />
                </Flex>
                <Box flex="1" minH={0}>
                  {!hasOutageReasonsData ? (
                    <ChartEmptyState minHeight="100%" />
                  ) : outageDistributionViewBy === 'geography' ? (
                    hasGeographyData ? (
                      <SupplyOutageDistributionChart
                        data={waterSupplyOutageDistributionData}
                        height="100%"
                        xAxisLabel={geographyEntityLabel}
                      />
                    ) : (
                      <ChartEmptyState minHeight="100%" />
                    )
                  ) : hasTimeTrendData ? (
                    <MonthlyTrendChart
                      data={outageDistributionTimeTrendData}
                      height="100%"
                      xAxisLabel={t('performanceCharts.viewBy.time', { defaultValue: 'Time' })}
                      yAxisLabel={t('outageAndSubmissionCharts.axis.noOfDays', {
                        defaultValue: 'No. of days',
                      })}
                      seriesName={t('outageAndSubmissionCharts.series.supplyOutage', {
                        defaultValue: 'Supply outage',
                      })}
                    />
                  ) : (
                    <ChartEmptyState minHeight="100%" />
                  )}
                </Box>
              </>
            ) : (
              <>
                <Text textStyle="bodyText3" fontWeight="400" mb="16px">
                  {t('outageAndSubmissionCharts.titles.readingSubmissionRate', {
                    defaultValue: 'Reading Submission Rate',
                  })}
                </Text>
                <Box flex="1" minH={0}>
                  {supplySubmissionRateData.length > 0 ? (
                    <ReadingSubmissionRateChart
                      data={supplySubmissionRateData}
                      height="100%"
                      entityLabel={supplySubmissionRateLabel}
                    />
                  ) : (
                    <ChartEmptyState minHeight="100%" />
                  )}
                </Box>
              </>
            )}
          </Box>
        </Grid>
      ) : null}

      {isStateScreen ? (
        <StateUtDashboardScreen
          data={data}
          supplySubmissionRateData={supplySubmissionRateData}
          supplySubmissionRateLabel={supplySubmissionRateLabel}
        />
      ) : null}
    </>
  )
}

type PerformanceChartsSectionProps = {
  quantityPerformanceData: EntityPerformance[]
  quantityTimeTrendData: MonthlyTrendPoint[]
  isQuantityTimeTrendLoading: boolean
  isQuantityTimeTrendAwaitingParams: boolean
  regularityPerformanceData: EntityPerformance[]
  regularityTimeTrendData: MonthlyTrendPoint[]
  isRegularityTimeTrendLoading: boolean
  geographyEntityLabel: string
}

function PerformanceChartsSection({
  quantityPerformanceData,
  quantityTimeTrendData,
  isQuantityTimeTrendLoading,
  isQuantityTimeTrendAwaitingParams,
  regularityPerformanceData,
  regularityTimeTrendData,
  isRegularityTimeTrendLoading,
  geographyEntityLabel,
}: PerformanceChartsSectionProps) {
  const { t } = useTranslation('dashboard')
  const [quantityViewBy, setQuantityViewBy] = useState<ViewBy>('geography')
  const [regularityViewBy, setRegularityViewBy] = useState<ViewBy>('geography')

  return (
    <Grid templateColumns="1fr" gap={6} mb={6}>
      <PerformanceChartCard
        title={t('performanceCharts.regularity.title', {
          defaultValue: 'Regularity Performance',
        })}
        viewByAriaLabel={t('performanceCharts.regularity.ariaViewBy', {
          defaultValue: 'Regularity performance view by',
        })}
        viewBy={regularityViewBy}
        onViewByChange={setRegularityViewBy}
        data={regularityPerformanceData}
        metric="regularity"
        timeTrendData={regularityTimeTrendData}
        isTimeTrendLoading={isRegularityTimeTrendLoading}
        entityLabel={geographyEntityLabel}
        yAxisLabel={t('performanceCharts.regularity.yAxisLabel', {
          defaultValue: 'Regularity',
        })}
        seriesName={t('performanceCharts.regularity.seriesName', {
          defaultValue: 'Regularity',
        })}
        cardHeight="536px"
        timeXAxisLabel={t('performanceCharts.viewBy.time', { defaultValue: 'Time' })}
        isTimeTrendPercent
      />
      <PerformanceChartCard
        title={t('performanceCharts.quantity.title', { defaultValue: 'Quantity Performance' })}
        viewByAriaLabel={t('performanceCharts.quantity.ariaViewBy', {
          defaultValue: 'Quantity performance view by',
        })}
        viewBy={quantityViewBy}
        onViewByChange={setQuantityViewBy}
        data={quantityPerformanceData}
        metric="quantity"
        timeTrendData={quantityTimeTrendData}
        isTimeTrendLoading={isQuantityTimeTrendLoading}
        isTimeTrendAwaitingParams={isQuantityTimeTrendAwaitingParams}
        entityLabel={geographyEntityLabel}
        yAxisLabel={t('performanceCharts.quantity.yAxisLabel', {
          defaultValue: 'Quantity',
        })}
        seriesName={t('performanceCharts.quantity.seriesName', {
          defaultValue: 'Quantity',
        })}
        cardHeight="536px"
        showAreaLine
        areaSeriesName={t('performanceCharts.quantity.areaSeriesName', {
          defaultValue: 'Demand',
        })}
        timeXAxisLabel={t('performanceCharts.viewBy.time', { defaultValue: 'Time' })}
      />
    </Grid>
  )
}
