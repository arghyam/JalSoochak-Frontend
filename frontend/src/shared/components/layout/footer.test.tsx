import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { Footer } from './footer'

jest.mock('@/config/server-config', () => ({
  isSingleTenantMode: jest.fn(),
}))

import { isSingleTenantMode } from '@/config/server-config'

const mockIsSingleTenantMode = isSingleTenantMode as jest.Mock

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
