import { useMemo, useState } from 'react'
import { Box, Flex, Grid, Select, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import type {
  DashboardData,
  EntityPerformance,
  PumpOperatorPerformanceData,
  VillagePumpOperatorDetails,
  WaterSupplyOutageData,
} from '../../types'
import {
  IssueTypeBreakdownChart,
  MetricPerformanceChart,
  MonthlyTrendChart,
  SupplySubmissionRateChart,
  WaterSupplyOutagesChart,
} from '../charts'
import { BlockDashboardScreen } from './block-dashboard'
import { DistrictDashboardScreen } from './district-dashboard'
import { GramPanchayatDashboardScreen } from './gram-panchayat-dashboard'
import { StateUtDashboardScreen } from './state-ut-dashboard'
import { VillageDashboardScreen } from './village-dashboard'

type DashboardBodyProps = {
  data: DashboardData
  isStateSelected: boolean
  isDistrictSelected: boolean
  isBlockSelected: boolean
  isGramPanchayatSelected: boolean
  selectedVillage: string
  districtTableData: EntityPerformance[]
  blockTableData: EntityPerformance[]
  gramPanchayatTableData: EntityPerformance[]
  villageTableData: EntityPerformance[]
  supplySubmissionRateData: EntityPerformance[]
  supplySubmissionRateLabel: string
  waterSupplyOutagesData: WaterSupplyOutageData[]
  pumpOperatorsTotal: number
  operatorsPerformanceTable: PumpOperatorPerformanceData[]
  villagePhotoEvidenceRows: DashboardData['photoEvidenceCompliance']
  villagePumpOperatorDetails?: VillagePumpOperatorDetails
  villagePumpOperators?: VillagePumpOperatorDetails[]
}

type ViewBy = '' | 'geography' | 'time'

export function DashboardBody({
  data,
  isStateSelected,
  isDistrictSelected,
  isBlockSelected,
  isGramPanchayatSelected,
  selectedVillage,
  districtTableData,
  blockTableData,
  gramPanchayatTableData,
  villageTableData,
  supplySubmissionRateData,
  supplySubmissionRateLabel,
  waterSupplyOutagesData,
  pumpOperatorsTotal,
  operatorsPerformanceTable,
  villagePhotoEvidenceRows,
  villagePumpOperatorDetails,
  villagePumpOperators,
}: DashboardBodyProps) {
  const { t } = useTranslation('dashboard')
  const [quantityViewBy, setQuantityViewBy] = useState<ViewBy>('')
  const [regularityViewBy, setRegularityViewBy] = useState<ViewBy>('')
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

  const quantityTimeTrendData = useMemo(
    () =>
      data.demandSupply.map((item) => ({
        period: item.period,
        value: item.supply,
      })),
    [data.demandSupply]
  )
  const regularityTimeTrendData = useMemo(
    () =>
      data.demandSupply.map((item) => ({
        period: item.period,
        value: item.demand > 0 ? Math.min(100, Math.round((item.supply / item.demand) * 100)) : 0,
      })),
    [data.demandSupply]
  )
  const geographyMetricData = isStateScreen ? districtTableData : data.mapData
  const geographyEntityLabel = isStateScreen
    ? t('performanceCharts.viewBy.districts', { defaultValue: 'Districts' })
    : t('performanceCharts.viewBy.statesUTs', { defaultValue: 'States/UTs' })
  const quantitySelectColor = quantityViewBy === '' ? 'neutral.400' : 'primary.500'
  const quantitySelectBorderColor = quantityViewBy === '' ? 'neutral.400' : 'primary.500'
  const regularitySelectColor = regularityViewBy === '' ? 'neutral.400' : 'primary.500'
  const regularitySelectBorderColor = regularityViewBy === '' ? 'neutral.400' : 'primary.500'

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
              <Select
                aria-label={t('performanceCharts.quantity.ariaViewBy', {
                  defaultValue: 'Quantity performance view by',
                })}
                h="32px"
                maxW="128px"
                fontSize="14px"
                fontWeight="600"
                borderRadius="4px"
                borderColor={quantitySelectBorderColor}
                borderWidth="1px"
                bg="white"
                color={quantitySelectColor}
                iconColor={quantitySelectColor}
                appearance="none"
                value={quantityViewBy}
                onChange={(event) => setQuantityViewBy(event.target.value as ViewBy)}
                sx={{
                  '> option': {
                    color: 'neutral.900',
                    backgroundColor: 'white',
                  },
                }}
                _hover={{
                  borderColor: quantitySelectBorderColor,
                  color: quantitySelectColor,
                  bg: 'white',
                }}
                _focus={{
                  borderColor: quantitySelectBorderColor,
                  boxShadow: 'none',
                }}
              >
                <option value="">
                  {t('performanceCharts.viewBy.select', { defaultValue: 'Select' })}
                </option>
                <option value="geography">
                  {t('performanceCharts.viewBy.geography', { defaultValue: 'Geography' })}
                </option>
                <option value="time">
                  {t('performanceCharts.viewBy.time', { defaultValue: 'Time' })}
                </option>
              </Select>
            </Flex>
            {quantityViewBy === '' || quantityViewBy === 'geography' ? (
              <MetricPerformanceChart
                data={geographyMetricData}
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
              <Select
                aria-label={t('performanceCharts.regularity.ariaViewBy', {
                  defaultValue: 'Regularity performance view by',
                })}
                h="32px"
                maxW="128px"
                fontSize="14px"
                fontWeight="600"
                borderRadius="4px"
                borderColor={regularitySelectBorderColor}
                borderWidth="1px"
                bg="white"
                color={regularitySelectColor}
                iconColor={regularitySelectColor}
                appearance="none"
                value={regularityViewBy}
                onChange={(event) => setRegularityViewBy(event.target.value as ViewBy)}
                sx={{
                  '> option': {
                    color: 'neutral.900',
                    backgroundColor: 'white',
                  },
                }}
                _hover={{
                  borderColor: regularitySelectBorderColor,
                  color: regularitySelectColor,
                  bg: 'white',
                }}
                _focus={{
                  borderColor: regularitySelectBorderColor,
                  boxShadow: 'none',
                }}
              >
                <option value="">
                  {t('performanceCharts.viewBy.select', { defaultValue: 'Select' })}
                </option>
                <option value="geography">
                  {t('performanceCharts.viewBy.geography', { defaultValue: 'Geography' })}
                </option>
                <option value="time">
                  {t('performanceCharts.viewBy.time', { defaultValue: 'Time' })}
                </option>
              </Select>
            </Flex>
            {regularityViewBy === '' || regularityViewBy === 'geography' ? (
              <MetricPerformanceChart
                data={geographyMetricData}
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
              <MonthlyTrendChart
                data={regularityTimeTrendData}
                height="400px"
                xAxisLabel={t('performanceCharts.viewBy.month', { defaultValue: 'Month' })}
                yAxisLabel={t('performanceCharts.regularity.yAxisLabelPercent', {
                  defaultValue: 'Regularity (%)',
                })}
                seriesName={t('performanceCharts.regularity.seriesName', {
                  defaultValue: 'Regularity',
                })}
              />
            )}
          </Box>
        </Grid>
      ) : null}

      {isDistrictScreen ? (
        <DistrictDashboardScreen
          data={data}
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
          villageTableData={villageTableData}
          supplySubmissionRateData={supplySubmissionRateData}
          supplySubmissionRateLabel={supplySubmissionRateLabel}
          pumpOperatorsTotal={pumpOperatorsTotal}
          operatorsPerformanceTable={operatorsPerformanceTable}
        />
      ) : null}

      {selectedVillage && villagePumpOperatorDetails ? (
        <VillageDashboardScreen
          data={data}
          villagePhotoEvidenceRows={villagePhotoEvidenceRows}
          waterSupplyOutagesData={waterSupplyOutagesData}
          villagePumpOperatorDetails={villagePumpOperatorDetails}
          villagePumpOperators={villagePumpOperators}
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
            <Text textStyle="bodyText3" fontWeight="400" mb="44px">
              {t('outageAndSubmissionCharts.titles.supplyOutageReasons', {
                defaultValue: 'Supply Outage Reasons',
              })}
            </Text>
            <IssueTypeBreakdownChart data={waterSupplyOutagesData} height="336px" />
          </Box>
          <Box bg="white" borderWidth="1px" borderRadius="lg" px={4} py={6} h="510px" minW={0}>
            {isStateScreen ? (
              <>
                <Text textStyle="bodyText3" fontWeight="400" mb="16px">
                  {t('outageAndSubmissionCharts.titles.supplyOutageDistribution', {
                    defaultValue: 'Supply Outage Distribution',
                  })}
                </Text>
                <WaterSupplyOutagesChart
                  data={waterSupplyOutagesData}
                  height="400px"
                  xAxisLabel={geographyEntityLabel}
                />
              </>
            ) : (
              <>
                <Text textStyle="bodyText3" fontWeight="400" mb="16px">
                  {t('outageAndSubmissionCharts.titles.readingSubmissionRate', {
                    defaultValue: 'Reading Submission Rate',
                  })}
                </Text>
                <SupplySubmissionRateChart
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
