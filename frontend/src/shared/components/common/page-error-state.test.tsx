import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { PageErrorState } from './page-error-state'

describe('PageErrorState', () => {
  it('renders alert with message', () => {
    renderWithProviders(<PageErrorState message="Could not load" />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Could not load')
  })
})
