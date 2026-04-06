import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PumpOperatorsPage } from './pump-operators-page'

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

const mockUsePumpOperatorsListQuery = jest.fn()
jest.mock('../../services/query/use-pump-operators-queries', () => ({
  usePumpOperatorsListQuery: (...args: unknown[]) => mockUsePumpOperatorsListQuery(...args),
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
  ActionTooltip: ({ children }: { children: ReactNode }) => createElement('span', {}, children),
  SearchableSelect: ({
    value,
    onChange,
    placeholder,
    ariaLabel,
  }: {
    value: string
    onChange: (v: string) => void
    placeholder: string
    ariaLabel?: string
  }) =>
    createElement('select', { 'aria-label': ariaLabel ?? placeholder, value, onChange }, [
      createElement('option', { key: '', value: '' }, placeholder),
      createElement('option', { key: 'ACTIVE', value: 'ACTIVE' }, 'Active'),
      createElement('option', { key: 'INACTIVE', value: 'INACTIVE' }, 'Inactive'),
    ]),
  DateRangePicker: () => createElement('div', { 'data-testid': 'date-range-picker' }),
  StatusChip: ({ label }: { label: string }) => createElement('span', {}, label),
}))

const MOCK_OPERATORS = [
  {
    id: 13,
    uuid: '94f7dffa',
    name: 'Ravi Kumar',
    status: 'ACTIVE',
    schemes: [
      { schemeId: 1, schemeName: 'Swajal Dhara', stateSchemeId: 'SS-001' },
      { schemeId: 2, schemeName: 'Jai Kranti', stateSchemeId: 'SS-002' },
    ],
    reportingRatePercent: 96,
    lastSubmissionAt: '2026-04-06T05:28:08.640517',
    lastWaterSupplied: null,
  },
]

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(MemoryRouter, {}, createElement(PumpOperatorsPage))
    )
  )
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('PumpOperatorsPage', () => {
  it('renders loading state', () => {
    mockUsePumpOperatorsListQuery.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
    })
    renderPage()
    expect(screen.getByRole('status')).toBeTruthy()
    expect(screen.getByText('Loading…')).toBeTruthy()
  })

  it('renders error state with retry button', () => {
    const mockRefetch = jest.fn()
    mockUsePumpOperatorsListQuery.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      refetch: mockRefetch,
    })
    renderPage()
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText('Failed to load pump operators. Please try again.')).toBeTruthy()
  })

  it('renders page heading "Pump Operators"', () => {
    mockUsePumpOperatorsListQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { content: [], totalElements: 0 },
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByRole('heading', { name: 'Pump Operators' })).toBeTruthy()
  })

  it('renders empty state when no data', () => {
    mockUsePumpOperatorsListQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { content: [], totalElements: 0 },
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByText('No pump operators found.')).toBeTruthy()
  })

  it('renders table rows with pump operator data', () => {
    mockUsePumpOperatorsListQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { content: MOCK_OPERATORS, totalElements: 1 },
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByText('Ravi Kumar')).toBeTruthy()
    expect(screen.getByText('96')).toBeTruthy()
    expect(screen.getByText('Active')).toBeTruthy()
  })

  it('shows first scheme name and +N for multiple schemes', () => {
    mockUsePumpOperatorsListQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { content: MOCK_OPERATORS, totalElements: 1 },
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByText('Swajal Dhara')).toBeTruthy()
    expect(screen.getByText('+1')).toBeTruthy()
  })

  it('shows "—" when lastSubmissionAt is null', () => {
    const operatorNoSubmission = [{ ...MOCK_OPERATORS[0], lastSubmissionAt: null }]
    mockUsePumpOperatorsListQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { content: operatorNoSubmission, totalElements: 1 },
      refetch: jest.fn(),
    })
    renderPage()
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })

  it('renders search input', () => {
    mockUsePumpOperatorsListQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { content: [], totalElements: 0 },
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByRole('textbox', { name: 'Search by name' })).toBeTruthy()
  })

  it('renders status filter and date range picker', () => {
    mockUsePumpOperatorsListQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { content: [], totalElements: 0 },
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByRole('combobox', { name: 'Filter by status' })).toBeTruthy()
    expect(screen.getByTestId('date-range-picker')).toBeTruthy()
  })

  it('navigates to pump operator view on view icon click', async () => {
    mockUsePumpOperatorsListQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { content: MOCK_OPERATORS, totalElements: 1 },
      refetch: jest.fn(),
    })
    renderPage()
    const viewButton = screen.getByRole('button', { name: 'View pump operator' })
    await userEvent.click(viewButton)
    expect(mockNavigate).toHaveBeenCalledWith('/staff/pump-operators/13')
  })

  it('does not show clear all filters button when no filters active', () => {
    mockUsePumpOperatorsListQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { content: [], totalElements: 0 },
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.queryByRole('button', { name: 'Clear all filters' })).toBeNull()
  })

  it('shows clear all filters button after typing in search', async () => {
    mockUsePumpOperatorsListQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { content: [], totalElements: 0 },
      refetch: jest.fn(),
    })
    renderPage()
    const searchInput = screen.getByRole('textbox', { name: 'Search by name' })
    await userEvent.type(searchInput, 'ravi')
    expect(screen.getByRole('button', { name: 'Clear all filters' })).toBeTruthy()
  })
})
