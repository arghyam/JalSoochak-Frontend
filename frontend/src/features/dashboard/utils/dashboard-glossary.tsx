import { Box, Text } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import type { TFunction } from 'i18next'

const tooltipTextStyle = {
  fontSize: '12px',
  lineHeight: '18px',
} as const

export function renderFormulaTooltip(formula: ReactNode, definitions: ReactNode[]): ReactNode {
  return (
    <Box w="296px">
      <Text sx={tooltipTextStyle} mb={definitions.length > 0 ? '8px' : '0'}>
        {formula}
      </Text>
      {definitions.map((definition, index) => (
        <Text key={index} sx={tooltipTextStyle}>
          {definition}
        </Text>
      ))}
    </Box>
  )
}

function renderDescriptionTooltip(description: ReactNode, extra?: ReactNode[]): ReactNode {
  return (
    <Box w="296px">
      <Text sx={tooltipTextStyle} mb={extra && extra.length > 0 ? '8px' : '0'}>
        {description}
      </Text>
      {extra?.map((line, index) => (
        <Text key={index} sx={tooltipTextStyle} mt="4px">
          {line}
        </Text>
      ))}
    </Box>
  )
}

export type DashboardGlossary = {
  regularityPerformance: ReactNode
  quantityPerformance: ReactNode
  readingSubmissionRate: ReactNode
  readingSubmissionStatus: ReactNode
  supplyOutageReasons: ReactNode
  supplyOutageDistribution: ReactNode
  activeSchemes: ReactNode
  schemePerformance: ReactNode
  readingCompliance: ReactNode
  pumpOperatorDetails: ReactNode
  pumpOperatorReportingRate: ReactNode
  pumpOperatorLastSubmission: ReactNode
  pumpOperatorMissingSubmissions: ReactNode
}

export function buildDashboardGlossary(t: TFunction<'dashboard'>): DashboardGlossary {
  return {
    regularityPerformance: renderFormulaTooltip(
      <>
        {t('glossary.regularityPerformance.formulaLabel', {
          defaultValue: 'Regularity',
        })}{' '}
        = R / S × 100
      </>,
      [
        <>
          R ={' '}
          {t('glossary.regularityPerformance.definitions.regularSchemes', {
            defaultValue: 'number of schemes supplying water regularly',
          })}
        </>,
        <>
          S ={' '}
          {t('glossary.regularityPerformance.definitions.totalSchemes', {
            defaultValue: 'total number of schemes',
          })}
        </>,
      ]
    ),

    quantityPerformance: renderFormulaTooltip(
      <>
        {t('glossary.quantityPerformance.formulaLabel', {
          defaultValue: 'Quantity (LPCD: Litres per Capita per Day)',
        })}{' '}
        = SUM(W<sub>k</sub>) / (SUM(FHTC<sub>i</sub>) × P × N)
      </>,
      [
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
      ]
    ),

    readingSubmissionRate: renderFormulaTooltip(
      <>
        {t('glossary.readingSubmissionRate.formulaLabel', {
          defaultValue: 'Reading Submission Rate of scheme',
        })}{' '}
        = S<sub>i</sub> / N × 100
      </>,
      [
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
      ]
    ),

    readingSubmissionStatus: renderDescriptionTooltip(
      t('glossary.readingSubmissionStatus.description', {
        defaultValue:
          'Breakdown of submitted readings by compliance status across all schemes in the selected period.',
      }),
      [
        <>
          <Text as="span" fontWeight="600" sx={tooltipTextStyle}>
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
          <Text as="span" fontWeight="600" sx={tooltipTextStyle}>
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
      ]
    ),

    supplyOutageReasons: renderDescriptionTooltip(
      t('glossary.supplyOutageReasons.description', {
        defaultValue:
          'Distribution of reported supply interruption events by root cause. Counts are based on unique schemes — a scheme may appear in multiple regions, so regional totals may exceed the overall figure.',
      })
    ),

    supplyOutageDistribution: renderDescriptionTooltip(
      t('glossary.supplyOutageDistribution.description', {
        defaultValue:
          'Geographic spread of supply outage events across child regions within the selected area and period.',
      })
    ),

    activeSchemes: renderDescriptionTooltip(
      t('glossary.activeSchemes.description', {
        defaultValue:
          'Count of schemes by operational status based on water supply reporting in the selected period.',
      }),
      [
        <>
          <Text as="span" fontWeight="600" sx={tooltipTextStyle}>
            {t('glossary.activeSchemes.activeLabel', { defaultValue: 'Active Schemes' })}:{' '}
          </Text>
          {t('glossary.activeSchemes.activeDescription', {
            defaultValue:
              'Schemes that reported at least one water supply reading in the selected period.',
          })}
        </>,
        <>
          <Text as="span" fontWeight="600" sx={tooltipTextStyle}>
            {t('glossary.activeSchemes.nonActiveLabel', { defaultValue: 'Non-active Schemes' })}
            :{' '}
          </Text>
          {t('glossary.activeSchemes.nonActiveDescription', {
            defaultValue:
              'Schemes that did not report any water supply readings in the selected period.',
          })}
        </>,
      ]
    ),

    schemePerformance: renderDescriptionTooltip(
      t('glossary.schemePerformance.description', {
        defaultValue:
          'Ranked list of schemes within the selected region, showing reporting compliance and total water supplied.',
      }),
      [
        t('glossary.schemePerformance.definitions.reportingRate', {
          defaultValue:
            'Reporting Rate: % of days the pump operator submitted a reading (submission days ÷ total days × 100).',
        }),
        t('glossary.schemePerformance.definitions.waterSupplied', {
          defaultValue:
            'Water Supplied: total volume supplied by the scheme in the selected period (in litres).',
        }),
      ]
    ),

    readingCompliance: renderDescriptionTooltip(
      t('glossary.readingCompliance.description', {
        defaultValue:
          'Daily log of water supply meter readings submitted for the selected scheme. Shows the submission date and reported meter reading value.',
      })
    ),

    pumpOperatorDetails: renderDescriptionTooltip(
      t('glossary.pumpOperatorDetails.description', {
        defaultValue:
          "Summary of a pump operator's activity for the selected scheme within the chosen period — including their reporting frequency and when they last submitted a reading.",
      }),
      []
    ),

    pumpOperatorReportingRate: renderDescriptionTooltip(
      t('glossary.pumpOperatorReportingRate.description', {
        defaultValue:
          'Percentage of days in the selected period for which this pump operator submitted a reading for this scheme. Computed as: submission days ÷ total days × 100.',
      })
    ),

    pumpOperatorLastSubmission: renderDescriptionTooltip(
      t('glossary.pumpOperatorLastSubmission.description', {
        defaultValue:
          'Date and time of the most recent meter reading submitted by this pump operator for this scheme.',
      })
    ),

    pumpOperatorMissingSubmissions: renderDescriptionTooltip(
      t('glossary.pumpOperatorMissingSubmissions.description', {
        defaultValue:
          'Number of days in the selected period for which this pump operator did not submit any reading for this scheme.',
      })
    ),
  }
}
