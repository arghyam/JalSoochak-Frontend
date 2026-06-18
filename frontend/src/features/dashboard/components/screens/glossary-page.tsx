import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { DashboardLayout } from '@/shared/components/layout'

function CategoryBadge({ label }: { label: string }) {
  return (
    <Box
      display="inline-block"
      px="8px"
      py="2px"
      borderRadius="4px"
      bg="primary.50"
      color="primary.600"
      fontSize="11px"
      fontWeight="600"
      letterSpacing="0.3px"
      textTransform="uppercase"
    >
      {label}
    </Box>
  )
}

function FormulaBlock({ children }: { children: React.ReactNode }) {
  return (
    <Box
      mt="12px"
      p="10px 12px"
      bg="neutral.50"
      borderRadius="6px"
      borderWidth="1px"
      borderColor="neutral.200"
      fontFamily="mono"
      fontSize="13px"
      color="neutral.700"
    >
      {children}
    </Box>
  )
}

function DefinitionList({ items }: { items: React.ReactNode[] }) {
  return (
    <Box mt="8px">
      {items.map((item, index) => (
        <Text key={index} fontSize="13px" color="neutral.600" lineHeight="1.5" mt="4px">
          {item}
        </Text>
      ))}
    </Box>
  )
}

function GlossaryCard({
  title,
  category,
  description,
  formula,
  variables,
  extras,
}: {
  title: string
  category: string
  description: string
  formula?: React.ReactNode
  variables?: React.ReactNode[]
  extras?: React.ReactNode[]
}) {
  return (
    <Box
      bg="white"
      borderWidth="0.5px"
      borderColor="#E4E4E7"
      borderRadius="12px"
      p="20px"
      display="flex"
      flexDirection="column"
      gap="10px"
    >
      <Flex align="flex-start" justify="space-between" gap="8px">
        <Text fontSize="15px" fontWeight="600" color="neutral.800" lineHeight="1.4">
          {title}
        </Text>
        <CategoryBadge label={category} />
      </Flex>
      <Text fontSize="13px" color="neutral.600" lineHeight="1.6">
        {description}
      </Text>
      {formula ? <FormulaBlock>{formula}</FormulaBlock> : null}
      {variables && variables.length > 0 ? <DefinitionList items={variables} /> : null}
      {extras && extras.length > 0 ? <DefinitionList items={extras} /> : null}
    </Box>
  )
}

