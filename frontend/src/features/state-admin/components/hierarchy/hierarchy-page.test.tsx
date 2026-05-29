import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { HierarchyPage } from './hierarchy-page'
import { renderWithProviders } from '@/test/render-with-providers'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSaveLgd = jest.fn<(...args: any[]) => any>()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSaveDept = jest.fn<(...args: any[]) => any>()
const mockLgdQuery = jest.fn()
const mockDeptQuery = jest.fn()
const mockLgdConstraints = jest.fn()
const mockDeptConstraints = jest.fn()
const mockTenantStatusQuery = jest.fn()
const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

jest.mock('@/app/store/auth-store', () => ({
  useAuthStore: () => ({ user: { tenantCode: 'AS' } }),
}))

jest.mock('../../services/query/use-state-admin-queries', () => ({
  useLgdHierarchyQuery: () => mockLgdQuery(),
  useDepartmentHierarchyQuery: () => mockDeptQuery(),
  useLgdEditConstraintsQuery: () => mockLgdConstraints(),
  useDepartmentEditConstraintsQuery: () => mockDeptConstraints(),
  useSaveLgdHierarchyMutation: () => ({
    mutateAsync: mockSaveLgd,
    isPending: false,
  }),
  useSaveDepartmentHierarchyMutation: () => ({
    mutateAsync: mockSaveDept,
    isPending: false,
  }),
  useTenantStatusQuery: () => mockTenantStatusQuery(),
}))

const lgdLevels = {
  hierarchyType: 'LGD' as const,
  levels: [
    { level: 1, name: 'State' },
    { level: 2, name: 'District' },
  ],
}

const deptLevels = {
  hierarchyType: 'DEPARTMENT' as const,
  levels: [
    { level: 1, name: 'State' },
    { level: 2, name: 'Zone' },
  ],
}

const constraints = {
  structuralChangesAllowed: true,
  seededRecordCount: 0,
}

describe('HierarchyPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLgdQuery.mockReturnValue({ data: lgdLevels, isLoading: false, isError: false })
    mockDeptQuery.mockReturnValue({ data: deptLevels, isLoading: false, isError: false })
    mockLgdConstraints.mockReturnValue({ data: constraints, isLoading: false, isError: false })
    mockDeptConstraints.mockReturnValue({ data: constraints, isLoading: false, isError: false })
    // Default: not onboarded — existing tests should continue to work as-is
    mockTenantStatusQuery.mockReturnValue({ data: 'ACTIVE' })
  })

  it('renders loading state', () => {
    mockLgdQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    renderWithProviders(<HierarchyPage />)
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('renders error state', () => {
    mockLgdQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    renderWithProviders(<HierarchyPage />)
    expect(screen.getByText(/failed to load hierarchy/i)).toBeTruthy()
  })

  it('renders view mode with level names', () => {
    renderWithProviders(<HierarchyPage />)
    expect(screen.getAllByText('State').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('District')).toBeTruthy()
    expect(screen.getByText('Zone')).toBeTruthy()
  })

  it('shows inline error when saving with empty level name', async () => {
    renderWithProviders(<HierarchyPage />)
    fireEvent.click(screen.getByLabelText(/edit hierarchy/i))

    // Clear the first LGD level name
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: '' } })

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByText(/cannot be empty/i)).toBeTruthy()
    })
    expect(mockSaveLgd).not.toHaveBeenCalled()
  })

  it('shows inline error for special characters in level name', async () => {
    renderWithProviders(<HierarchyPage />)
    fireEvent.click(screen.getByLabelText(/edit hierarchy/i))

    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: 'State@#$' } })

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByText(/Only letters, numbers, spaces, and hyphens/i)).toBeTruthy()
    })
    expect(mockSaveLgd).not.toHaveBeenCalled()
  })

  it('shows inline error for duplicate level names', async () => {
    renderWithProviders(<HierarchyPage />)
    fireEvent.click(screen.getByLabelText(/edit hierarchy/i))

    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: 'District' } })
    fireEvent.change(inputs[1], { target: { value: 'District' } })

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByText(/duplicate level names/i)).toBeTruthy()
    })
    expect(mockSaveLgd).not.toHaveBeenCalled()
  })

  it('shows inline error for HTML tags in level name', async () => {
    renderWithProviders(<HierarchyPage />)
    fireEvent.click(screen.getByLabelText(/edit hierarchy/i))

    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: '<script>alert(1)</script>' } })

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByText(/HTML tags are not allowed/i)).toBeTruthy()
    })
    expect(mockSaveLgd).not.toHaveBeenCalled()
  })

  it('clears errors on field change', async () => {
    renderWithProviders(<HierarchyPage />)
    fireEvent.click(screen.getByLabelText(/edit hierarchy/i))

    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: '' } })

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByText(/cannot be empty/i)).toBeTruthy()
    })

    fireEvent.change(inputs[0], { target: { value: 'Fixed' } })
    expect(screen.queryByText(/cannot be empty/i)).toBeNull()
  })

  it('saves successfully with valid data', async () => {
    mockSaveLgd.mockResolvedValue({})
    mockSaveDept.mockResolvedValue({})
    renderWithProviders(<HierarchyPage />)
    fireEvent.click(screen.getByLabelText(/edit hierarchy/i))

    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0]!, { target: { value: 'States' } })

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(mockSaveLgd).toHaveBeenCalled()
      expect(mockSaveDept).toHaveBeenCalled()
    })
  })

  describe('ONBOARDED tenant', () => {
    beforeEach(() => {
      mockTenantStatusQuery.mockReturnValue({ data: 'ONBOARDED' })
    })

    it('auto-enters edit mode on load', async () => {
      renderWithProviders(<HierarchyPage />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeTruthy()
      })
    })

    it('shows Next button when no changes have been made', async () => {
      renderWithProviders(<HierarchyPage />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^next$/i })).toBeTruthy()
      })
      expect(screen.queryByRole('button', { name: /save & next/i })).toBeNull()
    })

    it('shows Save & Next button when form has changes', async () => {
      renderWithProviders(<HierarchyPage />)
      await waitFor(() => screen.getByRole('button', { name: /^next$/i }))

      const inputs = screen.getAllByRole('textbox')
      fireEvent.change(inputs[0], { target: { value: 'NewStateName' } })

      expect(screen.getByRole('button', { name: /save & next/i })).toBeTruthy()
      expect(screen.queryByRole('button', { name: /^next$/i })).toBeNull()
    })

    it('navigates to Configuration on Next click', async () => {
      renderWithProviders(<HierarchyPage />)
      await waitFor(() => screen.getByRole('button', { name: /^next$/i }))

      fireEvent.click(screen.getByRole('button', { name: /^next$/i }))
      expect(mockNavigate).toHaveBeenCalledWith('/state-admin/configuration')
    })

    it('saves and navigates on Save & Next click', async () => {
      mockSaveLgd.mockResolvedValue({})
      mockSaveDept.mockResolvedValue({})
      renderWithProviders(<HierarchyPage />)
      await waitFor(() => screen.getByRole('button', { name: /^next$/i }))

      const inputs = screen.getAllByRole('textbox')
      fireEvent.change(inputs[0], { target: { value: 'NewStateName' } })

      fireEvent.click(screen.getByRole('button', { name: /save & next/i }))

      await waitFor(() => {
        expect(mockSaveLgd).toHaveBeenCalled()
        expect(mockSaveDept).toHaveBeenCalled()
        expect(mockNavigate).toHaveBeenCalledWith('/state-admin/configuration')
      })
    })
  })
})
