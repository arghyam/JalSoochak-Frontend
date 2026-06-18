import type { TFunction } from 'i18next'
import { buildDashboardGlossary, renderFormulaTooltip } from './dashboard-glossary'

const mockT = ((key: string, opts?: { defaultValue?: string }) =>
  opts?.defaultValue ?? key) as TFunction<'dashboard'>

describe('buildDashboardGlossary', () => {
  it('returns a ReactNode for every glossary key', () => {
    const glossary = buildDashboardGlossary(mockT)

    const keys = [
      'regularityPerformance',
      'quantityPerformance',
      'readingSubmissionRate',
      'readingSubmissionStatus',
      'supplyOutageReasons',
      'supplyOutageDistribution',
      'activeSchemes',
      'schemePerformance',
      'readingCompliance',
      'pumpOperatorDetails',
      'pumpOperatorReportingRate',
      'pumpOperatorLastSubmission',
      'pumpOperatorMissingSubmissions',
    ] as const

    keys.forEach((key) => {
      expect(glossary[key]).not.toBeNull()
      expect(glossary[key]).not.toBeUndefined()
    })
  })

  it('returns 13 entries', () => {
    const glossary = buildDashboardGlossary(mockT)
    expect(Object.keys(glossary)).toHaveLength(13)
  })
})

describe('renderFormulaTooltip', () => {
  it('returns a non-null ReactNode', () => {
    const result = renderFormulaTooltip('Regularity = X / N × 100', [
      'X = supply days',
      'N = total days',
    ])
    expect(result).not.toBeNull()
  })

  it('works with an empty definitions list', () => {
    const result = renderFormulaTooltip('Simple formula', [])
    expect(result).not.toBeNull()
  })
})
