import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { StatCard } from './stat-card'
import { FiUpload } from 'react-icons/fi'

describe('StatCard', () => {
  it('renders title, value and subtitle', () => {
    renderWithProviders(
      <StatCard
        title="Total"
        value={12}
        subtitle="today"
        icon={FiUpload}
        iconBg="primary.50"
        iconColor="primary.500"
      />
    )
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByLabelText('Total: 12')).toBeInTheDocument()
    expect(screen.getByText('today')).toBeInTheDocument()
  })
})
