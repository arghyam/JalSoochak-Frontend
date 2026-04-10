import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render-with-providers'
import { EditableBreadcrumb } from './editable-breadcrumb'

describe('EditableBreadcrumb', () => {
  it('renders nothing when not editing', () => {
    renderWithProviders(
      <EditableBreadcrumb
        isEditing={false}
        onCancel={jest.fn()}
        viewLabel="List"
        editLabel="Edit"
      />
    )
    expect(screen.queryByRole('navigation', { name: /breadcrumb/i })).not.toBeInTheDocument()
  })

  it('renders nav with cancel and current page when editing', async () => {
    const onCancel = jest.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <EditableBreadcrumb isEditing onCancel={onCancel} viewLabel="Users" editLabel="Add user" />
    )
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument()
    expect(screen.getByText('Add user')).toHaveAttribute('aria-current', 'page')
    await user.click(screen.getByRole('button', { name: /users/i }))
    expect(onCancel).toHaveBeenCalled()
  })
})
