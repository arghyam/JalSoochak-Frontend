import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FixReadingsPage } from './fix-readings-page'

const translations: Record<string, string> = {
  'pages.fixReadings.title': 'Fix Readings',
  'pages.fixReadings.searchPlaceholder': 'Search by scheme name',
  'pages.fixReadings.noResults': 'No schemes found',
  'pages.fixReadings.yesterdayReading': 'Last Confirmed Reading',
  'pages.fixReadings.updateReading': 'Update Reading',
  'pages.fixReadings.updateButton': 'Update',
  'pages.fixReadings.successMessage': 'Reading updated successfully',
  'pages.fixReadings.clearSearch': 'Clear search',
}

jest.mock('@/shared/hooks/use-debounce', () => ({
  useDebounce: <T,>(value: T) => value,
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      translations[key] ?? opts?.defaultValue ?? key,
    i18n: { changeLanguage: jest.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() },
}))

jest.mock('@/app/store/auth-store', () => ({
  useAuthStore: jest.fn((selector: (s: { user: { tenantCode: string } }) => unknown) =>
    selector({ user: { tenantCode: 'AS' } })
  ),
}))

const mockUseYesterdayFinalReadingsQuery = jest.fn()
const mockUseUpdateFinalReadingMutation = jest.fn()

jest.mock('../../services/query/use-fix-readings-queries', () => ({
  useYesterdayFinalReadingsQuery: (...args: unknown[]) =>
    mockUseYesterdayFinalReadingsQuery(...args),
  useUpdateFinalReadingMutation: () => mockUseUpdateFinalReadingMutation(),
}))

jest.mock('@/shared/components/common', () => ({
  PageHeader: ({ children }: { children: ReactNode }) =>
    createElement('div', { 'data-testid': 'page-header' }, children),
  ToastContainer: () => createElement('div', { 'data-testid': 'toast-container' }),
}))

const mockSchemes = [
  {
    schemeId: 28443,
    schemeName: 'S2604141918',
    yesterdayFinalReading: 150,
    phoneNumber: '917050624279',
  },
  {
    schemeId: 28444,
    schemeName: 'S2604141919',
    yesterdayFinalReading: 200,
    phoneNumber: '917050624280',
  },
]

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(MemoryRouter, {}, createElement(FixReadingsPage))
    )
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseYesterdayFinalReadingsQuery.mockReturnValue({ data: undefined, isLoading: false })
  mockUseUpdateFinalReadingMutation.mockReturnValue({ mutate: jest.fn(), isPending: false })
})

