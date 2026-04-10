import { describe, expect, it } from '@jest/globals'
import '@testing-library/jest-dom/jest-globals'
import { render, screen } from '@testing-library/react'
import { useQueryClient } from '@tanstack/react-query'
import { queryClient } from '@/shared/lib/query-client'
import { QueryProvider } from './query-provider'

function QueryClientProbe() {
  const client = useQueryClient()
  return <div data-testid="client-probe">{client === queryClient ? 'shared' : 'other'}</div>
}

describe('QueryProvider', () => {
  it('provides the shared query client instance', () => {
    render(
      <QueryProvider>
        <QueryClientProbe />
      </QueryProvider>
    )

    expect(screen.getByTestId('client-probe')).toHaveTextContent('shared')
  })
})
