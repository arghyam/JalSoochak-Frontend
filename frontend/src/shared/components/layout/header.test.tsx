import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { isSingleTenantMode } from '@/config/server-config'
import { useTenantInfo } from '@/app/context/tenant-context'
import { Header } from './header'

jest.mock('@/config/server-config')
jest.mock('@/app/context/tenant-context')
jest.mock('@/shared/components/common', () => ({
  LanguageSwitcher: () => <div>Language Switcher</div>,
}))

const mockIsSingleTenantMode = jest.mocked(isSingleTenantMode)
const mockUseTenantInfo = jest.mocked(useTenantInfo)

beforeEach(() => {
  mockUseTenantInfo.mockReturnValue({})
})

describe('Header — single-tenant mode', () => {
  beforeEach(() => {
    mockIsSingleTenantMode.mockReturnValue(true)
  })

  it('renders Assam seal and JJM logo', () => {
    renderWithProviders(<Header />)

    expect(screen.getByRole('img', { name: /government of assam seal/i })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /jal jeevan mission logo/i })).toBeInTheDocument()
  })

  it('renders all three department heading lines', () => {
    renderWithProviders(<Header />)

    expect(screen.getByText('Government of Assam')).toBeInTheDocument()
    expect(screen.getByText('Public Health Engineering Department')).toBeInTheDocument()
    expect(screen.getByText(/Jal Jeevan Mission/i)).toBeInTheDocument()
  })

  it('renders language switcher', () => {
    renderWithProviders(<Header />)

    expect(screen.getByText('Language Switcher')).toBeInTheDocument()
  })

  it('wraps the seal in a dashboard navigation link', () => {
    renderWithProviders(<Header />)

    expect(screen.getByRole('link', { name: /go to dashboard/i })).toBeInTheDocument()
  })

  it('does not render the JalSoochak logo or center subtitle', () => {
    renderWithProviders(<Header />)

    expect(screen.queryByRole('img', { name: /jalsoochak/i })).not.toBeInTheDocument()
    expect(
      screen.queryByText(/national rural drinking water supply dashboard/i)
    ).not.toBeInTheDocument()
  })
})

describe('Header — multi-tenant mode', () => {
  beforeEach(() => {
    mockIsSingleTenantMode.mockReturnValue(false)
  })

  it('renders JalSoochak logo', () => {
    renderWithProviders(<Header />)

    expect(screen.getByRole('img', { name: /jalsoochak/i })).toBeInTheDocument()
  })

  it('renders the default center subtitle', () => {
    renderWithProviders(<Header />)

    expect(screen.getByText(/national rural drinking water supply dashboard/i)).toBeInTheDocument()
  })

  it('renders language switcher', () => {
    renderWithProviders(<Header />)

    expect(screen.getByText('Language Switcher')).toBeInTheDocument()
  })

  it('wraps the JalSoochak logo in a dashboard navigation link', () => {
    renderWithProviders(<Header />)

    expect(screen.getByRole('link', { name: /jalsoochak logo/i })).toBeInTheDocument()
  })

  it('does not render Assam seal, JJM logo, or department headings', () => {
    renderWithProviders(<Header />)

    expect(screen.queryByRole('img', { name: /government of assam seal/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /jal jeevan mission logo/i })).not.toBeInTheDocument()
    expect(screen.queryByText('Government of Assam')).not.toBeInTheDocument()
    expect(screen.queryByText('Public Health Engineering Department')).not.toBeInTheDocument()
  })

  it('renders tenant-specific subtitle when tenantName is provided', () => {
    mockUseTenantInfo.mockReturnValue({ tenantName: 'Assam' })
    renderWithProviders(<Header />)

    expect(screen.getByText(/assam rural drinking water supply dashboard/i)).toBeInTheDocument()
  })
})
