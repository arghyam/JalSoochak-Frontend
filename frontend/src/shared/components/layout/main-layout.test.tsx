import type { ReactElement } from 'react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import '@testing-library/jest-dom/jest-globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@/app/i18n'
import theme from '@/app/theme'
import { MainLayout } from './main-layout'

jest.mock('./sidebar', () => ({
  Sidebar: ({ onNavClick }: { onNavClick?: () => void }) => (
    <aside data-testid="sidebar-mock">
      <button type="button" onClick={onNavClick}>
        nav
      </button>
    </aside>
  ),
}))

function renderWithAppProviders(ui: ReactElement, initialEntries: string[] = ['/']) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider theme={theme}>{ui}</ChakraProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

function TestOutletPage() {
  return <div data-testid="outlet-child">Outlet route</div>
}

describe('MainLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders skip link with accessible text', () => {
    renderWithAppProviders(
      <MainLayout>
        <div>Page</div>
      </MainLayout>
    )

    expect(screen.getByRole('link', { name: /skip to main content/i })).toHaveAttribute(
      'href',
      '#main-content'
    )
  })

  it('renders main landmark and children when provided', () => {
    renderWithAppProviders(
      <MainLayout>
        <div data-testid="page-child">Custom child</div>
      </MainLayout>
    )

    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
    expect(screen.getByTestId('page-child')).toHaveTextContent('Custom child')
  })

  it('renders Outlet content when no children are passed', () => {
    renderWithAppProviders(
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/nested" element={<TestOutletPage />} />
        </Route>
      </Routes>,
      ['/nested']
    )

    expect(screen.getByTestId('outlet-child')).toHaveTextContent('Outlet route')
  })

  it('opens mobile menu when menu button is activated', async () => {
    const user = userEvent.setup()
    renderWithAppProviders(
      <MainLayout>
        <div>Page</div>
      </MainLayout>
    )

    const openMenu = screen.getByRole('button', { name: /open menu/i })
    await user.click(openMenu)

    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument()
  })
})
