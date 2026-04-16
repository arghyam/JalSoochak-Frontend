import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { Header } from './header'

jest.mock('@/shared/components/common', () => ({
  LanguageSwitcher: () => <div>Language Switcher</div>,
}))

describe('Header', () => {
  it('renders title, subtitle and language switcher', () => {
    renderWithProviders(<Header />)
    expect(screen.getByRole('img', { name: /jalsoochak logo with text/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /jalsoochak logo with text/i })).toHaveAttribute(
      'href',
      '/'
    )
    expect(screen.getByText('National Rural Drinking Water Supply Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Language Switcher')).toBeInTheDocument()
  })
})
