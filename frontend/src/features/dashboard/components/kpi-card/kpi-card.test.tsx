import { render, screen } from '@testing-library/react'
import { KPICard } from './kpi-card'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { resolvedLanguage: 'en' },
  }),
}))

describe('KPICard', () => {
  it('renders formatted numeric value and up trend', () => {
    render(
      <KPICard
        title="Coverage"
        value={123456}
        trend={{ direction: 'up', text: '+3.4% vs last month' }}
      />
    )

    expect(screen.getByText('Coverage')).toBeInTheDocument()
    expect(screen.getByText('1,23,456')).toBeInTheDocument()
    expect(screen.getByText('+3.4% vs last month')).toBeInTheDocument()
  })

  it('renders tooltip trigger when tooltip content exists', () => {
    render(<KPICard title="Regularity" value="91%" tooltipContent="More detail" />)

    expect(screen.getByRole('button', { name: 'More info' })).toBeInTheDocument()
  })

  it('renders neutral trend text', () => {
    render(
      <KPICard title="Quality" value="70%" trend={{ direction: 'neutral', text: 'No change' }} />
    )

    expect(screen.getByText('No change')).toBeInTheDocument()
  })

  it('centres content when the card has no leading icon', () => {
    render(<KPICard title="Critical Schemes" value={12} tooltipContent="More detail" />)

    const content = screen.getByText('Critical Schemes').parentElement
    expect(content).toHaveStyle({ 'align-items': 'center', 'text-align': 'center' })
  })

  it('keeps content left aligned when a leading icon is present', () => {
    render(
      <KPICard
        title="Quantity in MLD"
        value={12}
        icon={<span data-testid="kpi-icon" />}
        tooltipContent="More detail"
      />
    )

    expect(screen.getByTestId('kpi-icon')).toBeInTheDocument()
    const content = screen.getByText('Quantity in MLD').parentElement
    expect(content).toHaveStyle({ 'align-items': 'flex-start', 'text-align': 'left' })
  })
})
