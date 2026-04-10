import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { PageHeader } from './page-header'

const matchMediaDescriptor = Object.getOwnPropertyDescriptor(window, 'matchMedia')

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
})

afterAll(() => {
  if (matchMediaDescriptor) {
    Object.defineProperty(window, 'matchMedia', matchMediaDescriptor)
  } else {
    delete (window as unknown as Record<string, unknown>).matchMedia
  }
})

jest.mock('./panel-switcher', () => ({
  PanelSwitcher: () => <div data-testid="panel-switcher-mock">Panel</div>,
}))

jest.mock('./language-switcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher-mock">Lang</div>,
}))

describe('PageHeader', () => {
  it('renders children and switcher region', () => {
    renderWithProviders(
      <PageHeader>
        <h1>Page title</h1>
      </PageHeader>
    )
    expect(screen.getByRole('heading', { name: /page title/i })).toBeInTheDocument()
    expect(screen.getByTestId('panel-switcher-mock')).toBeInTheDocument()
    expect(screen.getByTestId('language-switcher-mock')).toBeInTheDocument()
  })

  it('renders optional rightContent', () => {
    renderWithProviders(
      <PageHeader rightContent={<span data-testid="extra">Extra</span>}>
        <p>Main</p>
      </PageHeader>
    )
    expect(screen.getByTestId('extra')).toHaveTextContent('Extra')
  })
})
