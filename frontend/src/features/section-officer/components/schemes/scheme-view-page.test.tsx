import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SchemeViewPage } from './scheme-view-page'

const mockNavigate = jest.fn()
jest.mock('react-router', () => ({
  ...jest.requireActual<typeof import('react-router')>('react-router'),
  useNavigate: () => mockNavigate,
}))
jest.mock('react-router-dom', () => ({
  ...jest.requireActual<typeof import('react-router-dom')>('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

const translations: Record<string, string> = {
  'pages.schemes.heading': 'All Schemes',
  'pages.schemes.breadcrumb': 'All Schemes',
  'pages.schemes.viewScheme': 'View Scheme',
  'pages.schemes.schemeDetails': 'Scheme Details',
  'pages.schemes.loading': 'Loading scheme details…',
  'pages.schemes.loadingSubmissions': 'Loading submissions…',
  'pages.schemes.error': 'Failed to load scheme details.',
  'pages.schemes.errorSubmissions': 'Failed to load reading submissions.',
  'pages.schemes.noSubmissionsFound': 'No submissions found.',
  'pages.schemes.noSchemesFound': 'No schemes found.',
  'pages.schemes.searchPlaceholder': 'Search by scheme name',
  'pages.schemes.detailFields.schemeName': 'Scheme Name',
  'pages.schemes.detailFields.stateSchemeId': 'State Scheme ID',
  'pages.schemes.detailFields.lastSubmission': 'Last Submission',
  'pages.schemes.detailFields.reportingRate': 'Reporting Rate',
  'pages.schemes.columns.schemeName': 'Scheme Name',
  'pages.schemes.columns.stateSchemeId': 'State Scheme ID',
  'pages.schemes.columns.pumpOperator': 'Pump Operator',
  'pages.schemes.columns.submissionDateTime': 'Submission Date & Time',
  'pages.schemes.columns.waterSupplied': 'Water Supplied',
  'pages.schemes.columns.readingValue': 'Reading Value',
  'common.retry': 'Retry',
  'common.documentTitle': '| JalSoochak',
}

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] || key,
    i18n: { changeLanguage: jest.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() },
}))

jest.mock('@/app/store/auth-store', () => ({
  useAuthStore: jest.fn(
    (selector: (s: { user: { personId: string; tenantCode: string } }) => unknown) =>
      selector({ user: { personId: '42', tenantCode: 'nl' } })
  ),
}))

jest.mock('@/shared/components/common', () => ({
  DataTable: ({
    data,
    emptyMessage,
    columns,
  }: {
    data: Record<string, unknown>[]
    emptyMessage: string
    columns: Array<{
      key: string
      header: string
      render?: (row: Record<string, unknown>) => ReactNode
    }>
  }) => {
    if (data.length === 0) return createElement('div', {}, emptyMessage)
    return createElement(
      'table',
      { 'data-testid': 'data-table' },
      createElement(
        'tbody',
        {},
        data.map((row, i) =>
          createElement(
            'tr',
            { key: i },
            columns.map((col) =>
              createElement(
                'td',
                { key: col.key },
                col.render ? col.render(row) : String(row[col.key] ?? '')
              )
            )
          )
        )
      )
    )
  },
  PageHeader: ({ children }: { children: ReactNode }) => createElement('div', {}, children),
}))

jest.mock('@/app/store/auth-store', () => ({
  useAuthStore: jest.fn(
    (selector: (s: { user: { personId: string; tenantCode: string } }) => unknown) =>
      selector({ user: { personId: '42', tenantCode: 'nl' } })
  ),
}))

const mockUseSchemeDetailsQuery = jest.fn()
const mockUseSchemeReadingsQuery = jest.fn()

jest.mock('../../services/query/use-schemes-queries', () => ({
  useSchemeDetailsQuery: (...args: unknown[]) => mockUseSchemeDetailsQuery(...args),
  useSchemeReadingsQuery: (...args: unknown[]) => mockUseSchemeReadingsQuery(...args),
}))

