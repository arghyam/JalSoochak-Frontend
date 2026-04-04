import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { ConfigurationPage } from './configuration-page'
import { renderWithProviders } from '@/test/render-with-providers'

const mockNavigate = jest.fn()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockMutateAsync = jest.fn<(...args: any[]) => any>()
const mockUseConfigurationQuery = jest.fn()
const mockUseSystemChannelsQuery = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual<typeof import('react-router-dom')>('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

jest.mock('../../services/query/use-state-admin-queries', () => ({
  useConfigurationQuery: () => mockUseConfigurationQuery(),
  useSaveConfigurationMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  useLogoQuery: () => ({ data: undefined, isLoading: false, isError: false }),
  useUpdateLogoMutation: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
  useSystemChannelsQuery: () => mockUseSystemChannelsQuery(),
}))

const defaultSupplyOutageReasons = [
  { id: 'PUMP_FAILURE', name: 'Pump Failure', isDefault: true, editable: true },
  { id: 'OTHERS', name: 'Others', isDefault: true, editable: false },
]

const configuredConfig = {
  id: '1',
  supportedChannels: ['IOT', 'MAN'],
  logoUrl: undefined,
  meterChangeReasons: [
    { id: 'r1', name: 'Meter Replaced' },
    { id: 'r2', name: 'Meter Not Working' },
  ],
  supplyOutageReasons: defaultSupplyOutageReasons,
  locationCheckRequired: true,
  displayDepartmentMaps: false,
  dataConsolidationTime: '08:00',
  pumpOperatorReminderNudgeTime: '09:00',
  dateFormatScreen: { dateFormat: null, timeFormat: null, timezone: null },
  dateFormatTable: { dateFormat: null, timeFormat: null, timezone: null },
  averageMembersPerHousehold: 4.5,
  isConfigured: true,
}

const unconfiguredConfig = {
  id: '',
  supportedChannels: [],
  logoUrl: undefined,
  meterChangeReasons: [
    { id: 'r1', name: 'Meter Replaced' },
    { id: 'r2', name: 'Meter Not Working' },
    { id: 'r3', name: 'Meter Damaged' },
  ],
  supplyOutageReasons: defaultSupplyOutageReasons,
  locationCheckRequired: false,
  displayDepartmentMaps: false,
  dataConsolidationTime: '',
  pumpOperatorReminderNudgeTime: '',
  dateFormatScreen: { dateFormat: null, timeFormat: null, timezone: null },
  dateFormatTable: { dateFormat: null, timeFormat: null, timezone: null },
  averageMembersPerHousehold: 0,
  isConfigured: false,
}

describe('ConfigurationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseConfigurationQuery.mockReturnValue({
      data: configuredConfig,
      isLoading: false,
      isError: false,
    })
    mockUseSystemChannelsQuery.mockReturnValue({
      data: ['BFM', 'ELM', 'PDU', 'IOT', 'MAN'],
      isLoading: false,
      isError: false,
    })
  })

  it('renders loading state', () => {
    mockUseConfigurationQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })
    renderWithProviders(<ConfigurationPage />)
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('renders error state', () => {
    mockUseConfigurationQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })
    renderWithProviders(<ConfigurationPage />)
    expect(screen.getByRole('heading', { name: /configuration/i })).toBeTruthy()
  })

  it('renders view mode when configured', () => {
    renderWithProviders(<ConfigurationPage />)

    expect(screen.getByText('Supported Channels')).toBeTruthy()
    expect(screen.getByText('Meter Change Reasons')).toBeTruthy()
    expect(screen.getByText('Record Location')).toBeTruthy()
  })

  it('shows configured values in view mode', () => {
    renderWithProviders(<ConfigurationPage />)

    expect(screen.getByText('IOT, Manual')).toBeTruthy()
    expect(screen.getByText('Meter Replaced')).toBeTruthy()
    expect(screen.getByText('Meter Not Working')).toBeTruthy()
    expect(screen.getByText('Yes')).toBeTruthy()
    expect(screen.getByText('08:00')).toBeTruthy()
  })

  it('renders edit form directly when not yet configured', () => {
    mockUseConfigurationQuery.mockReturnValue({
      data: unconfiguredConfig,
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<ConfigurationPage />)

    expect(screen.getByRole('form', { name: /configuration form/i })).toBeTruthy()
  })

  it('switches to edit mode when edit button is clicked', () => {
    renderWithProviders(<ConfigurationPage />)

    const editBtn = screen.getByRole('button', { name: /edit configuration/i })
    fireEvent.click(editBtn)

    expect(screen.getByRole('form', { name: /configuration form/i })).toBeTruthy()
  })

  it('cancel returns to view mode without saving', () => {
    renderWithProviders(<ConfigurationPage />)

    fireEvent.click(screen.getByRole('button', { name: /edit configuration/i }))
    expect(screen.getByRole('form', { name: /configuration form/i })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('form', { name: /configuration form/i })).toBeNull()
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('shows validation error when no channels are selected on save', async () => {
    mockUseConfigurationQuery.mockReturnValue({
      data: unconfiguredConfig,
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<ConfigurationPage />)

    fireEvent.click(screen.getByRole('button', { name: /save & next/i }))

    await waitFor(() => {
      expect(mockMutateAsync).not.toHaveBeenCalled()
    })
  })

  it('calls mutateAsync with correct payload on save', async () => {
    mockMutateAsync.mockResolvedValue({ ...configuredConfig })
    renderWithProviders(<ConfigurationPage />)

    fireEvent.click(screen.getByRole('button', { name: /edit configuration/i }))

    // Make a change so hasChanges becomes true (add BFM to existing selection)
    fireEvent.click(screen.getByRole('checkbox', { name: /bulk flow meter/i }))

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          supportedChannels: expect.arrayContaining(configuredConfig.supportedChannels),
          isConfigured: true,
        })
      )
    })
  })

  it('adds a new meter change reason', () => {
    mockUseConfigurationQuery.mockReturnValue({
      data: unconfiguredConfig,
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<ConfigurationPage />)

    // Click the first "+ Add New Reason" button (Meter Change Reasons section)
    fireEvent.click(screen.getAllByRole('button', { name: /add new reason/i })[0])

    // Find the newly added empty input (the one with no value yet)
    const inputs = screen.getAllByPlaceholderText(/enter reason/i)
    const newInput = inputs.find((el) => (el as HTMLInputElement).value === '')!
    fireEvent.change(newInput, { target: { value: 'New Reason' } })

    expect(screen.getByDisplayValue('New Reason')).toBeTruthy()
  })

  it('deletes an existing meter change reason', () => {
    mockUseConfigurationQuery.mockReturnValue({
      data: unconfiguredConfig,
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<ConfigurationPage />)

    expect(screen.getByDisplayValue('Meter Replaced')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /delete reason meter replaced/i }))
    expect(screen.queryByDisplayValue('Meter Replaced')).toBeNull()
  })

  it('rejects logo files larger than 2MB and does not update draft', () => {
    mockUseConfigurationQuery.mockReturnValue({
      data: unconfiguredConfig,
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<ConfigurationPage />)

    const fileInput = screen.getByLabelText(/upload logo/i)
    const oversizedFile = new File([''], 'large.png', { type: 'image/png' })
    Object.defineProperty(oversizedFile, 'size', { value: 3 * 1024 * 1024, configurable: true })
    fireEvent.change(fileInput, { target: { files: [oversizedFile] } })

    // Draft should not update — no logo preview should appear
    expect(screen.queryByRole('img', { name: /current logo/i })).toBeNull()
  })

  it('accepts logo files within the 2MB limit', () => {
    mockUseConfigurationQuery.mockReturnValue({
      data: unconfiguredConfig,
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<ConfigurationPage />)

    const fileInput = screen.getByLabelText(/upload logo/i)
    const validFile = new File([''], 'logo.png', { type: 'image/png' })
    Object.defineProperty(validFile, 'size', { value: 1 * 1024 * 1024, configurable: true })
    fireEvent.change(fileInput, { target: { files: [validFile] } })

    expect(screen.getByRole('img', { name: /current logo/i })).toBeTruthy()
  })

  it('shows inline error for no channels selected on save', async () => {
    mockUseConfigurationQuery.mockReturnValue({
      data: unconfiguredConfig,
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<ConfigurationPage />)

    fireEvent.click(screen.getByRole('button', { name: /save & next/i }))

    await waitFor(() => {
      expect(screen.getByText(/select at least one option/i)).toBeTruthy()
    })
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('shows inline error for empty meter change reason on save', async () => {
    mockUseConfigurationQuery.mockReturnValue({
      data: unconfiguredConfig,
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<ConfigurationPage />)

    // Add a new empty reason (first button = Meter Change Reasons section)
    fireEvent.click(screen.getAllByRole('button', { name: /add new reason/i })[0])

    // Select a channel so that validation passes for channels
    fireEvent.click(screen.getByText('IOT'))
    fireEvent.click(screen.getByRole('button', { name: /save & next/i }))

    await waitFor(() => {
      expect(screen.getByText(/cannot be empty/i)).toBeTruthy()
    })
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('shows inline error for special characters in meter change reason', async () => {
    mockUseConfigurationQuery.mockReturnValue({
      data: unconfiguredConfig,
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<ConfigurationPage />)

    const inputs = screen.getAllByPlaceholderText(/enter reason/i)
    fireEvent.change(inputs[0], { target: { value: 'Reason@#$' } })

    fireEvent.click(screen.getByText('IOT'))
    fireEvent.click(screen.getByRole('button', { name: /save & next/i }))

    await waitFor(() => {
      expect(screen.getByText(/Only letters, numbers, and spaces/i)).toBeTruthy()
    })
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('shows inline error for missing time fields on save', async () => {
    mockUseConfigurationQuery.mockReturnValue({
      data: unconfiguredConfig,
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<ConfigurationPage />)

    // Select a channel
    fireEvent.click(screen.getByText('IOT'))
    fireEvent.click(screen.getByRole('button', { name: /save & next/i }))

    await waitFor(() => {
      expect(screen.getAllByText(/please select a time/i).length).toBeGreaterThanOrEqual(1)
    })
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('shows inline error for average members <= 0 on save', async () => {
    mockUseConfigurationQuery.mockReturnValue({
      data: unconfiguredConfig,
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<ConfigurationPage />)

    fireEvent.click(screen.getByText('IOT'))
    fireEvent.click(screen.getByRole('button', { name: /save & next/i }))

    await waitFor(() => {
      expect(screen.getByText(/must be greater than 0/i)).toBeTruthy()
    })
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('clears inline error on field change', async () => {
    mockUseConfigurationQuery.mockReturnValue({
      data: unconfiguredConfig,
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<ConfigurationPage />)

    fireEvent.click(screen.getByRole('button', { name: /save & next/i }))

    await waitFor(() => {
      expect(screen.getByText(/select at least one option/i)).toBeTruthy()
    })

    fireEvent.click(screen.getByText('IOT'))
    expect(screen.queryByText(/select at least one option/i)).toBeNull()
  })

  it('renders degraded removed channels as disabled checkboxes with warning icon', () => {
    mockUseConfigurationQuery.mockReturnValue({
      data: {
        ...unconfiguredConfig,
        supportedChannels: ['BFM'],
        degraded: true,
        removedChannels: ['MAN'],
        isConfigured: true,
      },
      isLoading: false,
      isError: false,
    })

    // System channels API does not list 'MAN' — it was removed from system support
    mockUseSystemChannelsQuery.mockReturnValue({
      data: ['BFM', 'ELM', 'PDU', 'IOT'],
      isLoading: false,
      isError: false,
    })

    renderWithProviders(<ConfigurationPage />)

    fireEvent.click(screen.getByRole('button', { name: /edit configuration/i }))

    const manualCheckbox = screen.getByRole('checkbox', { name: /manual/i })
    expect((manualCheckbox as HTMLInputElement).disabled).toBe(true)
  })

  it('shows Save & Next button for unconfigured and Save Changes for reconfiguring', () => {
    // Unconfigured → "Save & Next"
    mockUseConfigurationQuery.mockReturnValue({
      data: unconfiguredConfig,
      isLoading: false,
      isError: false,
    })
    const { unmount } = renderWithProviders(<ConfigurationPage />)
    expect(screen.getByRole('button', { name: /save & next/i })).toBeTruthy()
    unmount()

    // Configured → click Edit → "Save Changes"
    mockUseConfigurationQuery.mockReturnValue({
      data: configuredConfig,
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<ConfigurationPage />)
    fireEvent.click(screen.getByRole('button', { name: /edit configuration/i }))
    expect(screen.getByRole('button', { name: /save changes/i })).toBeTruthy()
  })
})
