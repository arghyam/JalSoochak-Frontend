import { screen } from '@testing-library/react'
import { describe, expect, it, jest } from '@jest/globals'
import { renderWithProviders } from '@/test/render-with-providers'
import { DashboardKpiGrid } from './dashboard-kpi-grid'

jest.mock('../kpi-card', () => ({
  KPICard: ({ title, value, icon }: { title: string; value: string; icon?: React.ReactNode }) => (
    <div>
      <span>{title}</span>
      <span>{value}</span>
      {icon ? <span data-testid={`${title}-icon`}>{icon}</span> : null}
    </div>
  ),
}))

describe('DashboardKpiGrid', () => {
  it('renders every metric card with values', () => {
    renderWithProviders(
      <DashboardKpiGrid
        showIcons
        metrics={[
          { label: 'Quantity in MLD', value: '12.4', icon: <span>tap</span> },
          { label: 'Regularity', value: '92.1%', icon: <span>clock</span> },
        ]}
      />
    )

    expect(screen.getByText('Quantity in MLD')).toBeTruthy()
    expect(screen.getByText('12.4')).toBeTruthy()
    expect(screen.getByText('Regularity')).toBeTruthy()
    expect(screen.getByText('92.1%')).toBeTruthy()
  })

  it('hides card icons when disabled by the dashboard view', () => {
    renderWithProviders(
      <DashboardKpiGrid
        showIcons={false}
        metrics={[{ label: 'Quantity in LPCD', value: '55.0', icon: <span>drop</span> }]}
      />
    )

    expect(screen.queryByTestId('Quantity in LPCD-icon')).toBeNull()
  })
})
