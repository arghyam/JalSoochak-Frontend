import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PumpOperatorViewPage } from './pump-operator-view-page'

let mockUnparse: jest.Mock
jest.mock('papaparse', () => ({
  __esModule: true,
  default: {
    unparse: (input: unknown) => {
      if (!mockUnparse) {
        mockUnparse = jest.fn((value: unknown) => {
          void value
          return 'csv-content'
        })
      }
      return mockUnparse(input)
    },
  },
}))

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual<typeof import('react-router-dom')>('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

const translations: Record<string, string> = {
  'pages.pumpOperators.heading': 'Pump Operators',
  'pages.pumpOperators.breadcrumb': 'Pump Operators',
  'pages.pumpOperators.viewPumpOperator': 'View Pump Operator',
  'pages.pumpOperators.loadingDetails': 'Loading pump operator details…',
  'pages.pumpOperators.errorDetails': 'Failed to load pump operator details.',
  'pages.pumpOperators.pumpOperatorDetails': 'Pump Operator Details',
  'pages.pumpOperators.detailFields.name': 'Name',
  'pages.pumpOperators.detailFields.phoneNumber': 'Phone Number',
  'pages.pumpOperators.detailFields.reportingRate': 'Reporting rate',
  'pages.pumpOperators.detailFields.lastSubmission': 'Last submission',
  'pages.pumpOperators.searchReadingsPlaceholder': 'Search by scheme name',
  'pages.pumpOperators.loadingReadings': 'Loading readings…',
  'pages.pumpOperators.errorReadings': 'Failed to load readings.',
  'pages.pumpOperators.noReadingsFound': 'No readings found.',
  'pages.pumpOperators.columns.schemeName': 'Scheme Name',
  'pages.pumpOperators.columns.stateSchemeId': 'State Scheme ID',
  'pages.pumpOperators.columns.submissionDateTime': 'Submission Date & Time',
  'pages.pumpOperators.columns.waterSupplied': 'Water Supplied',
  'pages.pumpOperators.columns.readingValue': 'Reading Value',
  'pages.pumpOperators.downloadAttendance': 'Attendance',
  'pages.pumpOperators.attendanceModal.title': 'Download Attendance',
  'pages.pumpOperators.attendanceModal.download': 'Download',
  'pages.pumpOperators.attendanceCsv.date': 'date',
  'pages.pumpOperators.attendanceCsv.attendance': 'attendance',
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
      selector({ user: { personId: '15', tenantCode: 'nl' } })
  ),
}))

const mockUsePumpOperatorDetailsQuery = jest.fn()
const mockUsePumpOperatorReadingsQuery = jest.fn()
const mockUseOperatorAttendanceQuery = jest.fn()
jest.mock('../../services/query/use-pump-operators-queries', () => ({
  usePumpOperatorDetailsQuery: (...args: unknown[]) => mockUsePumpOperatorDetailsQuery(...args),
  usePumpOperatorReadingsQuery: (...args: unknown[]) => mockUsePumpOperatorReadingsQuery(...args),
  useOperatorAttendanceQuery: (...args: unknown[]) => mockUseOperatorAttendanceQuery(...args),
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
  PageHeader: ({ children, rightContent }: { children: ReactNode; rightContent?: ReactNode }) =>
    createElement('div', {}, children, rightContent),
  DateRangePicker: ({
    value,
    onChange,
    placeholder,
  }: {
    value: { startDate: string; endDate: string } | null
    onChange: (value: { startDate: string; endDate: string } | null) => void
    placeholder?: string
  }) =>
    createElement(
      'button',
      {
        type: 'button',
        onClick: () =>
          onChange({
            startDate: '2026-03-01',
            endDate: '2026-03-31',
          }),
      },
      value ? `${value.startDate} to ${value.endDate}` : placeholder
    ),
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
  Object.defineProperty(URL, 'createObjectURL', {
    writable: true,
    value: jest.fn(() => 'blob:mock-url'),
  })
  Object.defineProperty(URL, 'revokeObjectURL', {
    writable: true,
    value: jest.fn(),
  })
  // Prevent jsdom "navigation not implemented" when code triggers <a>.click()
  Object.defineProperty(HTMLAnchorElement.prototype, 'click', {
    writable: true,
    value: jest.fn(),
  })
  mockUsePumpOperatorReadingsQuery.mockReturnValue({
    isLoading: false,
    isError: false,
    data: MOCK_READINGS,
    refetch: jest.fn(),
  })
  mockUseOperatorAttendanceQuery.mockReturnValue({
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

  it('renders pump operator details with name and metrics', () => {
    mockUsePumpOperatorDetailsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: MOCK_DETAILS,
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByText('Shyam Singh')).toBeTruthy()
    expect(screen.getByText('9919420001')).toBeTruthy()
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

  it('renders single-word name correctly', () => {
    mockUsePumpOperatorDetailsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { ...MOCK_DETAILS, name: 'Ravi' },
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByText('Ravi')).toBeTruthy()
  })

  it('shows "—" for null name', () => {
    mockUsePumpOperatorDetailsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { ...MOCK_DETAILS, name: null },
      refetch: jest.fn(),
    })
    renderPage()
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
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

  it('renders attendance button when details are loaded', () => {
    mockUsePumpOperatorDetailsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: MOCK_DETAILS,
      refetch: jest.fn(),
    })
    renderPage()
    expect(screen.getByRole('button', { name: 'Attendance' })).toBeTruthy()
  })

  it('disables attendance button when details are not loaded', () => {
    mockUsePumpOperatorDetailsQuery.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
      refetch: jest.fn(),
    })
    renderPage()
    const button = screen.getByRole('button', { name: 'Attendance' }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
  })

  it('navigates to scheme view page when scheme name is clicked', async () => {
    mockUsePumpOperatorDetailsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: MOCK_DETAILS,
      refetch: jest.fn(),
    })
    renderPage()
    const schemeLink = screen.getByRole('link', { name: 'Test Scheme 1' })
    expect(schemeLink.getAttribute('href')).toBe('/staff/schemes/1')
  })

  it('opens attendance modal and downloads csv with metadata rows', async () => {
    const refetchAttendance = jest.fn(async () => ({
      data: [
        { date: '2026-03-01', attendance: 1 },
        { date: '2026-03-02', attendance: 0 },
      ],
    }))
    mockUsePumpOperatorDetailsQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: MOCK_DETAILS,
      refetch: jest.fn(),
    })
    mockUseOperatorAttendanceQuery.mockReturnValue({
      refetch: refetchAttendance,
    })
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Attendance' }))
    expect(screen.getByText(translations['pages.pumpOperators.attendanceModal.title'])).toBeTruthy()

    fireEvent.click(
      screen.getByRole('button', {
        name: translations['pages.pumpOperators.attendanceModal.download'],
      })
    )

    await waitFor(() => expect(refetchAttendance).toHaveBeenCalled())
    expect(mockUnparse).toHaveBeenCalledWith([
      ['Name', '', 'Phone Number', ''],
      ['Shyam Singh', '', '9919420001', ''],
      ['', '', '', ''],
      [
        translations['pages.pumpOperators.attendanceCsv.date'],
        translations['pages.pumpOperators.attendanceCsv.attendance'],
      ],
      ['2026-03-01', '1'],
      ['2026-03-02', '0'],
    ])
  })
})
