type HierarchyLabelForm = 'singular' | 'plural'

type TranslationFunction = (key: string, options?: { defaultValue?: string }) => string

type TranslationContext = {
  language?: string
  resolvedLanguage?: string
}

export const normalizeHierarchyLabel = (value: string) =>
  value.trim().toLowerCase().replace(/-/g, ' ')

export const localizeDepartmentHierarchyLabel = (
  value: string,
  form: HierarchyLabelForm,
  i18n: TranslationContext,
  t: TranslationFunction
): string => {
  const isHindiUi =
    i18n.resolvedLanguage?.toLowerCase().startsWith('hi') ||
    i18n.language?.toLowerCase().startsWith('hi')

  if (!isHindiUi) {
    return value
  }

  const normalized = normalizeHierarchyLabel(value)

  if (normalized === 'zone') {
    return t(`performanceCharts.viewBy.${form === 'plural' ? 'zones' : 'zone'}`, {
      defaultValue: form === 'plural' ? 'Zones' : 'Zone',
    })
  }
  if (normalized === 'circle') {
    return t(`performanceCharts.viewBy.${form === 'plural' ? 'circles' : 'circle'}`, {
      defaultValue: form === 'plural' ? 'Circles' : 'Circle',
    })
  }
  if (normalized === 'division') {
    return t(`performanceCharts.viewBy.${form === 'plural' ? 'divisions' : 'division'}`, {
      defaultValue: form === 'plural' ? 'Divisions' : 'Division',
    })
  }
  if (normalized === 'sub division' || normalized === 'subdivision') {
    return t(`performanceCharts.viewBy.${form === 'plural' ? 'subDivisions' : 'subDivision'}`, {
      defaultValue: form === 'plural' ? 'Sub Divisions' : 'Sub Division',
    })
  }

  return value
}
