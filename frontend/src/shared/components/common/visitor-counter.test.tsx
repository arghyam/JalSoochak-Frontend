import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'

jest.mock('@/config/server-config', () => ({
  isAnalyticsEnabled: jest.fn(),
}))

jest.mock('@/shared/lib/site-stats/use-visitor-count-query', () => ({
  useVisitorCountQuery: jest.fn(),
}))

import { isAnalyticsEnabled } from '@/config/server-config'
import { useVisitorCountQuery } from '@/shared/lib/site-stats/use-visitor-count-query'
import { VisitorCounter } from './visitor-counter'

const mockIsAnalyticsEnabled = isAnalyticsEnabled as jest.Mock
const mockUseVisitorCountQuery = useVisitorCountQuery as jest.Mock

const queryResult = (overrides: Record<string, unknown>) => ({
  data: undefined,
  isLoading: false,
  isError: false,
  ...overrides,
})

beforeEach(() => {
  jest.clearAllMocks()
  mockIsAnalyticsEnabled.mockReturnValue(true)
})

describe('VisitorCounter', () => {
  it('renders nothing when analytics is not configured', () => {
    mockIsAnalyticsEnabled.mockReturnValue(false)
    mockUseVisitorCountQuery.mockReturnValue(queryResult({ data: 20015 }))

    renderWithProviders(<VisitorCounter />)

    expect(screen.queryByText('Visitors')).not.toBeInTheDocument()
    expect(screen.queryByText('20,015')).not.toBeInTheDocument()
  })

  it('renders a skeleton while loading', () => {
    mockUseVisitorCountQuery.mockReturnValue(queryResult({ isLoading: true }))

    const { container } = renderWithProviders(<VisitorCounter />)

    expect(screen.queryByText('Visitors')).not.toBeInTheDocument()
    expect(container.querySelector('.chakra-skeleton')).toBeInTheDocument()
  })

  it('renders nothing on error, so a broken counter cannot break the footer', () => {
    mockUseVisitorCountQuery.mockReturnValue(queryResult({ isError: true }))

    renderWithProviders(<VisitorCounter />)

    expect(screen.queryByText('Visitors')).not.toBeInTheDocument()
    expect(screen.queryByText('20,015')).not.toBeInTheDocument()
  })

  it('renders nothing when the query resolves without a count', () => {
    mockUseVisitorCountQuery.mockReturnValue(queryResult({ data: undefined }))

    renderWithProviders(<VisitorCounter />)

    expect(screen.queryByText('Visitors')).not.toBeInTheDocument()
    expect(screen.queryByText('20,015')).not.toBeInTheDocument()
  })

  it('renders the count with thousands separators and a label', () => {
    mockUseVisitorCountQuery.mockReturnValue(queryResult({ data: 20015 }))

    renderWithProviders(<VisitorCounter />)

    expect(screen.getByText('20,015')).toBeInTheDocument()
    expect(screen.getByText('Visitors')).toBeInTheDocument()
  })

  it('renders a zero count rather than hiding it', () => {
    mockUseVisitorCountQuery.mockReturnValue(queryResult({ data: 0 }))

    renderWithProviders(<VisitorCounter />)

    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('exposes the count to assistive technology', () => {
    mockUseVisitorCountQuery.mockReturnValue(queryResult({ data: 20015 }))

    renderWithProviders(<VisitorCounter />)

    expect(screen.getByLabelText('20015 visitors')).toBeInTheDocument()
  })
})
