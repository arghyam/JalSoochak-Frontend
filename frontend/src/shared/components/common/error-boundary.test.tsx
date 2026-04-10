import type { ReactNode } from 'react'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { ErrorBoundary } from './error-boundary'

function Boom(): ReactNode {
  throw new Error('unit-test-boom')
}

describe('ErrorBoundary', () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

  afterAll(() => {
    consoleError.mockRestore()
  })

  afterEach(() => {
    consoleError.mockClear()
  })

  it('renders fallback UI when child throws', () => {
    renderWithProviders(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    )
    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    renderWithProviders(
      <ErrorBoundary fallback={<p>Custom error</p>}>
        <Boom />
      </ErrorBoundary>
    )
    expect(screen.getByText('Custom error')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /something went wrong/i })).not.toBeInTheDocument()
  })
})
