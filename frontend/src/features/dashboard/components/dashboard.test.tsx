import { screen } from '@testing-library/react'
import { describe, expect, it } from '@jest/globals'
import { renderWithProviders } from '@/test/render-with-providers'
import { Dashboard } from './dashboard'

describe('Dashboard', () => {
  it('renders placeholder heading and description', () => {
    renderWithProviders(<Dashboard />)

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy()
    expect(screen.getByText(/Dashboard content will be implemented here/i)).toBeTruthy()
  })
})
