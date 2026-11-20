import { screen, within } from '@testing-library/react'
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

jest.mock('@/shared/lib/branding', () => ({
  ...jest.requireActual<typeof import('@/shared/lib/branding')>('@/shared/lib/branding'),
  getBrandingProfile: jest.fn(),
}))

import i18n from '@/app/i18n'
import { isAnalyticsEnabled, isSingleTenantMode } from '@/config/server-config'
import { trackEvent } from '@/shared/lib/analytics'
import { BRANDING_PROFILES, getBrandingProfile } from '@/shared/lib/branding'

const mockIsSingleTenantMode = isSingleTenantMode as jest.Mock
const mockIsAnalyticsEnabled = isAnalyticsEnabled as jest.Mock
const mockTrackEvent = trackEvent as jest.Mock
const mockGetBrandingProfile = jest.mocked(getBrandingProfile)

// A state's department link can appear in both the quick links and the credits with the same
// label and href, so assertions about either are scoped to their own section.
const quickLinksSection = () => within(screen.getByRole('navigation', { name: 'Quick Links' }))
const singleTenantCredits = () => within(screen.getByText(/developed by/i))

beforeEach(() => {
  jest.clearAllMocks()
  mockIsAnalyticsEnabled.mockReturnValue(false)
  mockGetBrandingProfile.mockReturnValue(BRANDING_PROFILES.assam)
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

  it('does not read the state branding profile', () => {
    renderWithProviders(<Footer />)

    expect(mockGetBrandingProfile).not.toHaveBeenCalled()
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
    expect(quickLinksSection().getByRole('link', { name: /phed assam/i })).toHaveAttribute(
      'href',
      'https://jjmassam.in/'
    )
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

    expect(screen.getByText('Contact Us')).toBeInTheDocument()
    expect(screen.getByText('md@jjmassam.in')).toBeInTheDocument()
    expect(screen.getByText('1800-889-3047')).toBeInTheDocument()
  })

  it('renders credits with PHED Assam and Arghyam links', () => {
    renderWithProviders(<Footer />)

    const credits = singleTenantCredits()
    expect(credits.getByRole('link', { name: /phed assam/i })).toHaveAttribute(
      'href',
      'https://jjmassam.in/'
    )
    expect(credits.getByRole('link', { name: /arghyam/i })).toHaveAttribute(
      'href',
      'https://arghyam.org/'
    )
  })
})

describe('Footer — single-tenant mode with another state profile', () => {
  const { footer: punjab } = BRANDING_PROFILES.punjab

  beforeEach(() => {
    mockIsSingleTenantMode.mockReturnValue(true)
    mockGetBrandingProfile.mockReturnValue(BRANDING_PROFILES.punjab)
  })

  it('omits the Contact Us column when the profile has no contact', () => {
    renderWithProviders(<Footer />)

    expect(punjab.contact).toBeNull()
    expect(screen.queryByText('Contact Us')).not.toBeInTheDocument()
  })

  it("credits the profile's organisation in the copyright line", () => {
    renderWithProviders(<Footer />)

    expect(
      singleTenantCredits().getByRole('link', { name: i18n.t(punjab.copyrightOrg.labelKey) })
    ).toHaveAttribute('href', punjab.copyrightOrg.href)
  })

  it("renders Arghyam's social links", () => {
    renderWithProviders(<Footer />)

    const socialHrefs = screen
      .queryAllByRole('link', { name: /x \(twitter\)|linkedin|email/i })
      .map((link) => link.getAttribute('href'))

    expect(socialHrefs).toEqual([
      'https://x.com/arghyamindia',
      'https://www.linkedin.com/company/arghyam/',
      'mailto:info@arghyam.org',
    ])
  })

  it('keeps the shared quick links', () => {
    renderWithProviders(<Footer />)

    expect(screen.getByRole('link', { name: /system users login/i })).toHaveAttribute(
      'href',
      '/login'
    )
    expect(screen.getByRole('link', { name: /dashboard glossary/i })).toBeInTheDocument()
  })

  it("renders the profile's quick links", () => {
    renderWithProviders(<Footer />)

    const quickLinks = quickLinksSection()
    for (const { labelKey, href } of punjab.quickLinks) {
      expect(quickLinks.getByRole('link', { name: i18n.t(labelKey) })).toHaveAttribute('href', href)
    }
  })

  it('renders none of the Assam branding', () => {
    renderWithProviders(<Footer />)

    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href') ?? '')

    expect(hrefs.filter((href) => /assam|jjmbrain/i.test(href))).toEqual([])
    expect(screen.queryByText('md@jjmassam.in')).not.toBeInTheDocument()
    expect(screen.queryByText(/phed assam/i)).not.toBeInTheDocument()
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
