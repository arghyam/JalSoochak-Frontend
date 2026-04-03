import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { IntegrationPage } from './integration-page'
import { renderWithProviders } from '@/test/render-with-providers'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockMutateAsync = jest.fn<(...args: any[]) => any>()
const mockUseIntegrationConfigurationQuery = jest.fn()

jest.mock('../../services/query/use-state-admin-queries', () => ({
  useIntegrationConfigurationQuery: () => mockUseIntegrationConfigurationQuery(),
  useSaveIntegrationConfigurationMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}))

async function clickSaveChangesWhenReady() {
  await waitFor(() => {
    const btn = screen.getByRole('button', { name: /save changes/i })
    const isDisabled = btn.hasAttribute('disabled') || btn.getAttribute('aria-disabled') === 'true'
    expect(isDisabled).toBe(false)
  })
  fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
}

async function clickSaveAndNextWhenReady() {
  await waitFor(() => {
    const btn = screen.getByRole('button', { name: /save.*next/i })
    const isDisabled = btn.hasAttribute('disabled') || btn.getAttribute('aria-disabled') === 'true'
    expect(isDisabled).toBe(false)
  })
  fireEvent.click(screen.getByRole('button', { name: /save.*next/i }))
}

const configuredConfig = {
  id: 'tenant-1',
  apiUrl: 'https://api.example.com',
  apiKey: 'secret-key',
  organizationId: 'org-123',
  isConfigured: true,
}

const emptyConfig = {
  id: '',
  apiUrl: '',
  apiKey: '',
  organizationId: '',
  isConfigured: false,
}

