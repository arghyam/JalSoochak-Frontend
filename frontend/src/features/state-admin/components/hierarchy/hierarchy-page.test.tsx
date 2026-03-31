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
      expect(screen.getByText(/Only letters, numbers, and spaces/i)).toBeTruthy()
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

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(mockSaveLgd).toHaveBeenCalled()
      expect(mockSaveDept).toHaveBeenCalled()
    })
  })
})
