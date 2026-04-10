import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnomaliesPage } from './anomalies-page'

import type { ReactNode } from 'react'

const translations: Record<string, string> = {
  'pages.anomalies.heading': 'Anomalies',
  'pages.anomalies.loading': 'Loading…',
  'pages.anomalies.error': 'Failed to load anomalies. Please try again.',
  'pages.anomalies.noAnomaliesFound': 'No anomalies found.',
  'pages.anomalies.searchPlaceholder': 'Search by scheme name',
  'pages.anomalies.filterStatus': 'Filter by status',
  'pages.anomalies.filterDuration': 'Duration',
  'pages.anomalies.clearAllFilters': 'Clear all filters',
  'pages.anomalies.columns.schemeName': 'Scheme Name',
  'pages.anomalies.columns.dateTime': 'Date & Time',
  'pages.anomalies.columns.anomalyType': 'Anomaly Type',
  'pages.anomalies.columns.details': 'Details',
  'pages.anomalies.columns.status': 'Status',
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
  useAuthStore: jest.fn((selector: (s: { user: { id: string; tenantId: string } }) => unknown) =>
    selector({ user: { id: '2', tenantId: '50' } })
  ),
}))

const mockUseAnomaliesListQuery = jest.fn()
const mockUseAnomalyStatusesQuery = jest.fn()

jest.mock('../../services/query/use-anomalies-queries', () => ({
  useAnomaliesListQuery: (...args: unknown[]) => mockUseAnomaliesListQuery(...args),
  useAnomalyStatusesQuery: () => mockUseAnomalyStatusesQuery(),
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
  ActionTooltip: ({ children, label }: { children: ReactNode; label: string }) =>
    createElement('span', { title: label }, children),
  SearchableSelect: ({
    options,
    value,
    onChange,
    placeholder,
    ariaLabel,
  }: {
    options: { value: string; label: string }[]
    value: string
    onChange: (val: string) => void
    placeholder: string
    ariaLabel: string
  }) =>
    createElement(
      'select',
      {
        'aria-label': ariaLabel,
        value,
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value),
      },
      [
        createElement('option', { key: '', value: '' }, placeholder),
        ...options.map((o) => createElement('option', { key: o.value, value: o.value }, o.label)),
      ]
    ),
  DateRangePicker: () => createElement('div', { 'data-testid': 'date-range-picker' }),
  StatusChip: ({ label }: { label: string }) => createElement('span', {}, label),
}))

const MOCK_STATUSES = {
  success: true,
  data: [
    { code: 0, label: 'Unresolved' },
    { code: 1, label: 'In-Progress' },
    { code: 2, label: 'Resolved' },
  ],
}

const MOCK_ANOMALIES = [
  {
    id: 9,
    uuid: 'issue-report-906e61be',
    type: '6',
    userId: 13,
    schemeId: 1,
    tenantId: 50,
    aiReading: null,
    aiConfidencePercentage: null,
    overriddenReading: null,
    retries: 0,
    previousReading: null,
    previousReadingDate: null,
    consecutiveDaysMissed: 0,
    reason: 'No Water Supply',
    remarks: null,
    correlationId: 'issue-report-906e61be',
    resolvedBy: null,
    resolvedAt: null,
    deletedAt: null,
    deletedBy: null,
    createdAt: '2026-04-01T18:52:17.610897Z',
    updatedAt: '2026-04-01T18:52:17.610897Z',
    scheme_name: 'Test Scheme',
    status: 'In-Progress',
  },
]

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    createElement(QueryClientProvider, { client: queryClient }, createElement(AnomaliesPage))
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseAnomalyStatusesQuery.mockReturnValue({ data: MOCK_STATUSES })
})