const MOCK_DETAILS = {
  schemeId: 1,
  stateSchemeId: 'SS-001',
  schemeName: 'Test Scheme 1',
  lastSubmissionAt: '2026-04-04T08:46:32.148617',
  reportingRatePercent: 62.5,
}

const MOCK_READINGS = {
  content: [
    {
      pumpOperatorId: 13,
      pumpOperatorName: 'Op A',
      submittedAt: '2026-04-02T07:12:31.057227',
      readingValue: 4050,
      waterSupplied: -37417,
    },
  ],
  totalElements: 1,
  totalPages: 1,
  size: 10,
  number: 0,
}

function renderPage(schemeId = '1') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(
        MemoryRouter,
        { initialEntries: [`/staff/schemes/${schemeId}`] },
        createElement(
          Routes,
          {},
          createElement(Route, {
            path: '/staff/schemes/:schemeId',
            element: createElement(SchemeViewPage),
          })
        )
      )
    )
  )
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('SchemeViewPage', () => {
  it('renders loading state for details', () => {
    mockUseSchemeDetailsQuery.mockReturnValue({ isLoading: true, isError: false, data: undefined })
    mockUseSchemeReadingsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: undefined,
    })
    renderPage()
    expect(screen.getByText('Loading scheme details…')).toBeTruthy()
  })

  it('renders error state for details with retry', () => {
    mockUseSchemeDetailsQuery.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      refetch: jest.fn(),
    })
    mockUseSchemeReadingsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: MOCK_READINGS,
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByText('Failed to load scheme details.')).toBeTruthy()
  })

  it('renders breadcrumb links', () => {
    mockUseSchemeDetailsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: MOCK_DETAILS,
      refetch: jest.fn(),
    })
    mockUseSchemeReadingsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: MOCK_READINGS,
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getAllByText('All Schemes').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('View Scheme')).toBeTruthy()
  })

  it('renders scheme details card fields', () => {
    mockUseSchemeDetailsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: MOCK_DETAILS,
      refetch: jest.fn(),
    })
    mockUseSchemeReadingsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: MOCK_READINGS,
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByText('Test Scheme 1')).toBeTruthy()
    expect(screen.getByText('SS-001')).toBeTruthy()
    expect(screen.getByText('62.5%')).toBeTruthy()
    expect(screen.getByText('Scheme Details')).toBeTruthy()
  })

  it('renders readings table with data', () => {
    mockUseSchemeDetailsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: MOCK_DETAILS,
      refetch: jest.fn(),
    })
    mockUseSchemeReadingsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: MOCK_READINGS,
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByText('Op A')).toBeTruthy()
    expect(screen.getByText('4050')).toBeTruthy()
    expect(screen.getByText('-37417')).toBeTruthy()
  })

  it('renders empty state when readings list is empty', () => {
    mockUseSchemeDetailsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: MOCK_DETAILS,
      refetch: jest.fn(),
    })
    mockUseSchemeReadingsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0 },
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByText('No submissions found.')).toBeTruthy()
  })

  it('renders error state for readings', () => {
    mockUseSchemeDetailsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: MOCK_DETAILS,
      refetch: jest.fn(),
    })
    mockUseSchemeReadingsQuery.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByText('Failed to load reading submissions.')).toBeTruthy()
  })

  it('navigates to pump operator view page when pump operator name is clicked', async () => {
    mockUseSchemeDetailsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: MOCK_DETAILS,
      refetch: jest.fn(),
    })
    mockUseSchemeReadingsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: MOCK_READINGS,
      refetch: jest.fn(),
    })
    renderPage()
    const user = userEvent.setup()
    const operatorLink = screen.getByText('Op A')
    await user.click(operatorLink)
    expect(mockNavigate).toHaveBeenCalledWith('/staff/pump-operators/13')
  })
})