describe('FixReadingsPage', () => {
  it('renders page title', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'Fix Readings' })).toBeTruthy()
  })

  it('renders search input with correct placeholder', () => {
    renderPage()
    expect(screen.getByPlaceholderText('Search by scheme name')).toBeTruthy()
  })

  it('does not show dropdown initially when search is empty', () => {
    renderPage()
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('shows loading spinner in dropdown while searching', async () => {
    mockUseYesterdayFinalReadingsQuery.mockReturnValue({ data: undefined, isLoading: true })
    renderPage()

    const input = screen.getByPlaceholderText('Search by scheme name')
    await userEvent.type(input, 'S26')

    expect(screen.getByRole('listbox')).toBeTruthy()
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('shows "No schemes found" when results are empty', async () => {
    mockUseYesterdayFinalReadingsQuery.mockReturnValue({
      data: { content: [], totalElements: 0 },
      isLoading: false,
    })
    renderPage()

    const input = screen.getByPlaceholderText('Search by scheme name')
    await userEvent.type(input, 'ZZZ')

    expect(screen.getByText('No schemes found')).toBeTruthy()
  })

  it('renders scheme names in dropdown when results exist', async () => {
    mockUseYesterdayFinalReadingsQuery.mockReturnValue({
      data: { content: mockSchemes, totalElements: 2 },
      isLoading: false,
    })
    renderPage()

    const input = screen.getByPlaceholderText('Search by scheme name')
    await userEvent.type(input, 'S26')

    expect(screen.getByText('S2604141918')).toBeTruthy()
    expect(screen.getByText('S2604141919')).toBeTruthy()
  })

  it('selects a scheme and shows detail form when clicked', async () => {
    mockUseYesterdayFinalReadingsQuery.mockReturnValue({
      data: { content: mockSchemes, totalElements: 2 },
      isLoading: false,
    })
    renderPage()

    const input = screen.getByPlaceholderText('Search by scheme name')
    await userEvent.type(input, 'S26')

    fireEvent.click(screen.getByText('S2604141918'))

    expect(screen.queryByRole('listbox')).toBeNull()
    expect(screen.getByText('S2604141918')).toBeTruthy()
    expect(screen.getByLabelText('Last confirm Reading')).toBeTruthy()
    expect(screen.getByLabelText('Update Reading')).toBeTruthy()
  })

  it('Update button is disabled when updateReading is empty', async () => {
    mockUseYesterdayFinalReadingsQuery.mockReturnValue({
      data: { content: mockSchemes, totalElements: 2 },
      isLoading: false,
    })
    renderPage()

    const input = screen.getByPlaceholderText('Search by scheme name')
    await userEvent.type(input, 'S26')
    fireEvent.click(screen.getByText('S2604141918'))

    const updateBtn = screen.getByRole('button', { name: 'Update' })
    expect((updateBtn as HTMLButtonElement).disabled).toBe(true)
  })

  it('calls mutation with correct args when Update is clicked', async () => {
    const mockMutate = jest.fn()
    mockUseUpdateFinalReadingMutation.mockReturnValue({ mutate: mockMutate, isPending: false })
    mockUseYesterdayFinalReadingsQuery.mockReturnValue({
      data: { content: mockSchemes, totalElements: 2 },
      isLoading: false,
    })
    renderPage()

    const input = screen.getByPlaceholderText('Search by scheme name')
    await userEvent.type(input, 'S26')
    fireEvent.click(screen.getByText('S2604141918'))

    const updateReadingInput = screen.getByLabelText('Update Reading')
    fireEvent.change(updateReadingInput, { target: { value: '300500' } })

    fireEvent.click(screen.getByRole('button', { name: 'Update' }))

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        schemeId: 28443,
        payload: expect.objectContaining({
          phoneNumber: '917050624279',
          reading: 300500,
        }),
      }),
      expect.any(Object)
    )
  })

  it('clears form when clear (×) button is clicked after selection', async () => {
    mockUseYesterdayFinalReadingsQuery.mockReturnValue({
      data: { content: mockSchemes, totalElements: 2 },
      isLoading: false,
    })
    renderPage()

    const input = screen.getByPlaceholderText('Search by scheme name')
    await userEvent.type(input, 'S26')
    fireEvent.click(screen.getByText('S2604141918'))

    expect(screen.getByText('S2604141918')).toBeTruthy()

    const clearBtn = screen.getByRole('button', { name: 'Clear search' })
    fireEvent.click(clearBtn)

    expect(screen.queryByLabelText('Last confirm Reading')).toBeNull()
    expect((input as HTMLInputElement).value).toBe('')
  })

  it('Update button shows loading when mutation is pending', async () => {
    mockUseUpdateFinalReadingMutation.mockReturnValue({ mutate: jest.fn(), isPending: true })
    mockUseYesterdayFinalReadingsQuery.mockReturnValue({
      data: { content: mockSchemes, totalElements: 2 },
      isLoading: false,
    })
    renderPage()

    const input = screen.getByPlaceholderText('Search by scheme name')
    await userEvent.type(input, 'S26')
    fireEvent.click(screen.getByText('S2604141918'))

    const updateBtn = screen.getByRole('button', { name: /update/i })
    expect((updateBtn as HTMLButtonElement).disabled).toBe(true)
    expect(updateBtn.dataset.loading).not.toBeUndefined()
  })
})
