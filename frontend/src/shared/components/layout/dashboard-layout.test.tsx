import type { ReactElement } from 'react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import '@testing-library/jest-dom/jest-globals'
import { render, screen } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import theme from '@/app/theme'
import { DashboardLayout } from './dashboard-layout'

jest.mock('./header', () => ({
  Header: () => <header data-testid="dashboard-header">Header</header>,
}))

jest.mock('./footer', () => ({
  Footer: () => <footer data-testid="dashboard-footer">Footer</footer>,
}))

function renderWithChakra(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>{ui}</ChakraProvider>
    </QueryClientProvider>
  )
}

describe('DashboardLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders header, main content, and footer in order', () => {
    renderWithChakra(
      <DashboardLayout>
        <div data-testid="page-body">Dashboard body</div>
      </DashboardLayout>
    )

    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument()
    expect(screen.getByTestId('page-body')).toHaveTextContent('Dashboard body')
    expect(screen.getByTestId('dashboard-footer')).toBeInTheDocument()

    const main = screen.getByRole('main')
    expect(main).toContainElement(screen.getByTestId('page-body'))
  })
})
