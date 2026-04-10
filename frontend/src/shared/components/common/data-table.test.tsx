import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render-with-providers'
import { DataTable } from './data-table'

type Row = { id: string; name: string }

const columns = [{ key: 'name', header: 'Name', sortable: true }] as const

const rows: Row[] = [
  { id: '1', name: 'Beta' },
  { id: '2', name: 'Alpha' },
]

describe('DataTable', () => {
  it('renders loading state', () => {
    renderWithProviders(
      <DataTable<Row> columns={[...columns]} data={rows} getRowKey={(r) => r.id} isLoading />
    )
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
  })

  it('renders empty state when no rows', () => {
    renderWithProviders(<DataTable<Row> columns={[...columns]} data={[]} getRowKey={(r) => r.id} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders rows and sorts when header clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <DataTable<Row> columns={[...columns]} data={rows} getRowKey={(r) => r.id} />
    )
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    await user.click(screen.getByRole('columnheader', { name: /name/i }))
    const cells = screen.getAllByRole('cell')
    expect(cells[0]).toHaveTextContent('Alpha')
  })

  it('calls onSort when provided instead of client sort', async () => {
    const onSort = jest.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <DataTable<Row> columns={[...columns]} data={rows} getRowKey={(r) => r.id} onSort={onSort} />
    )
    await user.click(screen.getByRole('columnheader', { name: /name/i }))
    expect(onSort).toHaveBeenCalledWith('name', 'asc')
  })
})
