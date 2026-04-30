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
import { getOutageTimeScaleXAxisLabel } from './outage-time-scale-toggle'
import { useOutageDistributionState } from './use-outage-distribution-state'

type PerformanceTimeScale = 'day' | 'week' | 'month' | 'quarter' | 'year'
type OutageTimeScale = 'day' | 'week' | 'month' | 'quarter' | 'year'

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
  quantityTimeScaleTab?: PerformanceTimeScale
  onQuantityTimeScaleTabChange?: (value: PerformanceTimeScale) => void
  regularityTimeScaleTab?: PerformanceTimeScale
  onRegularityTimeScaleTabChange?: (value: PerformanceTimeScale) => void
  outageDistributionTimeScaleTab?: OutageTimeScale
  onOutageDistributionTimeScaleTabChange?: (value: OutageTimeScale) => void
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
  schemePerformancePage?: number
  totalSchemePages?: number
  onSchemePageChange?: (page: number) => void
  tableDateFormat?: string
  enableExtendedTimeScales?: boolean
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
  quantityTimeScaleTab,
  onQuantityTimeScaleTabChange,
  regularityTimeScaleTab,
  onRegularityTimeScaleTabChange,
  outageDistributionTimeScaleTab,
  onOutageDistributionTimeScaleTabChange,
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
  schemePerformancePage,
  totalSchemePages,
  onSchemePageChange,
  tableDateFormat,
  enableExtendedTimeScales = false,
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
  const outageTimeXAxisLabel = getOutageTimeScaleXAxisLabel(outageDistributionTimeScaleTab, t)
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
          quantityTimeScaleTab={quantityTimeScaleTab}
          onQuantityTimeScaleTabChange={onQuantityTimeScaleTabChange}
          regularityTimeScaleTab={regularityTimeScaleTab}
          onRegularityTimeScaleTabChange={onRegularityTimeScaleTabChange}
          regularityPerformanceData={regularityPerformanceData}
          regularityTimeTrendData={regularityTimeTrendData}
          isRegularityTimeTrendLoading={isRegularityTimeTrendLoading}
          geographyEntityLabel={geographyEntityLabel}
          tableDateFormat={tableDateFormat}
          enableExtendedTimeScales={enableExtendedTimeScales}
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
          quantityTimeScaleTab={quantityTimeScaleTab}
          onQuantityTimeScaleTabChange={onQuantityTimeScaleTabChange}
          regularityTimeScaleTab={regularityTimeScaleTab}
          onRegularityTimeScaleTabChange={onRegularityTimeScaleTabChange}
          outageDistributionTimeScaleTab={outageDistributionTimeScaleTab}
          onOutageDistributionTimeScaleTabChange={onOutageDistributionTimeScaleTabChange}
          regularityPerformanceData={regularityPerformanceData}
          regularityTimeTrendData={regularityTimeTrendData}
          isRegularityTimeTrendLoading={isRegularityTimeTrendLoading}
          blockTableData={blockTableData}
          supplySubmissionRateData={supplySubmissionRateData}
          supplySubmissionRateLabel={supplySubmissionRateLabel}
          childEntityLabel={supplySubmissionRateLabel}
          operatorsPerformanceTable={operatorsPerformanceTable}
          pumpOperatorsTotal={pumpOperatorsTotal}
          schemePerformancePage={schemePerformancePage}
          totalSchemePages={totalSchemePages}
          onSchemePageChange={onSchemePageChange}
          tableDateFormat={tableDateFormat}
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
          quantityTimeScaleTab={quantityTimeScaleTab}
          onQuantityTimeScaleTabChange={onQuantityTimeScaleTabChange}
          regularityTimeScaleTab={regularityTimeScaleTab}
          onRegularityTimeScaleTabChange={onRegularityTimeScaleTabChange}
          outageDistributionTimeScaleTab={outageDistributionTimeScaleTab}
          onOutageDistributionTimeScaleTabChange={onOutageDistributionTimeScaleTabChange}
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
          schemePerformancePage={schemePerformancePage}
          totalSchemePages={totalSchemePages}
          onSchemePageChange={onSchemePageChange}
          tableDateFormat={tableDateFormat}
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
          quantityTimeScaleTab={quantityTimeScaleTab}
          onQuantityTimeScaleTabChange={onQuantityTimeScaleTabChange}
          regularityTimeScaleTab={regularityTimeScaleTab}
          onRegularityTimeScaleTabChange={onRegularityTimeScaleTabChange}
          outageDistributionTimeScaleTab={outageDistributionTimeScaleTab}
          onOutageDistributionTimeScaleTabChange={onOutageDistributionTimeScaleTabChange}
          regularityPerformanceData={regularityPerformanceData}
          regularityTimeTrendData={regularityTimeTrendData}
          isRegularityTimeTrendLoading={isRegularityTimeTrendLoading}
          villageTableData={villageTableData}
          supplySubmissionRateData={supplySubmissionRateData}
          supplySubmissionRateLabel={supplySubmissionRateLabel}
          childEntityLabel={supplySubmissionRateLabel}
          pumpOperatorsTotal={pumpOperatorsTotal}
          operatorsPerformanceTable={operatorsPerformanceTable}
          schemePerformancePage={schemePerformancePage}
          totalSchemePages={totalSchemePages}
          onSchemePageChange={onSchemePageChange}
          tableDateFormat={tableDateFormat}
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
          quantityTimeScaleTab={quantityTimeScaleTab}
          onQuantityTimeScaleTabChange={onQuantityTimeScaleTabChange}
          regularityTimeScaleTab={regularityTimeScaleTab}
          onRegularityTimeScaleTabChange={onRegularityTimeScaleTabChange}
          tableDateFormat={tableDateFormat}
          enableExtendedTimeScales={enableExtendedTimeScales}
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
                  <Flex
                    align="center"
                    gap="8px"
                    sx={{
                      '@media (max-width: 1279px)': {
                        flexDirection: 'column-reverse',
                        alignItems: 'flex-end',
                        gap: '6px',
                      },
                    }}
                  >
                    {outageDistributionViewBy === 'time' &&
                    outageDistributionTimeScaleTab &&
                    onOutageDistributionTimeScaleTabChange ? (
                      <Flex
                        align="center"
                        bg="#F4F4F5"
                        borderRadius="999px"
                        p="4px"
                        gap="4px"
                        sx={{
                          '@media (max-width: 767px)': {
                            p: '2px',
                            gap: '2px',
                          },
                        }}
                      >
                        {[
                          { key: 'day', label: 'D' },
                          { key: 'week', label: 'W' },
                          { key: 'month', label: 'M' },
                          { key: 'quarter', label: 'Q' },
                          { key: 'year', label: 'Y' },
                        ].map((item) => {
                          const isActive = outageDistributionTimeScaleTab === item.key
                          const timeScaleAriaLabelMap: Record<OutageTimeScale, string> = {
                            day: 'Day view',
                            week: 'Week view',
                            month: 'Month view',
                            quarter: 'Quarter view',
                            year: 'Year view',
                          }
                          return (
                            <Box
                              as="button"
                              key={item.key}
                              type="button"
                              aria-pressed={isActive}
                              aria-label={
                                timeScaleAriaLabelMap[item.key as OutageTimeScale] ??
                                `${item.label} view`
                              }
                              h="32px"
                              minW="44px"
                              px="12px"
                              borderRadius="999px"
                              bg={isActive ? 'white' : 'transparent'}
                              textStyle="bodyText5"
                              fontWeight={isActive ? '600' : '500'}
                              onClick={() =>
                                onOutageDistributionTimeScaleTabChange(item.key as OutageTimeScale)
                              }
                              sx={{
                                '@media (max-width: 767px)': {
                                  h: '26px',
                                  minW: '34px',
                                  px: '8px',
                                  fontSize: '12px',
                                  lineHeight: '16px',
                                },
                              }}
                            >
                              {item.label}
                            </Box>
                          )
                        })}
                      </Flex>
                    ) : null}
                    <ViewBySelect
                      ariaLabel={t('outageAndSubmissionCharts.ariaViewByState', {
                        defaultValue: 'State supply outage distribution view by',
                      })}
                      value={outageDistributionViewBy}
                      onChange={(value) => {
                        if (
                          value === 'time' &&
                          onOutageDistributionTimeScaleTabChange &&
                          !outageDistributionTimeScaleTab
                        ) {
                          onOutageDistributionTimeScaleTabChange('day')
                        }
                        setOutageDistributionViewBy(value)
                      }}
                      disabled={isOutageDistributionSelectDisabled}
                    />
                  </Flex>
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
                        dateFormat={tableDateFormat}
                      />
                    ) : (
                      <ChartEmptyState minHeight="100%" />
                    )
                  ) : hasTimeTrendData ? (
                    <MonthlyTrendChart
                      data={outageDistributionTimeTrendData}
                      height="100%"
                      xAxisLabel={outageTimeXAxisLabel}
                      yAxisLabel={t('outageAndSubmissionCharts.axis.noOfReasons', {
                        defaultValue: 'No. of days',
                      })}
                      seriesName={t('outageAndSubmissionCharts.series.supplyOutage', {
                        defaultValue: 'Supply outage',
                      })}
                      dateFormat={tableDateFormat}
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
                      dateFormat={tableDateFormat}
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
          tableDateFormat={tableDateFormat}
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
  quantityTimeScaleTab?: 'day' | 'week' | 'month' | 'quarter' | 'year'
  onQuantityTimeScaleTabChange?: (value: 'day' | 'week' | 'month' | 'quarter' | 'year') => void
  regularityTimeScaleTab?: 'day' | 'week' | 'month' | 'quarter' | 'year'
  onRegularityTimeScaleTabChange?: (value: 'day' | 'week' | 'month' | 'quarter' | 'year') => void
  regularityPerformanceData: EntityPerformance[]
  regularityTimeTrendData: MonthlyTrendPoint[]
  isRegularityTimeTrendLoading: boolean
  geographyEntityLabel: string
  tableDateFormat?: string
  enableExtendedTimeScales?: boolean
}

function PerformanceChartsSection({
  quantityPerformanceData,
  quantityTimeTrendData,
  isQuantityTimeTrendLoading,
  isQuantityTimeTrendAwaitingParams,
  quantityTimeScaleTab,
  onQuantityTimeScaleTabChange,
  regularityTimeScaleTab,
  onRegularityTimeScaleTabChange,
  regularityPerformanceData,
  regularityTimeTrendData,
  isRegularityTimeTrendLoading,
  geographyEntityLabel,
  tableDateFormat,
  enableExtendedTimeScales = false,
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
        regularityTimeScaleTab={regularityTimeScaleTab}
        onRegularityTimeScaleTabChange={onRegularityTimeScaleTabChange}
        dateFormat={tableDateFormat}
        enableExtendedTimeScales={enableExtendedTimeScales}
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
        quantityTimeScaleTab={quantityTimeScaleTab}
        onQuantityTimeScaleTabChange={onQuantityTimeScaleTabChange}
        dateFormat={tableDateFormat}
        enableExtendedTimeScales={enableExtendedTimeScales}
      />
    </Grid>
  )
}
