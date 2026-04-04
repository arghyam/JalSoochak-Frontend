import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { WaterNormsPage } from './water-norms-page'
import { renderWithProviders } from '@/test/render-with-providers'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockMutateAsync = jest.fn<(...args: any[]) => any>()
const mockQuery = jest.fn()

jest.mock('../../services/query/use-state-admin-queries', () => ({
  useWaterNormsConfigurationQuery: () => mockQuery(),
  useSaveWaterNormsConfigurationMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}))

const configuredData = {
  stateQuantity: 100,
  oversupplyThreshold: 20,
  undersupplyThreshold: 10,
  districtOverrides: [],
  isConfigured: true,
}

const unconfiguredData = {
  stateQuantity: 100,
  oversupplyThreshold: 20,
  undersupplyThreshold: 10,
  districtOverrides: [],
  isConfigured: false,
}

describe('WaterNormsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockQuery.mockReturnValue({
      data: unconfiguredData,
      isLoading: false,
      isError: false,
    })
  })

  it('renders loading state', () => {
    mockQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    renderWithProviders(<WaterNormsPage />)
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('renders error state', () => {
    mockQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    renderWithProviders(<WaterNormsPage />)
    expect(screen.getByText(/failed to load/i)).toBeTruthy()
  })

  it('renders view mode when configured', () => {
    mockQuery.mockReturnValue({
      data: configuredData,
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<WaterNormsPage />)
    expect(screen.getByText('100')).toBeTruthy()
  })

  it('renders edit form when unconfigured', () => {
    renderWithProviders(<WaterNormsPage />)
    expect(screen.getByRole('form')).toBeTruthy()
  })

  it('shows inline error for empty state quantity on save', async () => {
    renderWithProviders(<WaterNormsPage />)

    // Clear the pre-filled value
    const quantityInput = screen.getByLabelText(/enter.*quantity/i)
    fireEvent.change(quantityInput, { target: { value: '' } })

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/must be greater than 0/i)).toBeTruthy()
    })
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('shows inline error for state quantity <= 0', async () => {
    renderWithProviders(<WaterNormsPage />)

    const quantityInput = screen.getByLabelText(/enter.*quantity/i)
    fireEvent.change(quantityInput, { target: { value: '-5' } })

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/must be greater than 0/i)).toBeTruthy()
    })
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('clears inline error on field change', async () => {
    renderWithProviders(<WaterNormsPage />)

    const quantityInput = screen.getByLabelText(/enter.*quantity/i)
    fireEvent.change(quantityInput, { target: { value: '' } })

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/must be greater than 0/i)).toBeTruthy()
    })

    // Typing clears the error
    fireEvent.change(quantityInput, { target: { value: '50' } })

    await waitFor(() => {
      expect(screen.queryByText(/must be greater than 0/i)).toBeNull()
    })
  })

  it('calls mutateAsync with correct payload on valid save', async () => {
    mockMutateAsync.mockResolvedValue(configuredData)
    mockQuery.mockReturnValue({
      data: configuredData,
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<WaterNormsPage />)

    // Enter edit mode
    fireEvent.click(screen.getByLabelText(/edit/i))

    const oversupplyInput = screen.getByLabelText(/enter oversupply threshold/i)
    fireEvent.change(oversupplyInput, { target: { value: '21' } })

    await waitFor(() => {
      expect((oversupplyInput as HTMLInputElement).value).toBe('21')
    })

    const saveBtn = screen.getByRole('button', { name: /save changes/i })
    await waitFor(() => {
      const isDisabled =
        saveBtn.hasAttribute('disabled') || saveBtn.getAttribute('aria-disabled') === 'true'
      expect(isDisabled).toBe(false)
    })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        stateQuantity: 100,
        oversupplyThreshold: 21,
        undersupplyThreshold: 10,
        districtOverrides: [],
        isConfigured: true,
      })
    })
  })

  it('cancel clears validation errors', async () => {
    mockQuery.mockReturnValue({
      data: configuredData,
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<WaterNormsPage />)

    // Enter edit mode
    fireEvent.click(screen.getByLabelText(/edit/i))

    // Trigger an error
    const quantityInput = screen.getByLabelText(/enter.*quantity/i)
    fireEvent.change(quantityInput, { target: { value: '' } })
    fireEvent.click(screen.getByText(/save changes/i))

    await waitFor(() => {
      expect(screen.getByText(/must be greater than 0/i)).toBeTruthy()
    })

    // Cancel should clear errors
    fireEvent.click(screen.getByText(/cancel/i))

    // Re-enter edit mode
    fireEvent.click(screen.getByLabelText(/edit/i))
    expect(screen.queryByText(/must be greater than 0/i)).toBeNull()
  })
})
