import type { ComponentProps } from 'react'
import { Box } from '@chakra-ui/react'
import { DashboardBody } from '../screens/dashboard-body'
import { DashboardFilters } from '../filters/dashboard-filters'
import { DashboardKpiGrid } from './dashboard-kpi-grid'
import { DashboardMapPerformanceSection } from './dashboard-map-performance-section'

type CentralDashboardContentProps = {
  bodyProps: ComponentProps<typeof DashboardBody>
  filterProps: ComponentProps<typeof DashboardFilters>
  kpiGridProps: ComponentProps<typeof DashboardKpiGrid>
  mapPerformanceProps: ComponentProps<typeof DashboardMapPerformanceSection>
}

export function CentralDashboardContent({
  bodyProps,
  filterProps,
  kpiGridProps,
  mapPerformanceProps,
}: CentralDashboardContentProps) {
  return (
    <Box>
      <DashboardFilters {...filterProps} />
      <DashboardKpiGrid {...kpiGridProps} />
      <DashboardMapPerformanceSection {...mapPerformanceProps} />
      <DashboardBody {...bodyProps} />
    </Box>
  )
}
