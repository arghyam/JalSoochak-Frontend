import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { LanguagePage } from './language-page'
import { renderWithProviders } from '@/test/render-with-providers'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockMutateAsync = jest.fn<(...args: any[]) => any>()
const mockUseLanguageConfigurationQuery = jest.fn()

jest.mock('../../services/query/use-state-admin-queries', () => ({
  useLanguageConfigurationQuery: () => mockUseLanguageConfigurationQuery(),
  useSaveLanguageConfigurationMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}))

const configuredConfig = {
  id: '1',
  primaryLanguage: 'hindi',
  secondaryLanguage: 'english',
  tertiaryLanguage: 'telugu',
  isConfigured: true,
}

const unconfiguredConfig = {
  id: '',
  primaryLanguage: '',
  secondaryLanguage: '',
  tertiaryLanguage: '',
  isConfigured: false,
}

describe('LanguagePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLanguageConfigurationQuery.mockReturnValue({
      data: configuredConfig,
      isLoading: false,
      isError: false,
    })
  })

  it('renders loading state', () => {
    mockUseLanguageConfigurationQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })
    renderWithProviders(<LanguagePage />)
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('renders error state', () => {
    mockUseLanguageConfigurationQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })
    renderWithProviders(<LanguagePage />)
    expect(screen.getByRole('heading', { name: /language/i })).toBeTruthy()
  })

  it('renders view mode with all three language values when configured', () => {
    renderWithProviders(<LanguagePage />)

    expect(screen.getByText('Primary Language')).toBeTruthy()
    expect(screen.getByText('Secondary Language (optional)')).toBeTruthy()
    expect(screen.getByText('Tertiary Language (optional)')).toBeTruthy()
    expect(screen.getByText('हिंदी')).toBeTruthy()
    expect(screen.getByText('English')).toBeTruthy()
    expect(screen.getByText('తెలుగు')).toBeTruthy()
  })

  it('shows "-" for unset optional languages in view mode', () => {
    mockUseLanguageConfigurationQuery.mockReturnValue({
      data: { ...configuredConfig, secondaryLanguage: undefined, tertiaryLanguage: undefined },
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<LanguagePage />)

    const dashes = screen.getAllByText('-')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  it('switches to edit mode when edit button is clicked', () => {
    renderWithProviders(<LanguagePage />)

    const editBtn = screen.getByRole('button', { name: /edit language configuration/i })
    fireEvent.click(editBtn)

    expect(screen.getByRole('combobox', { name: /select primary language/i })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: /select secondary language/i })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: /select tertiary language/i })).toBeTruthy()
  })

  it('renders edit form directly when not yet configured', () => {
    mockUseLanguageConfigurationQuery.mockReturnValue({
      data: unconfiguredConfig,
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<LanguagePage />)

    expect(screen.getByRole('combobox', { name: /select primary language/i })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: /select secondary language/i })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: /select tertiary language/i })).toBeTruthy()
  })

  it('save button is disabled when primary language is empty', () => {
    mockUseLanguageConfigurationQuery.mockReturnValue({
      data: unconfiguredConfig,
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<LanguagePage />)

    const saveBtn = screen.getByRole('button', { name: /save.*next/i })
    expect(saveBtn).toBeTruthy()
    // Button has isDisabled — Chakra renders aria-disabled
    expect(
      saveBtn.getAttribute('disabled') !== null || saveBtn.getAttribute('aria-disabled') === 'true'
    ).toBe(true)
  })

  it('cancel resets draft and returns to view mode', () => {
    renderWithProviders(<LanguagePage />)

    fireEvent.click(screen.getByRole('button', { name: /edit language configuration/i }))
    expect(screen.getByRole('combobox', { name: /select primary language/i })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('combobox', { name: /select primary language/i })).toBeNull()
  })

  it('excludes already-selected languages from other dropdowns options', () => {
    // configured: primary=hindi, secondary=english, tertiary=telugu
    renderWithProviders(<LanguagePage />)
    fireEvent.click(screen.getByRole('button', { name: /edit language configuration/i }))

    // Open primary dropdown — should not offer english (secondary) or telugu (tertiary)
    fireEvent.click(screen.getByRole('combobox', { name: /select primary language/i }))
    expect(screen.queryByRole('option', { name: 'English' })).toBeNull()
    expect(screen.queryByRole('option', { name: 'తెలుగు' })).toBeNull()
    expect(screen.getByRole('option', { name: 'हिंदी' })).toBeTruthy()

    // Close primary, open secondary — should not offer hindi (primary) or telugu (tertiary)
    fireEvent.click(screen.getByRole('combobox', { name: /select primary language/i }))
    fireEvent.click(screen.getByRole('combobox', { name: /select secondary language/i }))
    expect(screen.queryByRole('option', { name: 'हिंदी' })).toBeNull()
    expect(screen.queryByRole('option', { name: 'తెలుగు' })).toBeNull()
    expect(screen.getByRole('option', { name: 'English' })).toBeTruthy()

    // Close secondary, open tertiary — should not offer hindi (primary) or english (secondary)
    fireEvent.click(screen.getByRole('combobox', { name: /select secondary language/i }))
    fireEvent.click(screen.getByRole('combobox', { name: /select tertiary language/i }))
    expect(screen.queryByRole('option', { name: 'हिंदी' })).toBeNull()
    expect(screen.queryByRole('option', { name: 'English' })).toBeNull()
    expect(screen.getByRole('option', { name: 'తెలుగు' })).toBeTruthy()
  })

  it('calls mutateAsync with tertiaryLanguage on save', async () => {
    mockMutateAsync.mockResolvedValue(configuredConfig)
    renderWithProviders(<LanguagePage />)

    fireEvent.click(screen.getByRole('button', { name: /edit language configuration/i }))

    fireEvent.click(screen.getByRole('combobox', { name: /select secondary language/i }))
    fireEvent.click(screen.getByRole('option', { name: 'বাংলা' }))

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await screen.findByRole('button', { name: /edit language configuration/i })

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          primaryLanguage: 'hindi',
          secondaryLanguage: 'bengali',
          tertiaryLanguage: 'telugu',
          isConfigured: true,
        })
      )
    })
  })
})
