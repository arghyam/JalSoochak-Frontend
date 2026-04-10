import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { Footer } from './footer'

describe('Footer', () => {
  it('renders footer sections and website link', () => {
    renderWithProviders(<Footer />)
    expect(screen.getByText('Quick Links')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /jalsoochak website/i })).toHaveAttribute(
      'href',
      'https://jalsoochak.in/'
    )
  })
})
