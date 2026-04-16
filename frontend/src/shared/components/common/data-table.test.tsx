import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render-with-providers'
import { DataTable } from './data-table'

type Row = {
  id: string
  name: string
  age: number
  createdAt: Date
  meta: { rank: string }
}

const columns = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'age', header: 'Age', sortable: true },
  {
    key: 'createdAt',
    header: 'Created At',
    sortable: true,
    render: (r: Row) => r.createdAt.toISOString(),
  },
  { key: 'meta', header: 'Meta', sortable: true },
] as const

const rows: Row[] = [
  {
    id: '1',
    name: 'Beta',
    age: 32,
    createdAt: new Date('2024-02-01T00:00:00.000Z'),
    meta: { rank: 'b' },
  },
  {
    id: '2',
    name: 'Alpha',
    age: 25,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    meta: { rank: 'a' },
  },
  {
    id: '3',
    name: 'Gamma',
    age: 27,
    createdAt: new Date('2024-03-01T00:00:00.000Z'),
    meta: { rank: 'c' },
  },
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
    await user.click(screen.getByRole('columnheader', { name: /name/i }))
    const cells = screen.getAllByRole('cell')
    expect(cells[0]).toHaveTextContent('Alpha')
  })

  it('cycles sorting directions on repeated clicks', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <DataTable<Row> columns={[...columns]} data={rows} getRowKey={(r) => r.id} />
    )

    const nameHeader = screen.getByRole('columnheader', { name: /name/i })
    await user.click(nameHeader)
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')
    await user.click(nameHeader)
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending')
    await user.click(nameHeader)
    expect(nameHeader).not.toHaveAttribute('aria-sort')
  })

  it('supports keyboard sorting on Enter and Space', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <DataTable<Row> columns={[...columns]} data={rows} getRowKey={(r) => r.id} />
    )
    const ageHeader = screen.getByRole('columnheader', { name: /age/i })
    ageHeader.focus()

    await user.keyboard('{Enter}')
    expect(ageHeader).toHaveAttribute('aria-sort', 'ascending')
    await user.keyboard(' ')
    expect(ageHeader).toHaveAttribute('aria-sort', 'descending')
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

  it('uses controlled sort props for aria-sort state', () => {
    renderWithProviders(
      <DataTable<Row>
        columns={[...columns]}
        data={rows}
        getRowKey={(r) => r.id}
        sortColumn="name"
        sortDirection="desc"
      />
    )
    expect(screen.getByRole('columnheader', { name: /name/i })).toHaveAttribute(
      'aria-sort',
      'descending'
    )
  })

  it('sorts number, date and fallback object fields', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <DataTable<Row> columns={[...columns]} data={rows} getRowKey={(r) => r.id} />
    )

    await user.click(screen.getByRole('columnheader', { name: /age/i }))
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Alpha')

    await user.click(screen.getByRole('columnheader', { name: /created at/i }))
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('2024-01-01')

    await user.click(screen.getByRole('columnheader', { name: /meta/i }))
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('[object Object]')
  })

  it('handles client pagination and page-size changes', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <DataTable<Row>
        columns={[...columns]}
        data={rows}
        getRowKey={(r) => r.id}
        pagination={{ enabled: true, pageSize: 1, pageSizeOptions: [1, 2, 3] }}
      />
    )

    expect(screen.getByText('Beta')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByText('Alpha')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /items per page: 1/i }))
    await user.click(await screen.findByRole('menuitem', { name: '2' }))
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText('Alpha')).toBeInTheDocument()
  })

  it('handles controlled pagination callbacks', async () => {
    const user = userEvent.setup()
    const onPageChange = jest.fn()
    const onPageSizeChange = jest.fn()
    renderWithProviders(
      <DataTable<Row>
        columns={[...columns]}
        data={[rows[0]]}
        getRowKey={(r) => r.id}
        pagination={{
          enabled: true,
          page: 2,
          pageSize: 10,
          totalItems: 35,
          onPageChange,
          onPageSizeChange,
          pageSizeOptions: [10, 25],
        }}
      />
    )

    await user.click(screen.getByRole('button', { name: /previous/i }))
    expect(onPageChange).toHaveBeenCalledWith(1)
    await user.click(screen.getByRole('button', { name: /items per page: 10/i }))
    await user.click(await screen.findByRole('menuitem', { name: '25' }))
    expect(onPageSizeChange).toHaveBeenCalledWith(25)
  })
})
