import { Grid } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { KPICard } from '../kpi-card'

type DashboardKpiMetric = {
  label: string
  value: string
  icon?: ReactNode
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    text: string
  }
  tooltipContent?: ReactNode
}

interface DashboardKpiGridProps {
  metrics: readonly DashboardKpiMetric[]
  showIcons: boolean
}

export function DashboardKpiGrid({ metrics, showIcons }: DashboardKpiGridProps) {
  return (
    <Grid
      templateColumns={{
        base: '1fr',
        sm: 'repeat(2, minmax(0, 1fr))',
        lg: `repeat(${metrics.length}, minmax(0, 1fr))`,
      }}
      gap={4}
      mb={6}
    >
      {metrics.map((metric) => (
        <KPICard
          key={metric.label}
          title={metric.label}
          value={metric.value}
          icon={showIcons ? metric.icon : undefined}
          trend={metric.trend}
          tooltipContent={metric.tooltipContent}
        />
      ))}
    </Grid>
  )
}
