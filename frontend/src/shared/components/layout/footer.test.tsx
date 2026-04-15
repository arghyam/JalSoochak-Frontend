import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { Footer } from './footer'

describe('Footer', () => {
  it('renders footer sections, login links, and website link', () => {
    renderWithProviders(<Footer />)

    expect(screen.getByText('Quick Links')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sub-divisional officer login/i })).toHaveAttribute(
      'href',
      '/staff/login'
    )
    expect(screen.getByRole('link', { name: /section officer login/i })).toHaveAttribute(
      'href',
      '/staff/login'
    )
    expect(screen.getByRole('link', { name: /jalsoochak website/i })).toHaveAttribute(
      'href',
      'https://jalsoochak.in/'
    )
  })
})
