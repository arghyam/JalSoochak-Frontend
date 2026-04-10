import { screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import '@/app/i18n'
import theme from '@/app/theme'
import { ROUTES } from '@/shared/constants/routes'
import { SessionExpiredPage } from './session-expired'

function renderAtPath(ui: ReactElement, path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <MemoryRouter initialEntries={[path]}>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider theme={theme}>{ui}</ChakraProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('SessionExpiredPage', () => {
  it('links to staff login when path is under /staff', () => {
    renderAtPath(<SessionExpiredPage />, '/staff/overview')
    const link = screen.getByRole('link', { name: /go to login/i })
    expect(link).toHaveAttribute('href', ROUTES.STAFF_LOGIN)
  })

  it('links to standard login when path is not staff', () => {
    renderAtPath(<SessionExpiredPage />, '/state-admin')
    const link = screen.getByRole('link', { name: /go to login/i })
    expect(link).toHaveAttribute('href', ROUTES.LOGIN)
  })

  it('renders session expired heading and copy', () => {
    renderAtPath(<SessionExpiredPage />, '/')
    expect(screen.getByRole('heading', { name: /session expired/i })).toBeInTheDocument()
    expect(screen.getByText(/jalsoochak/i)).toBeInTheDocument()
  })
})