describe('IntegrationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseIntegrationConfigurationQuery.mockReturnValue({
      data: configuredConfig,
      isLoading: false,
      isError: false,
    })
  })

  it('renders loading state', () => {
    mockUseIntegrationConfigurationQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })
    renderWithProviders(<IntegrationPage />)
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('renders error state', () => {
    mockUseIntegrationConfigurationQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })
    renderWithProviders(<IntegrationPage />)
    expect(screen.getByText(/failed to load configuration/i)).toBeTruthy()
  })

  it('renders all three form field labels', () => {
    renderWithProviders(<IntegrationPage />)
    expect(screen.getByText('API URL')).toBeTruthy()
    expect(screen.getByText('API Key')).toBeTruthy()
    expect(screen.getByText('Organization ID')).toBeTruthy()
  })

  it('renders Message Broker Details section heading', () => {
    renderWithProviders(<IntegrationPage />)
    expect(screen.getByText('Message Broker Details')).toBeTruthy()
  })

  it('pre-fills inputs with fetched config values', () => {
    renderWithProviders(<IntegrationPage />)
    expect(screen.getByDisplayValue('https://api.example.com')).toBeTruthy()
    expect(screen.getByDisplayValue('org-123')).toBeTruthy()
  })

  it('save button is disabled when there are no changes', () => {
    renderWithProviders(<IntegrationPage />)
    const saveBtn = screen.getByRole('button', { name: /save changes/i })
    expect(
      saveBtn.getAttribute('disabled') !== null || saveBtn.getAttribute('aria-disabled') === 'true'
    ).toBe(true)
  })

  it('save button is disabled when fields are empty', () => {
    mockUseIntegrationConfigurationQuery.mockReturnValue({
      data: emptyConfig,
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<IntegrationPage />)
    const saveBtn = screen.getByRole('button', { name: /save.*next/i })
    expect(
      saveBtn.getAttribute('disabled') !== null || saveBtn.getAttribute('aria-disabled') === 'true'
    ).toBe(true)
  })

  it('save button becomes enabled after changing a field', () => {
    renderWithProviders(<IntegrationPage />)
    const apiUrlInput = screen.getByDisplayValue('https://api.example.com')
    fireEvent.change(apiUrlInput, { target: { value: 'https://new-api.example.com' } })
    const saveBtn = screen.getByRole('button', { name: /save changes/i })
    expect(
      saveBtn.getAttribute('disabled') === null && saveBtn.getAttribute('aria-disabled') !== 'true'
    ).toBe(true)
  })

  it('cancel resets form to fetched values', () => {
    renderWithProviders(<IntegrationPage />)
    const apiUrlInput = screen.getByDisplayValue('https://api.example.com')
    fireEvent.change(apiUrlInput, { target: { value: 'https://changed.com' } })
    expect(screen.getByDisplayValue('https://changed.com')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.getByDisplayValue('https://api.example.com')).toBeTruthy()
  })

  it('calls mutateAsync with correct payload on save', async () => {
    mockMutateAsync.mockResolvedValue({ ...configuredConfig, apiUrl: 'https://new.example.com' })
    renderWithProviders(<IntegrationPage />)

    const apiUrlInput = screen.getByDisplayValue('https://api.example.com')
    fireEvent.change(apiUrlInput, { target: { value: 'https://new.example.com' } })

    await clickSaveChangesWhenReady()

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        apiUrl: 'https://new.example.com',
        apiKey: 'secret-key',
        organizationId: 'org-123',
      })
    })
  })

  it('shows inline error for spaces in API URL on save', async () => {
    renderWithProviders(<IntegrationPage />)
    const apiUrlInput = screen.getByDisplayValue('https://api.example.com')
    fireEvent.change(apiUrlInput, { target: { value: 'https://api.example.com/path with spaces' } })

    await clickSaveChangesWhenReady()

    await waitFor(() => {
      expect(screen.getByText(/spaces are not allowed/i)).toBeTruthy()
    })
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('shows inline error for invalid URL format on save', async () => {
    renderWithProviders(<IntegrationPage />)
    const apiUrlInput = screen.getByDisplayValue('https://api.example.com')
    fireEvent.change(apiUrlInput, { target: { value: 'not-a-url' } })

    await clickSaveChangesWhenReady()

    await waitFor(() => {
      expect(screen.getByText(/URL must start with https:\/\/ exactly once/i)).toBeTruthy()
    })
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('shows inline error for HTML tags in organization ID', async () => {
    renderWithProviders(<IntegrationPage />)
    const orgInput = screen.getByDisplayValue('org-123')
    fireEvent.change(orgInput, { target: { value: '<script>alert(1)</script>' } })

    await clickSaveChangesWhenReady()

    await waitFor(() => {
      expect(screen.getByText(/HTML tags are not allowed/i)).toBeTruthy()
    })
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('shows inline error for SQL injection in organization ID', async () => {
    renderWithProviders(<IntegrationPage />)
    const orgInput = screen.getByDisplayValue('org-123')
    fireEvent.change(orgInput, { target: { value: "'; DROP TABLE users;--" } })

    await clickSaveChangesWhenReady()

    await waitFor(() => {
      expect(screen.getByText(/invalid characters detected/i)).toBeTruthy()
    })
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('shows required error for empty API key when unconfigured', async () => {
    mockUseIntegrationConfigurationQuery.mockReturnValue({
      data: emptyConfig,
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<IntegrationPage />)

    const apiUrlInput = screen.getByLabelText(/enter api url/i)
    fireEvent.change(apiUrlInput, { target: { value: 'https://api.example.com' } })
    const orgInput = screen.getByLabelText(/enter organization id/i)
    fireEvent.change(orgInput, { target: { value: 'org123' } })

    await clickSaveAndNextWhenReady()

    await waitFor(() => {
      expect(screen.getByText(/this field is required/i)).toBeTruthy()
    })
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('clears inline error when user modifies the field', async () => {
    renderWithProviders(<IntegrationPage />)
    const apiUrlInput = screen.getByDisplayValue('https://api.example.com')
    fireEvent.change(apiUrlInput, { target: { value: 'not-a-url' } })

    await clickSaveChangesWhenReady()

    await waitFor(() => {
      expect(screen.getByText(/URL must start with https:\/\/ exactly once/i)).toBeTruthy()
    })

    fireEvent.change(apiUrlInput, { target: { value: 'https://fixed.example.com' } })
    expect(screen.queryByText(/URL must start with https:\/\/ exactly once/i)).toBeNull()
  })

  it('cancel clears validation errors', async () => {
    renderWithProviders(<IntegrationPage />)
    const apiUrlInput = screen.getByDisplayValue('https://api.example.com')
    fireEvent.change(apiUrlInput, { target: { value: 'bad-url' } })

    await clickSaveChangesWhenReady()

    await waitFor(() => {
      expect(screen.getByText(/URL must start with https:\/\/ exactly once/i)).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByText(/URL must start with https:\/\/ exactly once/i)).toBeNull()
  })
})
