import '@testing-library/jest-dom/jest-globals'
import { describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render-with-providers'
import { SchemeStatusDimensionToggle } from './scheme-status-dimension-toggle'

describe('SchemeStatusDimensionToggle', () => {
  it('renders both dimension options with translated labels', () => {
    renderWithProviders(
      <SchemeStatusDimensionToggle value="operatingStatus" onChange={jest.fn()} />
    )

    expect(screen.getByText('Operating')).toBeTruthy()
    expect(screen.getByText('Work')).toBeTruthy()
  })

  it('marks the selected dimension as pressed', () => {
    renderWithProviders(
      <SchemeStatusDimensionToggle value="operatingStatus" onChange={jest.fn()} />
    )

    expect(screen.getByText('Operating').closest('button')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Work').closest('button')).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onChange with the other dimension when clicked', async () => {
    const onChange = jest.fn()
    const user = userEvent.setup()
    renderWithProviders(<SchemeStatusDimensionToggle value="operatingStatus" onChange={onChange} />)

    await user.click(screen.getByText('Work'))

    expect(onChange).toHaveBeenCalledWith('workStatus')
  })

  it('exposes the supplied aria-label on the group wrapper', () => {
    renderWithProviders(
      <SchemeStatusDimensionToggle
        value="operatingStatus"
        onChange={jest.fn()}
        ariaLabel="Scheme status breakdown"
      />
    )

    expect(screen.getByRole('group', { name: 'Scheme status breakdown' })).toBeTruthy()
  })
})
