import { screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { MessageTemplatesPage } from './message-templates-page'
import { renderWithProviders } from '@/test/render-with-providers'
import type { MessageTemplatesData } from '../../types/message-templates'

const mockUseMessageTemplatesQuery = jest.fn()

jest.mock('../../services/query/use-state-admin-queries', () => ({
  useMessageTemplatesQuery: () => mockUseMessageTemplatesQuery(),
}))

const mockData: MessageTemplatesData = {
  supportedLanguages: [
    { language: 'English', preference: 1 },
    { language: 'Hindi', preference: 2 },
  ],
  screens: {
    INTRO_MESSAGE: {
      prompt: null,
      options: null,
      reasons: null,
      confirmationTemplate: null,
      message: {
        en: 'Hello {name}, please send a clear meter reading image.',
        hi: 'नमस्ते {name}',
        ta: null,
        te: null,
        kn: null,
        ml: null,
        mr: null,
        gu: null,
        bn: null,
        pa: null,
        ur: null,
        or: null,
        as: null,
      },
    },
    ISSUE_REPORT: {
      prompt: {
        en: 'Please type your issue in a few words.',
        hi: null,
        ta: null,
        te: null,
        kn: null,
        ml: null,
        mr: null,
        gu: null,
        bn: null,
        pa: null,
        ur: null,
        or: null,
        as: null,
      },
      options: null,
      reasons: {
        REASON_1: {
          order: 1,
          label: {
            en: 'Meter Replaced',
            hi: null,
            ta: null,
            te: null,
            kn: null,
            ml: null,
            mr: null,
            gu: null,
            bn: null,
            pa: null,
            ur: null,
            or: null,
            as: null,
          },
        },
        REASON_2: {
          order: 2,
          label: {
            en: 'Meter not working',
            hi: null,
            ta: null,
            te: null,
            kn: null,
            ml: null,
            mr: null,
            gu: null,
            bn: null,
            pa: null,
            ur: null,
            or: null,
            as: null,
          },
        },
      },
      confirmationTemplate: {
        en: 'Issue reported. Thank you.',
        hi: null,
        ta: null,
        te: null,
        kn: null,
        ml: null,
        mr: null,
        gu: null,
        bn: null,
        pa: null,
        ur: null,
        or: null,
        as: null,
      },
      message: null,
    },
    CLOSING_MESSAGE: {
      prompt: null,
      options: null,
      reasons: null,
      confirmationTemplate: null,
      message: {
        en: null,
        hi: null,
        ta: null,
        te: null,
        kn: null,
        ml: null,
        mr: null,
        gu: null,
        bn: null,
        pa: null,
        ur: null,
        or: null,
        as: null,
      },
    },
  },
}

describe('MessageTemplatesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseMessageTemplatesQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
    })
  })

  it('renders loading state', () => {
    mockUseMessageTemplatesQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })
    renderWithProviders(<MessageTemplatesPage />)
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('renders error state', () => {
    mockUseMessageTemplatesQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })
    renderWithProviders(<MessageTemplatesPage />)
    expect(screen.getByText(/failed to load message templates/i)).toBeTruthy()
  })

  it('renders page title', () => {
    renderWithProviders(<MessageTemplatesPage />)
    expect(screen.getByText('Templates')).toBeTruthy()
  })

  it('renders language and template dropdowns', () => {
    renderWithProviders(<MessageTemplatesPage />)
    expect(screen.getByText('Language')).toBeTruthy()
    expect(screen.getByText('Template')).toBeTruthy()
  })

  it('shows language options from supported languages sorted by preference', () => {
    renderWithProviders(<MessageTemplatesPage />)
    const languageBtn = screen.getByLabelText('Select language')
    fireEvent.click(languageBtn)
    expect(screen.getByText('English')).toBeTruthy()
    expect(screen.getByText('Hindi')).toBeTruthy()
  })

  it('template dropdown is disabled before language is selected', () => {
    renderWithProviders(<MessageTemplatesPage />)
    const templateBtn = screen.getByLabelText('Select template')
    expect(
      templateBtn.getAttribute('disabled') !== null ||
        templateBtn.getAttribute('aria-disabled') === 'true'
    ).toBe(true)
  })

  it('renders message field for INTRO_MESSAGE + English selection', () => {
    renderWithProviders(<MessageTemplatesPage />)

    // Select language
    fireEvent.click(screen.getByLabelText('Select language'))
    fireEvent.click(screen.getByText('English'))

    // Select template
    fireEvent.click(screen.getByLabelText('Select template'))
    fireEvent.click(screen.getByText('Intro Message'))

    expect(
      screen.getByDisplayValue('Hello {name}, please send a clear meter reading image.')
    ).toBeTruthy()
  })

  it('renders prompt, reasons, and confirmationTemplate for ISSUE_REPORT + English', () => {
    renderWithProviders(<MessageTemplatesPage />)

    fireEvent.click(screen.getByLabelText('Select language'))
    fireEvent.click(screen.getByText('English'))

    fireEvent.click(screen.getByLabelText('Select template'))
    fireEvent.click(screen.getByText('Issue Report'))

    expect(screen.getByText('Prompt')).toBeTruthy()
    expect(screen.getByText('Reasons')).toBeTruthy()
    expect(screen.getByText('Confirmation Message')).toBeTruthy()
    expect(screen.getByText('Meter Replaced')).toBeTruthy()
    expect(screen.getByText('Meter not working')).toBeTruthy()
    expect(screen.getByDisplayValue('Issue reported. Thank you.')).toBeTruthy()
  })

  it('shows no-content message when all fields are null for selected language', () => {
    renderWithProviders(<MessageTemplatesPage />)

    fireEvent.click(screen.getByLabelText('Select language'))
    fireEvent.click(screen.getByText('Hindi'))

    fireEvent.click(screen.getByLabelText('Select template'))
    fireEvent.click(screen.getByText('Closing Message'))

    expect(screen.getByText(/no content available/i)).toBeTruthy()
  })

  it('resets template selection when language changes', () => {
    renderWithProviders(<MessageTemplatesPage />)

    fireEvent.click(screen.getByLabelText('Select language'))
    fireEvent.click(screen.getByText('English'))

    fireEvent.click(screen.getByLabelText('Select template'))
    fireEvent.click(screen.getByText('Intro Message'))

    // Change language — content panel should disappear
    fireEvent.click(screen.getByLabelText('Select language'))
    fireEvent.click(screen.getByText('Hindi'))

    expect(
      screen.queryByDisplayValue('Hello {name}, please send a clear meter reading image.')
    ).toBeNull()
  })
})
