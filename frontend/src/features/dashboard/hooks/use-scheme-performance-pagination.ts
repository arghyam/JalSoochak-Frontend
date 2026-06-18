import { useState } from 'react'

type UseSchemePerformancePaginationParams = {
  analyticsParentId: number
  endDate: string
  startDate: string
}

type SchemeSort = { by: string; dir: 'asc' | 'desc' }

const DEFAULT_SCHEME_SORT: SchemeSort = { by: 'reportingRate', dir: 'desc' }

export function useSchemePerformancePagination({
  analyticsParentId,
  endDate,
  startDate,
}: UseSchemePerformancePaginationParams) {
  const [schemePerformancePagination, setSchemePerformancePagination] = useState<{
    key: string
    page: number
  }>({
    key: '',
    page: 1,
  })
  const [schemeSort, setSchemeSort] = useState<SchemeSort>(DEFAULT_SCHEME_SORT)

  const schemePerformanceResetKey = `${analyticsParentId}|${startDate}|${endDate}`
  const schemePerformancePage =
    schemePerformancePagination.key === schemePerformanceResetKey
      ? schemePerformancePagination.page
      : 1

  const handleSchemePageChange = (page: number) => {
    setSchemePerformancePagination({
      key: schemePerformanceResetKey,
      page,
    })
  }

  const handleSchemeSortChange = (sortBy: string, sortDir: 'asc' | 'desc') => {
    setSchemeSort({ by: sortBy, dir: sortDir })
    setSchemePerformancePagination({ key: schemePerformanceResetKey, page: 1 })
  }

  return {
    handleSchemePageChange,
    handleSchemeSortChange,
    schemePerformancePage,
    schemeSort,
  }
}
