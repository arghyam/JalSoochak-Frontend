import { screen, fireEvent, within } from '@testing-library/react'
import { describe, expect, it, jest } from '@jest/globals'
import { StaffSyncPage } from './staff-sync-page'
import { renderWithProviders } from '@/test/render-with-providers'
import type { StaffSyncData } from '../../types/staff-sync'

const mockData: StaffSyncData = {
  stats: {
    totalPumpOperators: 112,
    totalSubDivisionOfficers: 75,
    totalSectionOfficers: 80,
  },
  gramPanchayats: [
    {
      value: 'Achampet',
      label: 'Achampet',
      villages: [
        { value: 'Achampet Village', label: 'Achampet Village' },
        { value: 'Lingapur', label: 'Lingapur' },
      ],
    },
    {
      value: 'Bhongir',
      label: 'Bhongir',
      villages: [
        { value: 'Bhongir Main', label: 'Bhongir Main' },
        { value: 'Aleru', label: 'Aleru' },
      ],
    },
  ],
  staff: [
    {
      id: 'staff-1',
      gramPanchayat: 'Achampet',
      village: 'Achampet Village',
      name: 'Ravi Kumar',
      role: 'pump-operator',
      mobileNumber: '+91 98452-85564',
      lastSubmission: '2025-09-08T15:00:00',
      activityStatus: 'active',
    },
    {
      id: 'staff-2',
      gramPanchayat: 'Achampet',
      village: 'Lingapur',
      name: 'Sanjay Reddy',
      role: 'section-officer',
      mobileNumber: '+91 78945-32101',
      lastSubmission: null,
      activityStatus: 'active',
    },
    {
      id: 'staff-3',
      gramPanchayat: 'Bhongir',
      village: 'Bhongir Main',
      name: 'Vijay Yadav',
      role: 'sub-division-officer',
      mobileNumber: '+91 98765-43210',
      lastSubmission: null,
      activityStatus: 'inactive',
    },
  ],
}

const mockUseStaffSyncQuery = jest.fn()

jest.mock('../../services/query/use-state-admin-queries', () => ({
  useStaffSyncQuery: () => mockUseStaffSyncQuery(),
}))

describe('StaffSyncPage', () => {
  beforeEach(() => {
    mockUseStaffSyncQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })
  })

  it('renders the page title', () => {
    renderWithProviders(<StaffSyncPage />)
    expect(screen.getByRole('heading', { name: /staff sync/i })).toBeTruthy()
  })

  it('renders loading state', () => {
    mockUseStaffSyncQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    })
    renderWithProviders(<StaffSyncPage />)
    expect(screen.getByRole('heading', { name: /staff sync/i })).toBeTruthy()
  })

  it('renders error state with retry button', () => {
    mockUseStaffSyncQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: jest.fn(),
    })
    renderWithProviders(<StaffSyncPage />)
    expect(screen.getByRole('heading', { name: /staff sync/i })).toBeTruthy()
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy()
  })

  it('renders stat cards with correct values', () => {
    renderWithProviders(<StaffSyncPage />)
    expect(screen.getByText('112')).toBeTruthy()
    expect(screen.getByText('75')).toBeTruthy()
    expect(screen.getByText('80')).toBeTruthy()
  })

  it('renders all staff members in the table', () => {
    renderWithProviders(<StaffSyncPage />)
    expect(screen.getByText('Ravi Kumar')).toBeTruthy()
    expect(screen.getByText('Sanjay Reddy')).toBeTruthy()
    expect(screen.getByText('Vijay Yadav')).toBeTruthy()
  })

  it('formats null lastSubmission as N/A', () => {
    renderWithProviders(<StaffSyncPage />)
    const naCells = screen.getAllByText('N/A')
    expect(naCells.length).toBeGreaterThanOrEqual(2)
  })

  it('filters staff by name search', () => {
    renderWithProviders(<StaffSyncPage />)

    const searchInput = screen.getByRole('textbox')
    fireEvent.change(searchInput, { target: { value: 'Ravi' } })

    expect(screen.getByText('Ravi Kumar')).toBeTruthy()
    expect(screen.queryByText('Sanjay Reddy')).toBeNull()
    expect(screen.queryByText('Vijay Yadav')).toBeNull()
  })

  it('shows Upload Data and Download Data buttons', () => {
    renderWithProviders(<StaffSyncPage />)
    expect(screen.getByText('Upload Data')).toBeTruthy()
    expect(screen.getByText('Download Data')).toBeTruthy()
  })

  it('shows filter dropdowns', () => {
    renderWithProviders(<StaffSyncPage />)
    expect(screen.getByText('Gram Panchayat')).toBeTruthy()
    expect(screen.getByText('Village')).toBeTruthy()
    expect(screen.getByText('Role')).toBeTruthy()
    expect(screen.getByText('Status')).toBeTruthy()
  })

  it('does not show clear all filters when no filters are active', () => {
    renderWithProviders(<StaffSyncPage />)
    expect(screen.queryByText('clear all filters')).toBeNull()
  })

  it('shows table column headers', () => {
    renderWithProviders(<StaffSyncPage />)
    expect(screen.getByText('All GP & Village')).toBeTruthy()
    expect(screen.getByText('Name')).toBeTruthy()
    expect(screen.getByText('Mobile Number')).toBeTruthy()
    expect(screen.getByText('Last Submission')).toBeTruthy()
    expect(screen.getByText('Activity Status')).toBeTruthy()
  })

  it('shows empty message when search has no results', () => {
    renderWithProviders(<StaffSyncPage />)

    const searchInput = screen.getByRole('textbox')
    fireEvent.change(searchInput, { target: { value: 'zzznomatch' } })

    expect(screen.getByText('No staff members found')).toBeTruthy()
  })

  it('renders role labels correctly', () => {
    renderWithProviders(<StaffSyncPage />)
    expect(screen.getByText('Pump Operator')).toBeTruthy()
    expect(screen.getByText('Section Officer')).toBeTruthy()
    expect(screen.getByText('Sub-Division Officer')).toBeTruthy()
  })

  it('filters staff by role', () => {
    renderWithProviders(<StaffSyncPage />)

    const filterSection = screen.getByRole('region', { name: /filter staff members/i })
    const roleButton = within(filterSection).getByText('Role')
    fireEvent.click(roleButton)

    const pumpOperatorOption = screen.getByText('Pump Operator')
    fireEvent.click(pumpOperatorOption)

    expect(screen.getByText('Ravi Kumar')).toBeTruthy()
    expect(screen.queryByText('Sanjay Reddy')).toBeNull()
    expect(screen.queryByText('Vijay Yadav')).toBeNull()
  })
})
