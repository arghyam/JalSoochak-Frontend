import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render-with-providers'
import { ViewBySelect } from './view-by-select'

describe('ViewBySelect', () => {
  it('shows geography by default and calls onChange when time is picked', async () => {
    const onChange = jest.fn()
    const user = userEvent.setup()
    renderWithProviders(<ViewBySelect value="geography" onChange={onChange} ariaLabel="View by" />)
    const btn = screen.getByRole('button', { name: /view by/i })
    expect(btn).toHaveTextContent(/geography/i)
    await user.click(btn)
    await user.click(screen.getByText(/^time$/i))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith('time')
  })

  it('does not open menu when disabled', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <ViewBySelect value="time" onChange={jest.fn()} ariaLabel="View by metric" disabled />
    )
    const btn = screen.getByRole('button', { name: /view by metric/i })
    expect(btn).toBeDisabled()
    await user.click(btn)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
