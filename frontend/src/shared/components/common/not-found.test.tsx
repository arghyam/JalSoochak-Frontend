import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { ROUTES } from '@/shared/constants/routes'
import { NotFoundPage } from './not-found'

describe('NotFoundPage', () => {
  it('renders 404 heading and navigation links', () => {
    renderWithProviders(<NotFoundPage />)
    expect(screen.getByRole('heading', { name: /404/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute(
      'href',
      ROUTES.DASHBOARD
    )
    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', ROUTES.LOGIN)
  })
})
