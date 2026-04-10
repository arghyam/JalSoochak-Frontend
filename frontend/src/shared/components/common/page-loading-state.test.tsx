import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { PageLoadingState } from './page-loading-state'

describe('PageLoadingState', () => {
  it('renders busy status with message', () => {
    renderWithProviders(<PageLoadingState message="Loading dashboard…" />)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Loading dashboard…')).toBeInTheDocument()
  })
})
