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

  it('renders neutral trend text without arrow icon', () => {
    render(
      <KPICard title="Quality" value="70%" trend={{ direction: 'neutral', text: 'No change' }} />
    )

    expect(screen.getByText('No change')).toBeInTheDocument()
  })
})
