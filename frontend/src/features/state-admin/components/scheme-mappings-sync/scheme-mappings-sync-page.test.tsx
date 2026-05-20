import { screen, waitFor } from '@testing-library/react'
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
    mockedQueries.useDownloadSchemeMappingsReportMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    } as never)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders title and empty state', () => {
    renderWithProviders(<SchemeMappingsSyncPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Scheme Mappings')
    expect(screen.getByText('No scheme mappings found')).toBeInTheDocument()
  })

  it('opens upload modal from toolbar action', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SchemeMappingsSyncPage />)
    await user.click(screen.getByRole('button', { name: /upload scheme mappings data/i }))
    expect(screen.getByText('Upload Modal Open')).toBeInTheDocument()
  })

  it('renders error state and retries query', async () => {
    const refetch = jest.fn()
    mockedQueries.useSchemeMappingsListQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    } as never)
    const user = userEvent.setup()

    renderWithProviders(<SchemeMappingsSyncPage />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  // ── Reports button ─────────────────────────────────────────────────────────

  it('renders Reports button', () => {
    renderWithProviders(<SchemeMappingsSyncPage />)
    expect(screen.getByText('Reports')).toBeInTheDocument()
  })

  it('calls mutate when Reports button is clicked', async () => {
    const mockMutate = jest.fn()
    mockedQueries.useDownloadSchemeMappingsReportMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as never)
    const user = userEvent.setup()
    renderWithProviders(<SchemeMappingsSyncPage />)
    await user.click(screen.getByText('Reports'))
    expect(mockMutate).toHaveBeenCalledTimes(1)
  })

  it('triggers file download on report success', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      blob: jest.fn().mockResolvedValue(new Blob(['csv'], { type: 'text/csv' })),
    })
    URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-mappings-url')
    URL.revokeObjectURL = jest.fn()

    const mockMutate = jest.fn(
      (_: unknown, { onSuccess }: { onSuccess: (link: string) => void }) => {
        onSuccess('https://example.com/mappings.csv')
      }
    )
    mockedQueries.useDownloadSchemeMappingsReportMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as never)

    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const appendSpy = jest.spyOn(document.body, 'appendChild')

    renderWithProviders(<SchemeMappingsSyncPage />)
    screen.getByText('Reports').click()

    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled())

    const anchor = appendSpy.mock.calls
      .map((c) => c[0] as HTMLElement)
      .find((el) => el.tagName === 'A') as HTMLAnchorElement | undefined

    expect(anchor).toBeDefined()
    expect(anchor!.download).toBe('scheme-mappings-report.csv')
    expect(clickSpy).toHaveBeenCalled()
    expect(globalThis.fetch).toHaveBeenCalledWith('https://example.com/mappings.csv')

    clickSpy.mockRestore()
    appendSpy.mockRestore()
  })

  it('renders Reports button in loading state while pending', () => {
    mockedQueries.useDownloadSchemeMappingsReportMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: true,
    } as never)
    renderWithProviders(<SchemeMappingsSyncPage />)
    expect(screen.getByLabelText('Download scheme mappings report')).toBeInTheDocument()
  })
})
