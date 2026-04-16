import * as dashboardComponents from './index'
import { CentralDashboard } from './central-dashboard'
import { KPICard } from './kpi-card/kpi-card'

describe('dashboard components index exports', () => {
  it('re-exports core component symbols', () => {
    expect(dashboardComponents.CentralDashboard).toBe(CentralDashboard)
    expect(dashboardComponents.KPICard).toBe(KPICard)
  })
})
