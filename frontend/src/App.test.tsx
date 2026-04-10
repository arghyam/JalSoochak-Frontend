import { render, waitFor } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import type { ComponentProps } from 'react'
import App from './App'

const mockBootstrap = jest.fn<() => Promise<void>>().mockResolvedValue()

jest.mock('@/app/store', () => ({
  useAuthStore: (selector: (s: { bootstrap: typeof mockBootstrap }) => unknown) =>
    selector({ bootstrap: mockBootstrap }),
}))

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual<typeof import('react-router-dom')>('react-router-dom')
  const RouterProvider = (_props: ComponentProps<typeof actual.RouterProvider>) => (
    <div data-testid="router-provider" />
  )
  return {
    ...actual,
    RouterProvider,
  }
})

describe('App', () => {
  beforeEach(() => {
    mockBootstrap.mockClear()
  })

  it('bootstraps auth on mount and renders router inside providers', async () => {
    render(<App />)

    await waitFor(() => expect(mockBootstrap).toHaveBeenCalledTimes(1))
    expect(document.querySelector('[data-testid="router-provider"]')).toBeTruthy()
  })
})
