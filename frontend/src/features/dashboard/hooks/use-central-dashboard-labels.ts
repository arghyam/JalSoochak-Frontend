import type { TFunction, i18n as I18n } from 'i18next'
import type { TenantLocationHierarchyResponse } from '../services/api/dashboard-api'
import { toCapitalizedWords } from '../utils/format-location-label'
import { localizeDepartmentHierarchyLabel, normalizeHierarchyLabel } from '../utils/hierarchy-label'

type UseCentralDashboardLabelsParams = {
  i18n: I18n
  isDepartmentCircleSelected: boolean
  isDepartmentDivisionSelected: boolean
  isDepartmentStateSelected: boolean
  isDepartmentTabActive: boolean
  isDepartmentZoneSelected: boolean
  isHierarchyFourthLevelSelected: boolean
  isHierarchySecondLevelSelected: boolean
  isHierarchyStateSelected: boolean
  isHierarchyThirdLevelSelected: boolean
  locationHierarchyData?: TenantLocationHierarchyResponse
  t: TFunction<'dashboard'>
}

const toPluralHierarchyLabel = (value: string, i18n: I18n, t: TFunction<'dashboard'>): string => {
  const localized = localizeDepartmentHierarchyLabel(value, 'plural', i18n, t)
  if (localized !== value) {
    return localized
  }
  const normalized = normalizeHierarchyLabel(value)
  if (normalized === 'state') return 'States'
  if (normalized === 'district') return 'Districts'
  if (normalized === 'block') return 'Blocks'
  if (normalized === 'panchayat') return 'Panchayats'
  if (normalized === 'village') return 'Villages'
  if (normalized === 'sub division' || normalized === 'subdivision') return 'Sub Divisions'
  if (value.endsWith('s')) return value
  return `${value}s`
}

export function useCentralDashboardLabels({
  i18n,
  isDepartmentCircleSelected,
  isDepartmentDivisionSelected,
  isDepartmentStateSelected,
  isDepartmentTabActive,
  isDepartmentZoneSelected,
  isHierarchyFourthLevelSelected,
  isHierarchySecondLevelSelected,
  isHierarchyStateSelected,
  isHierarchyThirdLevelSelected,
  locationHierarchyData,
  t,
}: UseCentralDashboardLabelsParams) {
  const hierarchyLabelByLevel = (locationHierarchyData?.data?.levels ?? []).reduce<
    Record<number, string>
  >((acc, item) => {
    const levelNumber = typeof item.level === 'number' ? item.level : undefined
    const levelTitleRaw = toCapitalizedWords(item.levelName?.[0]?.title?.trim() ?? '')
    if (!levelNumber || !levelTitleRaw) {
      return acc
    }
    acc[levelNumber] = localizeDepartmentHierarchyLabel(levelTitleRaw, 'singular', i18n, t)
    return acc
  }, {})
  const departmentOverallPerformanceEntityLabel = isDepartmentDivisionSelected
    ? (hierarchyLabelByLevel[5] ?? 'Sub Division')
    : isDepartmentCircleSelected
      ? (hierarchyLabelByLevel[4] ?? 'Division')
      : isDepartmentZoneSelected
        ? (hierarchyLabelByLevel[3] ?? 'Circle')
        : isDepartmentStateSelected
          ? (hierarchyLabelByLevel[2] ?? 'Zone')
          : t('overallPerformance.entities.stateUt', { defaultValue: 'State/UT' })
  const departmentPerformanceEntityLabel = isDepartmentDivisionSelected
    ? toPluralHierarchyLabel(hierarchyLabelByLevel[5] ?? 'Sub Division', i18n, t)
    : isDepartmentCircleSelected
      ? toPluralHierarchyLabel(hierarchyLabelByLevel[4] ?? 'Division', i18n, t)
      : isDepartmentZoneSelected
        ? toPluralHierarchyLabel(hierarchyLabelByLevel[3] ?? 'Circle', i18n, t)
        : isDepartmentStateSelected
          ? toPluralHierarchyLabel(hierarchyLabelByLevel[2] ?? 'Zone', i18n, t)
          : t('performanceCharts.viewBy.statesUTs', { defaultValue: 'States/UTs' })
  const supplySubmissionRateLabel = isDepartmentTabActive
    ? departmentPerformanceEntityLabel
    : isHierarchyFourthLevelSelected
      ? t('performanceCharts.viewBy.villages', { defaultValue: 'Villages' })
      : isHierarchyThirdLevelSelected
        ? t('performanceCharts.viewBy.gramPanchayats', { defaultValue: 'Gram Panchayats' })
        : isHierarchySecondLevelSelected
          ? t('performanceCharts.viewBy.blocks', { defaultValue: 'Blocks' })
          : isHierarchyStateSelected
            ? t('performanceCharts.viewBy.districts', { defaultValue: 'Districts' })
            : t('performanceCharts.viewBy.statesUTs', { defaultValue: 'States/UTs' })
  const overallPerformanceEntityLabel = isDepartmentTabActive
    ? departmentOverallPerformanceEntityLabel
    : isHierarchyFourthLevelSelected
      ? t('overallPerformance.entities.village', { defaultValue: 'Village' })
      : isHierarchyThirdLevelSelected
        ? t('overallPerformance.entities.gramPanchayat', { defaultValue: 'Gram Panchayat' })
        : isHierarchySecondLevelSelected
          ? t('overallPerformance.entities.block', { defaultValue: 'Block' })
          : isHierarchyStateSelected
            ? t('overallPerformance.entities.district', { defaultValue: 'District' })
            : t('overallPerformance.entities.stateUt', { defaultValue: 'State/UT' })

  return {
    overallPerformanceEntityLabel,
    supplySubmissionRateLabel,
  }
}
