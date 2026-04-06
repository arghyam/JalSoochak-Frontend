import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SchemesPage } from './schemes-page'

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
      selector({ user: { personId: '42', tenantCode: 'nl' } })
  ),
}))

const mockUseSchemesListQuery = jest.fn()
jest.mock('../../services/query/use-schemes-queries', () => ({
  useSchemesListQuery: (...args: unknown[]) => mockUseSchemesListQuery(...args),
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
}))

const MOCK_SCHEMES = [
  {
    schemeId: 1,
    stateSchemeId: 'SS-001',
    schemeName: 'Test Scheme 1',
    pumpOperatorNames: ['Op A', 'Op B'],
    lastReading: 2722,
    lastReadingAt: '2026-04-04T08:46:32.148617',
    yesterdayReading: 0,
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
      createElement(MemoryRouter, {}, createElement(SchemesPage))
    )
  )
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('SchemesPage', () => {
  it('renders loading state', () => {
    mockUseSchemesListQuery.mockReturnValue({ isLoading: true, isError: false, data: undefined })
    renderPage()
    expect(screen.getByRole('status')).toBeTruthy()
    expect(screen.getByText('Loading…')).toBeTruthy()
  })

  it('renders error state with retry button', () => {
    const mockRefetch = jest.fn()
    mockUseSchemesListQuery.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      refetch: mockRefetch,
    })
    renderPage()
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText('Failed to load schemes. Please try again.')).toBeTruthy()
  })

  it('renders page heading "All Schemes"', () => {
    mockUseSchemesListQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { content: [], totalElements: 0 },
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByRole('heading', { name: 'All Schemes' })).toBeTruthy()
  })

  it('renders empty state when no data', () => {
    mockUseSchemesListQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { content: [], totalElements: 0 },
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByText('No schemes found.')).toBeTruthy()
  })

  it('renders table rows with scheme data', () => {
    mockUseSchemesListQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { content: MOCK_SCHEMES, totalElements: 1 },
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByText('Test Scheme 1')).toBeTruthy()
    expect(screen.getByText('SS-001')).toBeTruthy()
    expect(screen.getByText('Op A, Op B')).toBeTruthy()
    expect(screen.getByText('2722')).toBeTruthy()
  })

  it('shows "—" for null lastWaterSupplied', () => {
    mockUseSchemesListQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { content: MOCK_SCHEMES, totalElements: 1 },
      refetch: jest.fn(),
    })
    renderPage()
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })

  it('renders search input', () => {
    mockUseSchemesListQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { content: [], totalElements: 0 },
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByRole('textbox', { name: 'Search by scheme name' })).toBeTruthy()
  })

  it('navigates to scheme view on view icon click', async () => {
    mockUseSchemesListQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { content: MOCK_SCHEMES, totalElements: 1 },
      refetch: jest.fn(),
    })
    renderPage()
    const viewButton = screen.getByRole('button', { name: 'View scheme' })
    await userEvent.click(viewButton)
    expect(mockNavigate).toHaveBeenCalledWith('/staff/schemes/1')
  })

  it('updates search query on input change', async () => {
    mockUseSchemesListQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { content: [], totalElements: 0 },
      refetch: jest.fn(),
    })
    renderPage()
    const searchInput = screen.getByRole('textbox', { name: 'Search by scheme name' })
    await userEvent.type(searchInput, 'abc')
    expect((searchInput as HTMLInputElement).value).toBe('abc')
  })
})
