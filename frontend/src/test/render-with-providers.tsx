import type { PropsWithChildren, ReactElement } from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@/app/i18n'
import theme from '@/app/theme'

function Providers({ children }: PropsWithChildren) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider theme={theme}>{children}</ChakraProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

export function renderWithProviders(ui: ReactElement) {
  return render(ui, { wrapper: Providers })
}
