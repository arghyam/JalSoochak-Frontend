import { fireEvent, screen } from '@testing-library/react'
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

const originalScrollToDescriptor = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'scrollTo'
)

describe('LanguageSwitcher', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: jest.fn(),
    })
  })

  afterAll(() => {
    if (originalScrollToDescriptor) {
      Object.defineProperty(HTMLElement.prototype, 'scrollTo', originalScrollToDescriptor)
      return
    }
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: undefined,
    })
  })

  it('changes language on menu item click', async () => {
    renderWithProviders(<LanguageSwitcher />)
    fireEvent.click(screen.getByRole('button', { name: 'Change language' }))
    fireEvent.click(await screen.findByRole('menuitem', { name: /hindi hindi/i }))
    expect(setLanguage).toHaveBeenCalledWith('hi')
  })
})
