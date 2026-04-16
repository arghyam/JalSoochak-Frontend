import * as dashboardIndex from './index'
import { CentralDashboard } from './components/central-dashboard'

describe('dashboard index exports', () => {
  it('exports CentralDashboard and dashboard module members', () => {
    expect(dashboardIndex.CentralDashboard).toBe(CentralDashboard)
  })
})
