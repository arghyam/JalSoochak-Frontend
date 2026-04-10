import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { Header } from './header'

jest.mock('@/shared/components/common', () => ({
  LanguageSwitcher: () => <div>Language Switcher</div>,
}))

describe('Header', () => {
  it('renders title, subtitle and language switcher', () => {
    renderWithProviders(<Header />)
    expect(screen.getByText('JalSoochak')).toBeInTheDocument()
    expect(screen.getByText('Operational Status of Water Supply Schemes')).toBeInTheDocument()
    expect(screen.getByText('Language Switcher')).toBeInTheDocument()
  })
})
