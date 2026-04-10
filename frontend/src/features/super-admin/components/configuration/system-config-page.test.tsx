import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { SystemConfigPage } from './system-config-page'
import { renderWithProviders } from '@/test/render-with-providers'
import type { SystemConfiguration } from '../../types/system-config'

const mockConfig: SystemConfiguration = {
  supportedChannels: ['Bulk Flow Meter', 'Manual'],
  // Archived for now, kept for future integration
  // oversupplyThreshold: 100,
  // undersupplyThreshold: 80,
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
    jest.clearAllMocks()
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
    expect(screen.getByText('Bulk Flow Meter, Manual')).toBeTruthy()
    // Archived for now, kept for future integration
    // expect(screen.getByText('100')).toBeTruthy()
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

    const bfmCheckbox = screen.getByRole('checkbox', { name: /bulk flow meter/i })
    const manCheckbox = screen.getByRole('checkbox', { name: /manual/i })
    fireEvent.click(bfmCheckbox)
    fireEvent.click(manCheckbox)

    await waitFor(() => {
      expect(bfmCheckbox.getAttribute('aria-checked')).toBe('false')
      expect(manCheckbox.getAttribute('aria-checked')).toBe('false')
    })

    fireEvent.submit(screen.getByRole('form', { name: /system configuration form/i }))

    expect(
      await screen.findByText(
        /at least one supported channel must be selected/i,
        {},
        { timeout: 3000 }
      )
    ).toBeTruthy()
  })

  it('calls save mutation and returns to view mode on success', async () => {
    const mutateAsync = jest.fn<() => Promise<SystemConfiguration>>().mockResolvedValue(mockConfig)
    mockUseSaveSystemConfigurationMutation.mockReturnValue({
      mutateAsync,
      isPending: false,
    })

    renderWithProviders(<SystemConfigPage />)
    fireEvent.click(screen.getByRole('button', { name: /edit configuration/i }))
    const locationInput = screen.getByRole('spinbutton', { name: /location affinity threshold/i })
    fireEvent.change(locationInput, { target: { value: '79' } })

    await waitFor(() => {
      expect((locationInput as HTMLInputElement).value).toBe('79')
    })

    fireEvent.submit(screen.getByRole('form', { name: /system configuration form/i }))

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit configuration/i })).toBeTruthy()
    })
  })

  it('rejects location affinity values above 1000', () => {
    renderWithProviders(<SystemConfigPage />)
    fireEvent.click(screen.getByRole('button', { name: /edit configuration/i }))
    const input = screen.getByRole('spinbutton', { name: /location affinity threshold/i })
    fireEvent.change(input, { target: { value: '1500' } })
    expect((input as HTMLInputElement).value).toBe('78')
  })

  it('accepts location affinity value at upper limit of 1000', () => {
    renderWithProviders(<SystemConfigPage />)
    fireEvent.click(screen.getByRole('button', { name: /edit configuration/i }))
    const input = screen.getByRole('spinbutton', { name: /location affinity threshold/i })
    fireEvent.change(input, { target: { value: '1000' } })
    expect((input as HTMLInputElement).value).toBe('1000')
  })

  // Archived for now, kept for future integration
  // it('rejects more than 4 decimal places on undersupply threshold', () => {
  //   renderWithProviders(<SystemConfigPage />)
  //   fireEvent.click(screen.getByRole('button', { name: /edit configuration/i }))
  //   const input = screen.getByRole('spinbutton', { name: /undersupply threshold/i })
  //   fireEvent.change(input, { target: { value: '10.12345' } })
  //   expect((input as HTMLInputElement).value).toBe('80')
  // })

  // it('accepts up to 4 decimal places on undersupply threshold', () => {
  //   renderWithProviders(<SystemConfigPage />)
  //   fireEvent.click(screen.getByRole('button', { name: /edit configuration/i }))
  //   const input = screen.getByRole('spinbutton', { name: /undersupply threshold/i })
  //   fireEvent.change(input, { target: { value: '10.1234' } })
  //   expect((input as HTMLInputElement).value).toBe('10.1234')
  // })

  it('rejects more than 4 decimal places on BFM confidence threshold', () => {
    renderWithProviders(<SystemConfigPage />)
    fireEvent.click(screen.getByRole('button', { name: /edit configuration/i }))
    const input = screen.getByRole('spinbutton', { name: /bfm image confidence threshold/i })
    fireEvent.change(input, { target: { value: '50.99999' } })
    expect((input as HTMLInputElement).value).toBe('89')
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
    const locationInput = screen.getByRole('spinbutton', { name: /location affinity threshold/i })
    fireEvent.change(locationInput, { target: { value: '79' } })

    await waitFor(() => {
      expect((locationInput as HTMLInputElement).value).toBe('79')
    })

    fireEvent.submit(screen.getByRole('form', { name: /system configuration form/i }))

    expect(
      await screen.findByText(/failed to save configuration/i, {}, { timeout: 3000 })
    ).toBeTruthy()
  })
})
