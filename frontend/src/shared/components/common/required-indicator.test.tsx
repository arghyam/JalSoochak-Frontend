import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { RequiredIndicator } from './required-indicator'

describe('RequiredIndicator', () => {
  it('renders asterisk and visually hidden required text when required is true', () => {
    renderWithProviders(<RequiredIndicator required />)
    expect(screen.getByText('*', { exact: false })).toBeInTheDocument()
    expect(screen.getByText(/^required$/i)).toBeInTheDocument()
  })

  it('renders optional label when required is false', () => {
    renderWithProviders(<RequiredIndicator required={false} />)
    expect(screen.getByText('(Optional)')).toBeInTheDocument()
  })

  it('renders nothing when required is undefined', () => {
    renderWithProviders(<RequiredIndicator />)
    expect(screen.queryByText('*')).not.toBeInTheDocument()
    expect(screen.queryByText('(Optional)')).not.toBeInTheDocument()
    expect(screen.queryByText(/required/i)).not.toBeInTheDocument()
  })
})
