import { describe, expect, it } from '@jest/globals'
import i18n from '@/app/i18n'
import { buildCentralDashboardKpiMetrics } from './use-central-dashboard-kpi-metrics'

describe('buildCentralDashboardKpiMetrics', () => {
  it('uses singular day labels for a one-day comparison', () => {
    const metrics = buildCentralDashboardKpiMetrics({
      comparisonDays: 1,
      criticalSchemeStatusAfterDays: 3,
      currentRegularityKpi: 10,
      currentWaterSupplyKpis: {
        quantityMld: 10,
        quantityLpcd: 10,
      },
      isCentralLandingView: false,
      numberLocale: 'en-IN',
      previousContinuousSchemesCount: 10,
      previousRegularityKpi: 10,
      previousWaterSupplyKpis: {
        quantityMld: 10,
        quantityLpcd: 10,
      },
      t: i18n.getFixedT('en', 'dashboard'),
      continuousSchemesCount: 10,
      criticalSchemesCount: 0,
    })

    const trendTexts = metrics.flatMap((metric) => ('trend' in metric ? [metric.trend.text] : []))

    trendTexts.forEach((trendText) => {
      expect(trendText).toContain('previous 1 day')
      expect(trendText).not.toContain('previous 1 days')
    })
  })

  it('localizes KPI comparison trends in Hindi', () => {
    const metrics = buildCentralDashboardKpiMetrics({
      comparisonDays: 129,
      criticalSchemeStatusAfterDays: 3,
      currentRegularityKpi: 10.6,
      currentWaterSupplyKpis: {
        quantityMld: 196.5,
        quantityLpcd: 4.1,
      },
      isCentralLandingView: false,
      numberLocale: 'hi-IN',
      previousContinuousSchemesCount: 0,
      previousRegularityKpi: 3,
      previousWaterSupplyKpis: {
        quantityMld: 47.8,
        quantityLpcd: 1,
      },
      t: i18n.getFixedT('hi', 'dashboard'),
      continuousSchemesCount: 0,
      criticalSchemesCount: 17_394,
    })

    const trendTexts = metrics.flatMap((metric) => ('trend' in metric ? [metric.trend.text] : []))

    expect(trendTexts[0]).toBe('पिछले 129 दिनों की तुलना में 0%')
    expect(trendTexts[1]).toContain('पिछले 129 दिनों की तुलना में')
    expect(trendTexts[2]).toContain('एलपीसीडी')
    expect(trendTexts[3]).toContain('पिछले 129 दिनों की तुलना में')

    trendTexts.forEach((trendText) => {
      expect(trendText).not.toContain('vs previous')
      expect(trendText).not.toContain('days')
    })
  })
})
