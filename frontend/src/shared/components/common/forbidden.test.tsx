import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { ForbiddenPage } from './forbidden'

describe('ForbiddenPage', () => {
  it('renders 403 heading and explanation', () => {
    renderWithProviders(<ForbiddenPage />)
    expect(screen.getByRole('heading', { name: /403/i })).toBeInTheDocument()
    expect(screen.getByText(/permission/i)).toBeInTheDocument()
  })
})
