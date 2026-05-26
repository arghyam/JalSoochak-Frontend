import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { Header } from './header'

jest.mock('@/shared/components/common', () => ({
  LanguageSwitcher: () => <div>Language Switcher</div>,
}))

describe('Header', () => {
  it('renders department branding and language switcher', () => {
    renderWithProviders(<Header />)

    expect(screen.getByRole('img', { name: /government of assam seal/i })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /jal jeevan mission logo/i })).toBeInTheDocument()
    expect(screen.getByText('Government of Assam')).toBeInTheDocument()
    expect(screen.getByText('Public Health Engineering Department')).toBeInTheDocument()
    expect(screen.getByText(/Jal Jeevan Mission/i)).toBeInTheDocument()
    expect(screen.getByText('Language Switcher')).toBeInTheDocument()
  })
})
