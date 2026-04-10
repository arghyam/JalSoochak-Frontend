import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render-with-providers'
import { UploadFileModal } from './upload-file-modal'

describe('UploadFileModal', () => {
  it('calls onSubmit after selecting a file', async () => {
    const onSubmit = jest.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <UploadFileModal
        isOpen
        onClose={jest.fn()}
        title="Upload"
        description="desc"
        isPending={false}
        onSubmit={onSubmit}
      />
    )

    const input = document.querySelector('input[type="file"]')
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('File input element not found in UploadFileModal')
    }
    await user.upload(input, new File(['x'], 'sample.xls'))
    await user.click(screen.getByRole('button', { name: 'Upload' }))
    expect(onSubmit).toHaveBeenCalledWith(expect.any(File))
  })
})
