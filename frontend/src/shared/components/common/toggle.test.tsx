import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render-with-providers'
import { Toggle } from './toggle'

describe('Toggle', () => {
  it('toggles and calls onChange', async () => {
    const onChange = jest.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <Toggle aria-label="Enable feature" isChecked={false} onChange={onChange} />
    )
    const ctrl = screen.getByRole('checkbox', { name: /enable feature/i })
    await user.click(ctrl)
    expect(onChange).toHaveBeenCalled()
  })

  it('respects disabled state', () => {
    renderWithProviders(<Toggle aria-label="Locked" isDisabled />)
    expect(screen.getByRole('checkbox', { name: /locked/i })).toBeDisabled()
  })
})
