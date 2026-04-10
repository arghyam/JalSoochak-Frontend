import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { LoadingSpinner } from './loading-spinner'

describe('LoadingSpinner', () => {
  it('renders spinner with visible loading text', () => {
    renderWithProviders(<LoadingSpinner />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})