export function GlossaryPage() {
  const { t } = useTranslation('dashboard')

  const categoryMetric = t('glossaryPage.categoryMetric', { defaultValue: 'Metric' })
  const categoryChart = t('glossaryPage.categoryChart', { defaultValue: 'Chart' })
  const categoryStatus = t('glossaryPage.categoryStatus', { defaultValue: 'Status' })
  const categoryTable = t('glossaryPage.categoryTable', { defaultValue: 'Table' })

  return (
    <DashboardLayout>
      <Box pt="40px" pb="60px">
        <Box mb="32px">
          <Text fontSize="2xl" fontWeight="700" color="neutral.800" mb="8px">
            {t('glossaryPage.title', { defaultValue: 'Dashboard Glossary' })}
          </Text>
          <Text fontSize="sm" color="neutral.500" maxW="600px">
            {t('glossaryPage.subtitle', {
              defaultValue:
                'Definitions and formulas for all metrics, charts, and status indicators used across the dashboards.',
            })}
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={5}>
          <GlossaryCard
            title={t('performanceCharts.regularity.title', {
              defaultValue: 'Regularity Performance',
            })}
            category={categoryMetric}
            description={t('glossary.regularityPerformance.description', {
              defaultValue:
                'Percentage of days within the selected period that schemes supplied water consistently.',
            })}
            formula={
              <>
                {t('glossary.regularityPerformance.formulaLabel', {
                  defaultValue: 'Regularity of scheme',
                })}{' '}
                = X<sub>i</sub> / N × 100
              </>
            }
            variables={[
              <>
                X<sub>i</sub> ={' '}
                {t('glossary.regularityPerformance.definitions.xi', {
                  defaultValue: 'number of continuous supply-days of scheme i',
                })}
              </>,
              <>
                N ={' '}
                {t('glossary.regularityPerformance.definitions.n', {
                  defaultValue: 'total number of days in the selected period',
                })}
              </>,
            ]}
          />

          <GlossaryCard
            title={t('performanceCharts.quantity.title', { defaultValue: 'Quantity Performance' })}
            category={categoryMetric}
            description={t('glossary.quantityPerformance.description', {
              defaultValue:
                'Average volume of water supplied per person per day, measured in Litres per Capita per Day (LPCD), across functional household tap connections.',
            })}
            formula={
              <>
                {t('glossary.quantityPerformance.formulaLabel', {
                  defaultValue: 'Quantity (LPCD)',
                })}{' '}
                = SUM(W<sub>k</sub>) / (SUM(FHTC<sub>i</sub>) × P × N)
              </>
            }
            variables={[
              <>
                W<sub>k</sub> ={' '}
                {t('glossary.quantityPerformance.definitions.wk', {
                  defaultValue: 'water quantity supplied on day k (in litres)',
                })}
              </>,
              <>
                FHTC<sub>i</sub> ={' '}
                {t('glossary.quantityPerformance.definitions.fhtci', {
                  defaultValue: 'functional household tap connections of scheme i',
                })}
              </>,
              <>
                P ={' '}
                {t('glossary.quantityPerformance.definitions.p', {
                  defaultValue: 'average persons per household',
                })}
              </>,
              <>
                N ={' '}
                {t('glossary.quantityPerformance.definitions.n', {
                  defaultValue: 'total number of days in the selected period',
                })}
              </>,
            ]}
          />

          <GlossaryCard
            title={t('outageAndSubmissionCharts.titles.readingSubmissionRate', {
              defaultValue: 'Reading Submission Rate',
            })}
            category={categoryMetric}
            description={t('glossary.readingSubmissionRate.description', {
              defaultValue:
                'Percentage of days that pump operators submitted water flow meter readings for their schemes in the selected period.',
            })}
            formula={
              <>
                {t('glossary.readingSubmissionRate.formulaLabel', {
                  defaultValue: 'Reading Submission Rate of scheme',
                })}{' '}
                = S<sub>i</sub> / N × 100
              </>
            }
            variables={[
              <>
                S<sub>i</sub> ={' '}
                {t('glossary.readingSubmissionRate.definitions.si', {
                  defaultValue: 'number of days pump operator submitted a reading for scheme i',
                })}
              </>,
              <>
                N ={' '}
                {t('glossary.readingSubmissionRate.definitions.n', {
                  defaultValue: 'total number of days in the selected period',
                })}
              </>,
            ]}
          />

          <GlossaryCard
            title={t('outageAndSubmissionCharts.titles.readingSubmissionStatus', {
              defaultValue: 'Reading Submission Status',
            })}
            category={categoryStatus}
            description={t('glossary.readingSubmissionStatus.description', {
              defaultValue:
                'Breakdown of submitted readings by compliance status across all schemes in the selected period.',
            })}
            extras={[
              <>
                <Text as="span" fontWeight="600">
                  {t('glossary.readingSubmissionStatus.compliantLabel', {
                    defaultValue: 'Compliant Submissions',
                  })}
                  :{' '}
                </Text>
                {t('glossary.readingSubmissionStatus.compliantDescription', {
                  defaultValue:
                    'Readings submitted within acceptable thresholds that meet data quality criteria.',
                })}
              </>,
              <>
                <Text as="span" fontWeight="600">
                  {t('glossary.readingSubmissionStatus.anomalousLabel', {
                    defaultValue: 'Anomalous Submissions',
                  })}
                  :{' '}
                </Text>
                {t('glossary.readingSubmissionStatus.anomalousDescription', {
                  defaultValue:
                    'Readings flagged as potentially inaccurate based on automated quality checks.',
                })}
              </>,
            ]}
          />

          <GlossaryCard
            title={t('outageAndSubmissionCharts.titles.supplyOutageReasons', {
              defaultValue: 'Supply Outage Reasons',
            })}
            category={categoryChart}
            description={t('glossary.supplyOutageReasons.description', {
              defaultValue:
                'Distribution of reported supply interruption events by root cause. Counts are based on unique schemes — a scheme may appear in multiple regions, so regional totals may exceed the overall figure.',
            })}
          />

          <GlossaryCard
            title={t('outageAndSubmissionCharts.titles.supplyOutageDistribution', {
              defaultValue: 'Supply Outage Distribution',
            })}
            category={categoryChart}
            description={t('glossary.supplyOutageDistribution.description', {
              defaultValue:
                'Geographic spread of supply outage events across child regions within the selected area and period.',
            })}
          />

          <GlossaryCard
            title={t('pumpOperators.title', { defaultValue: 'Active Schemes' })}
            category={categoryStatus}
            description={t('glossary.activeSchemes.description', {
              defaultValue:
                'Count of schemes by operational status based on water supply reporting in the selected period.',
            })}
            extras={[
              <>
                <Text as="span" fontWeight="600">
                  {t('glossary.activeSchemes.activeLabel', { defaultValue: 'Active Schemes' })}
                  :{' '}
                </Text>
                {t('glossary.activeSchemes.activeDescription', {
                  defaultValue:
                    'Schemes that reported at least one water supply reading in the selected period.',
                })}
              </>,
              <>
                <Text as="span" fontWeight="600">
                  {t('glossary.activeSchemes.nonActiveLabel', {
                    defaultValue: 'Non-active Schemes',
                  })}
                  :{' '}
                </Text>
                {t('glossary.activeSchemes.nonActiveDescription', {
                  defaultValue:
                    'Schemes that did not report any water supply readings in the selected period.',
                })}
              </>,
            ]}
          />

          <GlossaryCard
            title={t('pumpOperators.performanceTable.title', {
              defaultValue: 'Scheme Performance',
            })}
            category={categoryTable}
            description={t('glossary.schemePerformance.description', {
              defaultValue:
                'Ranked list of schemes within the selected region, showing reporting compliance and total water supplied.',
            })}
            extras={[
              t('glossary.schemePerformance.definitions.reportingRate', {
                defaultValue:
                  'Reporting Rate: % of days the pump operator submitted a reading (submission days ÷ total days × 100).',
              }),
              t('glossary.schemePerformance.definitions.waterSupplied', {
                defaultValue:
                  'Water Supplied: total volume supplied by the scheme in the selected period (in litres).',
              }),
            ]}
          />

          <GlossaryCard
            title={t('outageAndSubmissionCharts.titles.readingCompliance', {
              defaultValue: 'Reading Compliance',
            })}
            category={categoryTable}
            description={t('glossary.readingCompliance.description', {
              defaultValue:
                'Daily log of water supply meter readings submitted for the selected scheme. Shows the submission date and reported meter reading value.',
            })}
          />

          <GlossaryCard
            title={t('pumpOperators.details.title', { defaultValue: 'Pump Operator Details' })}
            category={t('glossaryPage.categoryPanel', { defaultValue: 'Panel' })}
            description={t('glossary.pumpOperatorDetails.description', {
              defaultValue:
                "Summary of a pump operator's activity for the selected scheme within the chosen period — including their reporting frequency and when they last submitted a reading.",
            })}
            extras={[
              <>
                <Text as="span" fontWeight="600">
                  {t('pumpOperators.details.fields.reportingRate', {
                    defaultValue: 'Reporting rate',
                  })}
                  :{' '}
                </Text>
                {t('glossary.pumpOperatorReportingRate.description', {
                  defaultValue:
                    'Percentage of days in the selected period for which this pump operator submitted a reading for this scheme. Computed as: submission days ÷ total days × 100.',
                })}
              </>,
              <>
                <Text as="span" fontWeight="600">
                  {t('pumpOperators.details.fields.missingSubmissionCount', {
                    defaultValue: 'Missing submission count',
                  })}
                  :{' '}
                </Text>
                {t('glossary.pumpOperatorMissingSubmissions.description', {
                  defaultValue:
                    'Number of days in the selected period for which this pump operator did not submit any reading for this scheme.',
                })}
              </>,
              <>
                <Text as="span" fontWeight="600">
                  {t('pumpOperators.details.fields.lastSubmission', {
                    defaultValue: 'Last submission',
                  })}
                  :{' '}
                </Text>
                {t('glossary.pumpOperatorLastSubmission.description', {
                  defaultValue:
                    'Date and time of the most recent meter reading submitted by this pump operator for this scheme.',
                })}
              </>,
            ]}
          />
        </SimpleGrid>
      </Box>
    </DashboardLayout>
  )
}
