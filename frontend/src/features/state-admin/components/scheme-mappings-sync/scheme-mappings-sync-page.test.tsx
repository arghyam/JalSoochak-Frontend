import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render-with-providers'
import { SchemeMappingsSyncPage } from './scheme-mappings-sync-page'
import * as queries from '../../services/query/use-state-admin-queries'
import { useAuthStore } from '@/app/store/auth-store'

jest.mock('../../services/query/use-state-admin-queries')
jest.mock('@/app/store/auth-store')
jest.mock('./upload-scheme-mappings-modal', () => ({
  UploadSchemeMappingsModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div>Upload Modal Open</div> : null,
}))

const mockedQueries = queries as jest.Mocked<typeof queries>
const mockedUseAuthStore = useAuthStore as unknown as jest.Mock

describe('SchemeMappingsSyncPage', () => {
  beforeEach(() => {
    mockedUseAuthStore.mockReturnValue('TN')
    mockedQueries.useSchemeMappingsListQuery.mockReturnValue({
      data: { items: [], totalElements: 0 },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as never)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders title and empty state', () => {
    renderWithProviders(<SchemeMappingsSyncPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Scheme Mappings Sync')
    expect(screen.getByText('No scheme mappings found')).toBeInTheDocument()
  })

  it('opens upload modal from toolbar action', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SchemeMappingsSyncPage />)
    await user.click(screen.getByRole('button', { name: /upload scheme mappings data/i }))
    expect(screen.getByText('Upload Modal Open')).toBeInTheDocument()
  })
})
