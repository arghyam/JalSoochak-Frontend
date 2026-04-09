import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StaffEscalationsPage } from './staff-escalations-page'

import type { ReactNode } from 'react'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: jest.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() },
}))

jest.mock('@/app/store/auth-store', () => ({
  useAuthStore: jest.fn((selector: (s: { user: { id: string; tenantId: string } }) => unknown) =>
    selector({ user: { id: '2', tenantId: '50' } })
  ),
}))

const mockUseEscalationsListQuery = jest.fn()
const mockUseEscalationStatusesQuery = jest.fn()

jest.mock('../../services/query/use-escalations-queries', () => ({
  useEscalationsListQuery: (...args: unknown[]) => mockUseEscalationsListQuery(...args),
  useEscalationStatusesQuery: () => mockUseEscalationStatusesQuery(),
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

const MOCK_ESCALATIONS = [
  {
    id: 900127,
    tenantId: 50,
    schemeId: 1,
    escalationType: '9',
    message: 'pump operator has not submitted for 2 consecutive days',
    correlationId: '2b540432-bb88-3f8c-b254-f0517880b0a1',
    userId: 2,
    remark: null,
    createdAt: '2026-04-01T08:10:00.046812',
    updatedAt: '2026-04-01T08:10:00.046812',
    scheme_name: 'Test Scheme',
    resolution_status: 'In-Progress',
  },
]

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    createElement(QueryClientProvider, { client: queryClient }, createElement(StaffEscalationsPage))
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseEscalationStatusesQuery.mockReturnValue({ data: MOCK_STATUSES })
})

describe('StaffEscalationsPage', () => {
  it('renders loading state', () => {
    mockUseEscalationsListQuery.mockReturnValue({
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
    mockUseEscalationsListQuery.mockReturnValue({
      isLoading: false,
      isFetching: false,
      isError: true,
      data: undefined,
      refetch: mockRefetch,
    })
    renderPage()
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText('Failed to load escalations. Please try again.')).toBeTruthy()
  })

  it('renders page heading "Escalations"', () => {
    mockUseEscalationsListQuery.mockReturnValue({
      isLoading: false,
      isFetching: false,
      isError: false,
      data: { escalations: [], total_count: 0 },
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByRole('heading', { name: 'Escalations' })).toBeTruthy()
  })

  it('renders empty state when no data', () => {
    mockUseEscalationsListQuery.mockReturnValue({
      isLoading: false,
      isFetching: false,
      isError: false,
      data: { escalations: [], total_count: 0 },
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByText('No escalations found.')).toBeTruthy()
  })

  it('renders table rows with escalation data', () => {
    mockUseEscalationsListQuery.mockReturnValue({
      isLoading: false,
      isFetching: false,
      isError: false,
      data: { escalations: MOCK_ESCALATIONS, total_count: 1 },
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByText('Test Scheme')).toBeTruthy()

    const table = screen.getByTestId('data-table')
    // Assert the full untruncated message appears in the table
    expect(
      within(table).getByText('pump operator has not submitted for 2 consecutive days')
    ).toBeTruthy()
    // Assert the status appears in the table (not the filter option)
    expect(within(table).getAllByText('In-Progress').length).toBeGreaterThanOrEqual(1)
  })

  it('renders search input', () => {
    mockUseEscalationsListQuery.mockReturnValue({
      isLoading: false,
      isFetching: false,
      isError: false,
      data: { escalations: [], total_count: 0 },
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByRole('textbox', { name: 'Search by scheme name' })).toBeTruthy()
  })

  it('updates search query on input change', async () => {
    mockUseEscalationsListQuery.mockReturnValue({
      isLoading: false,
      isFetching: false,
      isError: false,
      data: { escalations: [], total_count: 0 },
      refetch: jest.fn(),
    })
    renderPage()
    const searchInput = screen.getByRole('textbox', { name: 'Search by scheme name' })
    await userEvent.type(searchInput, 'Test')
    expect((searchInput as HTMLInputElement).value).toBe('Test')
  })

  it('renders status filter with options from API', () => {
    mockUseEscalationsListQuery.mockReturnValue({
      isLoading: false,
      isFetching: false,
      isError: false,
      data: { escalations: [], total_count: 0 },
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
    mockUseEscalationsListQuery.mockReturnValue({
      isLoading: false,
      isFetching: false,
      isError: false,
      data: { escalations: [], total_count: 0 },
      refetch: jest.fn(),
    })
    renderPage()
    const searchInput = screen.getByRole('textbox', { name: 'Search by scheme name' })
    await userEvent.type(searchInput, 'abc')
    expect(screen.getByRole('button', { name: 'Clear all filters' })).toBeTruthy()
  })

  it('clears filters on "clear all filters" click', async () => {
    mockUseEscalationsListQuery.mockReturnValue({
      isLoading: false,
      isFetching: false,
      isError: false,
      data: { escalations: [], total_count: 0 },
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

  it('renders "—" for missing escalation fields', () => {
    mockUseEscalationsListQuery.mockReturnValue({
      isLoading: false,
      isFetching: false,
      isError: false,
      data: {
        escalations: [
          {
            ...MOCK_ESCALATIONS[0],
            scheme_name: null,
            message: null,
            resolution_status: null,
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
