import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { StatusChip } from './status-chip'

describe('StatusChip', () => {
  it('renders label for known status', () => {
    renderWithProviders(<StatusChip status="active" label="Active" />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders label for unknown status with default styling', () => {
    renderWithProviders(<StatusChip status="unknown-custom" label="Custom" />)
    expect(screen.getByText('Custom')).toBeInTheDocument()
  })
})
