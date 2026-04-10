import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render-with-providers'
import { UploadStaffModal } from './upload-staff-modal'
import * as queryHooks from '../../services/query/use-state-admin-queries'
import { useAuthStore } from '@/app/store/auth-store'

jest.mock('../../services/query/use-state-admin-queries')
jest.mock('@/app/store/auth-store')
jest.mock('@/shared/hooks/use-toast', () => ({
  useToast: () => ({
    toasts: [],
    removeToast: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  }),
}))
jest.mock('@/shared/components/common', () => ({
  UploadFileModal: ({ onSubmit }: { onSubmit: (f: File) => void }) => (
    <button type="button" onClick={() => onSubmit(new File(['x'], 'staff.xls'))}>
      submit-upload
    </button>
  ),
  ToastContainer: () => null,
}))

const mockedHooks = queryHooks as jest.Mocked<typeof queryHooks>
const mockedAuthStore = useAuthStore as unknown as jest.Mock

const fakeAuthStoreState = { user: { tenantCode: 'TN' as string | undefined } }

describe('UploadStaffModal', () => {
  beforeEach(() => {
    mockedAuthStore.mockImplementation((selector: (s: typeof fakeAuthStoreState) => unknown) =>
      selector(fakeAuthStoreState)
    )
  })

  it('submits file with tenant code from auth store', async () => {
    const mutate = jest.fn()
    mockedHooks.useUploadPumpOperatorsMutation.mockReturnValue({
      mutate,
      isPending: false,
    } as never)
    const user = userEvent.setup()
    renderWithProviders(<UploadStaffModal isOpen onClose={jest.fn()} />)
    await user.click(screen.getByRole('button', { name: 'submit-upload' }))
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ tenantCode: 'TN', file: expect.any(File) }),
      expect.any(Object)
    )
  })
})
