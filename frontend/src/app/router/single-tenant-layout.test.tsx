import { screen } from '@testing-library/react'
import { describe, expect, it, jest } from '@jest/globals'
import { renderWithProviders } from '@/test/render-with-providers'
import { SingleTenantLayout } from './single-tenant-layout'

jest.mock('./single-tenant-gate', () => ({
  SingleTenantGate: () => <div data-testid="single-tenant-gate" />,
}))

describe('SingleTenantLayout', () => {
  it('renders the lazy single tenant gate after loading', async () => {
    renderWithProviders(<SingleTenantLayout />)

    expect(await screen.findByTestId('single-tenant-gate')).toBeTruthy()
  })
})
