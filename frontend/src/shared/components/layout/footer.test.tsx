import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render-with-providers'
import { Footer } from './footer'

jest.mock('@/config/server-config', () => ({
  isSingleTenantMode: jest.fn(),
  // Analytics off by default, matching an unconfigured deployment: the visitor counter
  // renders nothing and no Firestore request is made.
  isAnalyticsEnabled: jest.fn(() => false),
}))

jest.mock('@/shared/lib/analytics', () => ({
  trackEvent: jest.fn(),
}))

import { isAnalyticsEnabled, isSingleTenantMode } from '@/config/server-config'
import { trackEvent } from '@/shared/lib/analytics'

const mockIsSingleTenantMode = isSingleTenantMode as jest.Mock
const mockIsAnalyticsEnabled = isAnalyticsEnabled as jest.Mock
const mockTrackEvent = trackEvent as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  mockIsAnalyticsEnabled.mockReturnValue(false)
})

describe('Footer — multi-tenant mode (SINGLE_TENANT_MODE = false)', () => {
  beforeEach(() => {
    mockIsSingleTenantMode.mockReturnValue(false)
  })

  it('renders quick links section with correct hrefs', () => {
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
    expect(screen.getByRole('link', { name: /system users login/i })).toHaveAttribute(
      'href',
      '/login'
    )
    expect(screen.getByRole('link', { name: /jalsoochak website/i })).toHaveAttribute(
      'href',
      'https://jalsoochak.in/'
    )
  })

  it('does not render single-tenant quick links', () => {
    renderWithProviders(<Footer />)

    expect(screen.queryByRole('link', { name: /phed assam/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /jjm assam/i })).not.toBeInTheDocument()
  })

  it('renders Arghyam social links', () => {
    renderWithProviders(<Footer />)

    expect(screen.getByRole('link', { name: /x \(twitter\)/i })).toHaveAttribute(
      'href',
      'https://x.com/arghyamindia'
    )
    expect(screen.getByRole('link', { name: /linkedin/i })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/company/arghyam/'
    )
    expect(screen.getByRole('link', { name: /email/i })).toHaveAttribute(
      'href',
      'mailto:info@arghyam.org'
    )
  })

  it('renders Arghyam contact info', () => {
    renderWithProviders(<Footer />)

    expect(screen.getByText('info@arghyam.org')).toBeInTheDocument()
    expect(screen.getByText('+91-80 4169 8941')).toBeInTheDocument()
  })

  it('renders Arghyam credits link', () => {
    renderWithProviders(<Footer />)

    expect(screen.getByRole('link', { name: /arghyam/i })).toHaveAttribute(
      'href',
      'https://arghyam.org/'
    )
  })
})

describe('Footer — single-tenant mode (SINGLE_TENANT_MODE = true)', () => {
  beforeEach(() => {
    mockIsSingleTenantMode.mockReturnValue(true)
  })

  it('renders quick links section with correct hrefs including JJM links', () => {
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
    expect(screen.getByRole('link', { name: /system users login/i })).toHaveAttribute(
      'href',
      '/login'
    )
    expect(screen.getByRole('link', { name: /jalsoochak website/i })).toHaveAttribute(
      'href',
      'https://jalsoochak.in/'
    )
    const phedLinks = screen.getAllByRole('link', { name: /phed assam/i })
    expect(phedLinks.some((l) => l.getAttribute('href') === 'https://jjmassam.in/')).toBe(true)
    expect(screen.getByRole('link', { name: /jjm assam/i })).toHaveAttribute(
      'href',
      'https://jjmbrain.in/'
    )
  })

  it('renders JJM Assam social links', () => {
    renderWithProviders(<Footer />)

    expect(screen.getByRole('link', { name: /x \(twitter\)/i })).toHaveAttribute(
      'href',
      'https://x.com/JJM_Assam'
    )
    expect(screen.getByRole('link', { name: /linkedin/i })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/company/jjmassam/'
    )
    expect(screen.getByRole('link', { name: /email/i })).toHaveAttribute(
      'href',
      'mailto:md@jjmassam.in'
    )
  })

  it('renders JJM contact info', () => {
    renderWithProviders(<Footer />)

    expect(screen.getByText('md@jjmassam.in')).toBeInTheDocument()
    expect(screen.getByText('1800-889-3047')).toBeInTheDocument()
  })

  it('renders credits with PHED Assam and Arghyam links', () => {
    renderWithProviders(<Footer />)

    const phedLinks = screen.getAllByRole('link', { name: /phed assam/i })
    expect(phedLinks.some((l) => l.getAttribute('href') === 'https://jjmassam.in/')).toBe(true)

    expect(screen.getByRole('link', { name: /arghyam/i })).toHaveAttribute(
      'href',
      'https://arghyam.org/'
    )
  })
})

describe('Footer — analytics', () => {
  beforeEach(() => {
    mockIsSingleTenantMode.mockReturnValue(true)
  })

  it('reports a quick link click with its stable key, not the translated label', async () => {
    renderWithProviders(<Footer />)

    await userEvent.click(screen.getByRole('link', { name: /section officer login/i }))

    expect(mockTrackEvent).toHaveBeenCalledWith('quick_link_click', {
      link: 'section-officer-login',
      external: false,
    })
  })

  it('marks an outbound quick link as external', async () => {
    renderWithProviders(<Footer />)

    await userEvent.click(screen.getByRole('link', { name: /jjm assam/i }))

    expect(mockTrackEvent).toHaveBeenCalledWith('quick_link_click', {
      link: 'jjm-assam-website',
      external: true,
    })
  })

  it('reports a social link click with its network and tenancy', async () => {
    renderWithProviders(<Footer />)

    await userEvent.click(screen.getByRole('link', { name: /linkedin/i }))

    expect(mockTrackEvent).toHaveBeenCalledWith('social_link_click', {
      network: 'linkedin',
      tenancy: 'single',
    })
  })

  it('attributes social clicks to the multi-tenant footer when that variant renders', async () => {
    mockIsSingleTenantMode.mockReturnValue(false)
    renderWithProviders(<Footer />)

    await userEvent.click(screen.getByRole('link', { name: /x \(twitter\)/i }))

    expect(mockTrackEvent).toHaveBeenCalledWith('social_link_click', {
      network: 'x',
      tenancy: 'multi',
    })
  })

  it('omits the visitor counter when analytics is not configured', () => {
    renderWithProviders(<Footer />)

    expect(screen.queryByText('Visitors')).not.toBeInTheDocument()
  })
})
