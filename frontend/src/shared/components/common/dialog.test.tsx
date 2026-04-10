import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render-with-providers'
import { Dialog } from './dialog'

describe('Dialog', () => {
  it('renders nothing when closed', () => {
    const { container } = renderWithProviders(
      <Dialog open={false} onClose={jest.fn()} title="T">
        <p>Body</p>
      </Dialog>
    )
    expect(container.textContent).toBe('')
  })

  it('renders title and content when open', () => {
    renderWithProviders(
      <Dialog open onClose={jest.fn()} title="Edit item">
        <p>Content</p>
      </Dialog>
    )
    expect(screen.getByText('Edit item')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('calls onClose when close button is activated', async () => {
    const onClose = jest.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <Dialog open onClose={onClose} title="T">
        <span>Inside</span>
      </Dialog>
    )
    await user.click(screen.getByRole('button', { name: /close dialog/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
