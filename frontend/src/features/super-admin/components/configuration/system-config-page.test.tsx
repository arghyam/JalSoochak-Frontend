import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { SystemConfigPage } from './system-config-page'
import { renderWithProviders } from '@/test/render-with-providers'
import type { SystemConfiguration } from '../../types/system-config'

const mockConfig: SystemConfiguration = {
  supportedChannels: ['BFM', 'MAN'],
  waterQuantityMaxThreshold: 100,
  waterQuantityMinThreshold: 80,
  bfmImageConfidenceThreshold: 89,
  locationAffinityThreshold: 78,
}

const mockUseSystemConfigurationQuery = jest.fn()
const mockUseSaveSystemConfigurationMutation = jest.fn()

jest.mock('../../services/query/use-super-admin-queries', () => ({
  useSystemConfigurationQuery: () => mockUseSystemConfigurationQuery(),
  useSaveSystemConfigurationMutation: () => mockUseSaveSystemConfigurationMutation(),
}))

describe('SystemConfigPage', () => {
  beforeEach(() => {
    mockUseSystemConfigurationQuery.mockReturnValue({
      data: mockConfig,
      isLoading: false,
      isError: false,
    })
    mockUseSaveSystemConfigurationMutation.mockReturnValue({
      mutateAsync: jest.fn<() => Promise<SystemConfiguration>>().mockResolvedValue(mockConfig),
      isPending: false,
    })
  })

  it('renders loading state', () => {
    mockUseSystemConfigurationQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })
    renderWithProviders(<SystemConfigPage />)
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('renders error state', () => {
    mockUseSystemConfigurationQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })
    renderWithProviders(<SystemConfigPage />)
    expect(screen.getByText(/failed to load/i)).toBeTruthy()
  })

  it('renders view mode with config data', () => {
    renderWithProviders(<SystemConfigPage />)
    expect(screen.getByText('Configuration')).toBeTruthy()
    expect(screen.getByText('BFM, MAN')).toBeTruthy()
    expect(screen.getByText('100')).toBeTruthy()
    expect(screen.getByText('89')).toBeTruthy()
    expect(screen.getByText('78')).toBeTruthy()
  })

  it('shows edit button in view mode', () => {
    renderWithProviders(<SystemConfigPage />)
    expect(screen.getByRole('button', { name: /edit configuration/i })).toBeTruthy()
  })

  it('clicking Edit enters edit mode with form', () => {
    renderWithProviders(<SystemConfigPage />)
    fireEvent.click(screen.getByRole('button', { name: /edit configuration/i }))
    expect(screen.getByRole('form', { name: /system configuration form/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /save changes/i })).toBeTruthy()
  })

  it('Cancel returns to view mode without saving', () => {
    renderWithProviders(<SystemConfigPage />)
    fireEvent.click(screen.getByRole('button', { name: /edit configuration/i }))
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.getByRole('button', { name: /edit configuration/i })).toBeTruthy()
    expect(screen.queryByRole('form')).toBeNull()
  })

  it('shows validation error when no channel is selected before save', async () => {
    renderWithProviders(<SystemConfigPage />)
    fireEvent.click(screen.getByRole('button', { name: /edit configuration/i }))

    // Uncheck all selected channels
    const bfmCheckbox = screen.getByRole('checkbox', { name: /BFM/i })
    const manCheckbox = screen.getByRole('checkbox', { name: /MAN/i })
    fireEvent.click(bfmCheckbox)
    fireEvent.click(manCheckbox)

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByText(/at least one supported channel must be selected/i)).toBeTruthy()
    })
  })

  it('calls save mutation and returns to view mode on success', async () => {
    const mutateAsync = jest.fn<() => Promise<SystemConfiguration>>().mockResolvedValue(mockConfig)
    mockUseSaveSystemConfigurationMutation.mockReturnValue({
      mutateAsync,
      isPending: false,
    })

    renderWithProviders(<SystemConfigPage />)
    fireEvent.click(screen.getByRole('button', { name: /edit configuration/i }))
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit configuration/i })).toBeTruthy()
    })
  })

  it('shows error toast when save mutation fails', async () => {
    mockUseSaveSystemConfigurationMutation.mockReturnValue({
      mutateAsync: jest
        .fn<() => Promise<SystemConfiguration>>()
        .mockRejectedValue(new Error('Network error')),
      isPending: false,
    })

    renderWithProviders(<SystemConfigPage />)
    fireEvent.click(screen.getByRole('button', { name: /edit configuration/i }))
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByText(/failed to save configuration/i)).toBeTruthy()
    })
  })
})
