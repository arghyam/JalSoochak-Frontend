import { useState } from 'react'

type UseSchemePerformancePaginationParams = {
  analyticsParentId: number
  endDate: string
  startDate: string
}

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

  return {
    handleSchemePageChange,
    schemePerformancePage,
  }
}
