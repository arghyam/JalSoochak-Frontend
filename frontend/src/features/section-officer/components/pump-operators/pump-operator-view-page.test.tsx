import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PumpOperatorViewPage } from './pump-operator-view-page'

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual<typeof import('react-router-dom')>('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: jest.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() },
}))

jest.mock('@/app/store/auth-store', () => ({
  useAuthStore: jest.fn(
    (selector: (s: { user: { personId: string; tenantCode: string } }) => unknown) =>
      selector({ user: { personId: '15', tenantCode: 'nl' } })
  ),
}))

const mockUsePumpOperatorDetailsQuery = jest.fn()
const mockUsePumpOperatorReadingsQuery = jest.fn()
jest.mock('../../services/query/use-pump-operators-queries', () => ({
  usePumpOperatorDetailsQuery: (...args: unknown[]) => mockUsePumpOperatorDetailsQuery(...args),
  usePumpOperatorReadingsQuery: (...args: unknown[]) => mockUsePumpOperatorReadingsQuery(...args),
}))

import type { ReactNode } from 'react'

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

const MOCK_DETAILS = {
  id: 3,
  uuid: '4c3d5550',
  name: 'Shyam Singh',
  email: 'po@pump.local',
  phoneNumber: '9919420001',
  status: 'INACTIVE',
  schemeId: 2,
  schemeName: 'Test Scheme 2',
  schemeLatitude: 13.9716,
  schemeLongitude: 78.5946,
  lastSubmissionAt: '2026-04-06T05:28:08.640517',
  firstSubmissionDate: null,
  totalDaysSinceFirstSubmission: null,
  submittedDays: 0,
  reportingRatePercent: 85,
  missedSubmissionDays: null,
}

const MOCK_READINGS = {
  content: [
    {
      schemeId: 1,
      schemeName: 'Test Scheme 1',
      stateSchemeId: 'SS-001',
      readingAt: '2026-03-31T17:48:16.127898',
      readingValue: 0,
      waterSupplied: -2722,
    },
  ],
  totalElements: 1,
  totalPages: 1,
  size: 10,
  number: 0,
}

function renderPage(operatorId = '3') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(
        MemoryRouter,
        { initialEntries: [`/staff/pump-operators/${operatorId}`] },
        createElement(
          Routes,
          {},
          createElement(Route, {
            path: '/staff/pump-operators/:operatorId',
            element: createElement(PumpOperatorViewPage),
          })
        )
      )
    )
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUsePumpOperatorReadingsQuery.mockReturnValue({
    isLoading: false,
    isError: false,
    data: MOCK_READINGS,
    refetch: jest.fn(),
  })
})

describe('PumpOperatorViewPage', () => {
  it('renders loading state for details', () => {
    mockUsePumpOperatorDetailsQuery.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByRole('status')).toBeTruthy()
    expect(screen.getByText('Loading pump operator details…')).toBeTruthy()
  })

  it('renders details error state with retry button', () => {
    mockUsePumpOperatorDetailsQuery.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText('Failed to load pump operator details.')).toBeTruthy()
  })

  it('renders breadcrumb navigation', () => {
    mockUsePumpOperatorDetailsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: MOCK_DETAILS,
      refetch: jest.fn(),
    })
    renderPage()
    // 'Pump Operators' appears in both the h1 and the breadcrumb link
    expect(screen.getAllByText('Pump Operators').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('View Pump Operator')).toBeTruthy()
  })

  it('renders pump operator details with split name', () => {
    mockUsePumpOperatorDetailsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: MOCK_DETAILS,
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByText('First name')).toBeTruthy()
    expect(screen.getByText('Shyam')).toBeTruthy()
    expect(screen.getByText('Last name')).toBeTruthy()
    expect(screen.getByText('Singh')).toBeTruthy()
    expect(screen.getByText('85%')).toBeTruthy()
  })

  it('shows "—" for null reporting rate and submission', () => {
    mockUsePumpOperatorDetailsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { ...MOCK_DETAILS, reportingRatePercent: null, lastSubmissionAt: null },
      refetch: jest.fn(),
    })
    renderPage()
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  it('renders single-word name with "—" as last name', () => {
    mockUsePumpOperatorDetailsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { ...MOCK_DETAILS, name: 'Ravi' },
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByText('Ravi')).toBeTruthy()
  })

  it('renders readings table', () => {
    mockUsePumpOperatorDetailsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: MOCK_DETAILS,
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByText('Test Scheme 1')).toBeTruthy()
    expect(screen.getByText('SS-001')).toBeTruthy()
    expect(screen.getByText('-2722')).toBeTruthy()
    expect(screen.getByText('0')).toBeTruthy()
  })

  it('renders empty readings state', () => {
    mockUsePumpOperatorDetailsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: MOCK_DETAILS,
      refetch: jest.fn(),
    })
    mockUsePumpOperatorReadingsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { content: [], totalElements: 0 },
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByText('No readings found.')).toBeTruthy()
  })

  it('renders search input for scheme name', () => {
    mockUsePumpOperatorDetailsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: MOCK_DETAILS,
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByRole('textbox', { name: 'Search by scheme name' })).toBeTruthy()
  })

  it('renders readings error state with retry', () => {
    mockUsePumpOperatorDetailsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: MOCK_DETAILS,
      refetch: jest.fn(),
    })
    mockUsePumpOperatorReadingsQuery.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByText('Failed to load readings.')).toBeTruthy()
  })
})
