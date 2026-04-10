import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render-with-providers'
import { ConfirmationDialog } from './confirmation-dialog'

describe('ConfirmationDialog', () => {
  it('confirms and cancels', async () => {
    const onClose = jest.fn()
    const onConfirm = jest.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <ConfirmationDialog
        open
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete?"
        message="This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Keep"
      />
    )
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^keep$/i }))
    expect(onClose).toHaveBeenCalled()
    onClose.mockClear()
    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    expect(onConfirm).toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('disables actions while loading', () => {
    renderWithProviders(
      <ConfirmationDialog
        open
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        title="T"
        message="M"
        isLoading
      />
    )
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled()
  })
})
