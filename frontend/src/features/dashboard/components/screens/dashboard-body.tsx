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
  MetricPerformanceChart,
  MonthlyTrendChart,
  ReadingSubmissionRateChart,
  SupplyOutageDistributionChart,
} from '../charts'
import { BlockDashboardScreen } from './block-dashboard'
import { DistrictDashboardScreen } from './district-dashboard'
import { GramPanchayatDashboardScreen } from './gram-panchayat-dashboard'
import { StateUtDashboardScreen } from './state-ut-dashboard'
import { ChartEmptyState, LoadingSpinner, ViewBySelect } from '@/shared/components/common'
import type { MonthlyTrendPoint } from '../charts/monthly-trend-chart'
import { VillageDashboardScreen } from './village-dashboard'

type DashboardBodyProps = {
  data: DashboardData
  isStateSelected: boolean
  isDistrictSelected: boolean
  isBlockSelected: boolean
  isGramPanchayatSelected: boolean
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
  isStateSelected,
  isDistrictSelected,
  isBlockSelected,
  isGramPanchayatSelected,
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
  const [quantityViewBy, setQuantityViewBy] = useState<ViewBy>('geography')
  const [regularityViewBy, setRegularityViewBy] = useState<ViewBy>('geography')
  const [outageDistributionViewBy, setOutageDistributionViewBy] = useState<ViewBy>('geography')
  const isStateScreen =
    isStateSelected &&
    !isDistrictSelected &&
    !isBlockSelected &&
    !isGramPanchayatSelected &&
    !selectedVillage
  const isDistrictScreen =
    isDistrictSelected && !isBlockSelected && !isGramPanchayatSelected && !selectedVillage
  const isBlockScreen = isBlockSelected && !isGramPanchayatSelected && !selectedVillage
  const isGramPanchayatScreen = isGramPanchayatSelected && !selectedVillage

  const outageDistributionTimeTrendData = useMemo(
    () => data.supplyOutageTrend ?? [],
    [data.supplyOutageTrend]
  )
  const geographyEntityLabel = isStateScreen
    ? t('performanceCharts.viewBy.districts', { defaultValue: 'Districts' })
    : t('performanceCharts.viewBy.statesUTs', { defaultValue: 'States/UTs' })
  return (
    <>
      {/* Quantity + Regularity Charts */}
      {!selectedVillage && !isDistrictScreen && !isBlockScreen && !isGramPanchayatScreen ? (
        <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }} gap={6} mb={6}>
          <Box
            bg="white"
            borderWidth="0.5px"
            borderRadius="12px"
            borderColor="#E4E4E7"
            px="16px"
            pt="24px"
            pb="24px"
            h="536px"
            w="full"
            minW={0}
          >
            <Flex align="center" justify="space-between" mb="16px">
              <Text textStyle="bodyText3" fontWeight="400">
                {t('performanceCharts.quantity.title', { defaultValue: 'Quantity Performance' })}
              </Text>
              <ViewBySelect
                ariaLabel={t('performanceCharts.quantity.ariaViewBy', {
                  defaultValue: 'Quantity performance view by',
                })}
                value={quantityViewBy}
                onChange={setQuantityViewBy}
              />
            </Flex>
            {quantityViewBy === 'geography' ? (
              <MetricPerformanceChart
                data={quantityPerformanceData}
                metric="quantity"
                height="400px"
                entityLabel={geographyEntityLabel}
                yAxisLabel={t('performanceCharts.quantity.yAxisLabel', {
                  defaultValue: 'Quantity',
                })}
                seriesName={t('performanceCharts.quantity.seriesName', {
                  defaultValue: 'Quantity',
                })}
                showAreaLine
                areaSeriesName={t('performanceCharts.quantity.areaSeriesName', {
                  defaultValue: 'Demand',
                })}
              />
            ) : (
              <>
                {isQuantityTimeTrendLoading ? (
                  <Flex align="center" justify="center" h="400px">
                    <LoadingSpinner />
                  </Flex>
                ) : quantityTimeTrendData.length > 0 ? (
                  <MonthlyTrendChart
                    data={quantityTimeTrendData}
                    height="400px"
                    xAxisLabel={t('performanceCharts.viewBy.month', { defaultValue: 'Month' })}
                    yAxisLabel={t('performanceCharts.quantity.yAxisLabel', {
                      defaultValue: 'Quantity',
                    })}
                    seriesName={t('performanceCharts.quantity.seriesName', {
                      defaultValue: 'Quantity',
                    })}
                  />
                ) : isQuantityTimeTrendAwaitingParams ? null : (
                  <ChartEmptyState minHeight="400px" />
                )}
              </>
            )}
          </Box>
          <Box
            bg="white"
            borderWidth="0.5px"
            borderRadius="12px"
            borderColor="#E4E4E7"
            px="16px"
            pt="24px"
            pb="24px"
            h="536px"
            minW={0}
          >
            <Flex align="center" justify="space-between" mb="16px">
              <Text textStyle="bodyText3" fontWeight="400">
                {t('performanceCharts.regularity.title', {
                  defaultValue: 'Regularity Performance',
                })}
              </Text>
              <ViewBySelect
                ariaLabel={t('performanceCharts.regularity.ariaViewBy', {
                  defaultValue: 'Regularity performance view by',
                })}
                value={regularityViewBy}
                onChange={setRegularityViewBy}
              />
            </Flex>
            {regularityViewBy === 'geography' ? (
              <MetricPerformanceChart
                data={regularityPerformanceData}
                metric="regularity"
                height="400px"
                entityLabel={geographyEntityLabel}
                yAxisLabel={t('performanceCharts.regularity.yAxisLabel', {
                  defaultValue: 'Regularity',
                })}
                seriesName={t('performanceCharts.regularity.seriesName', {
                  defaultValue: 'Regularity',
                })}
              />
            ) : (
              <>
                {isRegularityTimeTrendLoading ? (
                  <Flex align="center" justify="center" h="400px">
                    <LoadingSpinner />
                  </Flex>
                ) : regularityTimeTrendData.length > 0 ? (
                  <MonthlyTrendChart
                    data={regularityTimeTrendData}
                    height="400px"
                    isPercent
                    xAxisLabel={t('performanceCharts.viewBy.month', { defaultValue: 'Month' })}
                    yAxisLabel={t('performanceCharts.regularity.yAxisLabelPercent', {
                      defaultValue: 'Regularity (%)',
                    })}
                    seriesName={t('performanceCharts.regularity.seriesName', {
                      defaultValue: 'Regularity',
                    })}
                  />
                ) : (
                  <ChartEmptyState minHeight="400px" />
                )}
              </>
            )}
          </Box>
        </Grid>
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
          pumpOperatorsTotal={pumpOperatorsTotal}
          operatorsPerformanceTable={operatorsPerformanceTable}
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
      {!selectedVillage && !isDistrictScreen && !isBlockSelected && !isGramPanchayatScreen ? (
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
          <Box bg="white" borderWidth="1px" borderRadius="lg" px={4} py={6} h="510px" minW={0}>
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
                  />
                </Flex>
                {outageDistributionViewBy === 'geography' ? (
                  <SupplyOutageDistributionChart
                    data={waterSupplyOutageDistributionData}
                    height="400px"
                    xAxisLabel={geographyEntityLabel}
                  />
                ) : (
                  <MonthlyTrendChart
                    data={outageDistributionTimeTrendData}
                    height="400px"
                    xAxisLabel={t('performanceCharts.viewBy.month', { defaultValue: 'Month' })}
                    yAxisLabel={t('outageAndSubmissionCharts.axis.noOfDays', {
                      defaultValue: 'No. of days',
                    })}
                    seriesName={t('outageAndSubmissionCharts.series.supplyOutage', {
                      defaultValue: 'Supply outage',
                    })}
                  />
                )}
              </>
            ) : (
              <>
                <Text textStyle="bodyText3" fontWeight="400" mb="16px">
                  {t('outageAndSubmissionCharts.titles.readingSubmissionRate', {
                    defaultValue: 'Reading Submission Rate',
                  })}
                </Text>
                <ReadingSubmissionRateChart
                  data={supplySubmissionRateData}
                  height="383px"
                  entityLabel={supplySubmissionRateLabel}
                />
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
