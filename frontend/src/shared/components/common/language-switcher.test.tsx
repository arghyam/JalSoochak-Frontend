import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render-with-providers'
import { LanguageSwitcher } from './language-switcher'

const setLanguage = jest.fn()
jest.mock('@/app/store', () => ({
  useLanguageStore: () => ({
    currentLanguage: 'en',
    setLanguage,
    getSupportedLanguages: () => [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'hi', name: 'Hindi', nativeName: 'Hindi' },
    ],
  }),
}))

describe('LanguageSwitcher', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: jest.fn(),
    })
  })

  it('changes language on menu item click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LanguageSwitcher />)
    await user.click(screen.getByRole('button', { name: 'Change language' }))
    await user.click(screen.getAllByText('Hindi')[0])
    expect(setLanguage).toHaveBeenCalledWith('hi')
  })
})