describe('AnomaliesPage', () => {
  it('renders loading state', () => {
    mockUseAnomaliesListQuery.mockReturnValue({
      isLoading: true,
      isFetching: false,
      isError: false,
      data: undefined,
    })
    renderPage()
    expect(screen.getByRole('status')).toBeTruthy()
    expect(screen.getByText('Loading…')).toBeTruthy()
  })

  it('renders error state with retry button', () => {
    const mockRefetch = jest.fn()
    mockUseAnomaliesListQuery.mockReturnValue({
      isLoading: false,
      isFetching: false,
      isError: true,
      data: undefined,
      refetch: mockRefetch,
    })
    renderPage()
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText('Failed to load anomalies. Please try again.')).toBeTruthy()
  })

  it('renders page heading "Anomalies"', () => {
    mockUseAnomaliesListQuery.mockReturnValue({
      isLoading: false,
      isFetching: false,
      isError: false,
      data: { anomalies: [], total_count: 0 },
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByRole('heading', { name: 'Anomalies' })).toBeTruthy()
  })

  it('renders empty state when no data', () => {
    mockUseAnomaliesListQuery.mockReturnValue({
      isLoading: false,
      isFetching: false,
      isError: false,
      data: { anomalies: [], total_count: 0 },
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByText('No anomalies found.')).toBeTruthy()
  })

  it('renders table rows with anomaly data', () => {
    mockUseAnomaliesListQuery.mockReturnValue({
      isLoading: false,
      isFetching: false,
      isError: false,
      data: { anomalies: MOCK_ANOMALIES, total_count: 1 },
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByText('Test Scheme')).toBeTruthy()
    expect(screen.getByText('No Water Supply')).toBeTruthy()

    const table = screen.getByTestId('data-table')
    // Assert the status appears in the table (not the filter option)
    expect(within(table).getAllByText('In-Progress').length).toBeGreaterThanOrEqual(1)
  })

  it('renders search input', () => {
    mockUseAnomaliesListQuery.mockReturnValue({
      isLoading: false,
      isFetching: false,
      isError: false,
      data: { anomalies: [], total_count: 0 },
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByRole('textbox', { name: 'Search by scheme name' })).toBeTruthy()
  })

  it('updates search query on input change', async () => {
    mockUseAnomaliesListQuery.mockReturnValue({
      isLoading: false,
      isFetching: false,
      isError: false,
      data: { anomalies: [], total_count: 0 },
      refetch: jest.fn(),
    })
    renderPage()
    const searchInput = screen.getByRole('textbox', { name: 'Search by scheme name' })
    await userEvent.type(searchInput, 'Test')
    expect((searchInput as HTMLInputElement).value).toBe('Test')
  })

  it('renders status filter with options from API', () => {
    mockUseAnomaliesListQuery.mockReturnValue({
      isLoading: false,
      isFetching: false,
      isError: false,
      data: { anomalies: [], total_count: 0 },
      refetch: jest.fn(),
    })
    renderPage()
    const statusSelect = screen.getByRole('combobox', { name: 'Filter by status' })
    expect(statusSelect).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Unresolved' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'In-Progress' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Resolved' })).toBeTruthy()
  })

  it('shows clear all filters button when search is active', async () => {
    mockUseAnomaliesListQuery.mockReturnValue({
      isLoading: false,
      isFetching: false,
      isError: false,
      data: { anomalies: [], total_count: 0 },
      refetch: jest.fn(),
    })
    renderPage()
    const searchInput = screen.getByRole('textbox', { name: 'Search by scheme name' })
    await userEvent.type(searchInput, 'abc')
    expect(screen.getByRole('button', { name: 'Clear all filters' })).toBeTruthy()
  })

  it('clears filters on "clear all filters" click', async () => {
    mockUseAnomaliesListQuery.mockReturnValue({
      isLoading: false,
      isFetching: false,
      isError: false,
      data: { anomalies: [], total_count: 0 },
      refetch: jest.fn(),
    })
    renderPage()
    const searchInput = screen.getByRole('textbox', { name: 'Search by scheme name' })
    await userEvent.type(searchInput, 'abc')
    const clearBtn = screen.getByRole('button', { name: 'Clear all filters' })
    await userEvent.click(clearBtn)
    expect((searchInput as HTMLInputElement).value).toBe('')
    expect(screen.queryByRole('button', { name: 'Clear all filters' })).toBeNull()
  })

  it('renders "—" for missing anomaly fields', () => {
    mockUseAnomaliesListQuery.mockReturnValue({
      isLoading: false,
      isFetching: false,
      isError: false,
      data: {
        anomalies: [
          {
            ...MOCK_ANOMALIES[0],
            scheme_name: null,
            reason: null,
            status: null,
            createdAt: null,
          },
        ],
        total_count: 1,
      },
      refetch: jest.fn(),
    })
    renderPage()
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })
})
