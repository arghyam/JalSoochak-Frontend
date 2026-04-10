import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { ChartEmptyState } from './chart-empty-state'

describe('ChartEmptyState', () => {
  it('renders translated default message', () => {
    renderWithProviders(<ChartEmptyState />)
    expect(screen.getByText(/no data/i)).toBeInTheDocument()
  })

  it('renders custom message when provided', () => {
    renderWithProviders(<ChartEmptyState message="Nothing here" />)
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
  })
})
