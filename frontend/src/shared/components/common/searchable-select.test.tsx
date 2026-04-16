import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render-with-providers'
import { SearchableSelect } from './searchable-select'

describe('SearchableSelect', () => {
  it('opens options and selects value', async () => {
    const onChange = jest.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <SearchableSelect
        options={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
        ]}
        value=""
        onChange={onChange}
      />
    )
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('Beta'))
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('shows search input by default', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <SearchableSelect
        options={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
        ]}
        value=""
        onChange={jest.fn()}
      />
    )
    await user.click(screen.getByRole('combobox'))
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
  })

  it('hides search input when searchable is false', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <SearchableSelect
        options={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
        ]}
        value=""
        onChange={jest.fn()}
        searchable={false}
      />
    )
    await user.click(screen.getByRole('combobox'))
    expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument()
  })

  it('filters options when searching', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <SearchableSelect
        options={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
        ]}
        value=""
        onChange={jest.fn()}
      />
    )
    await user.click(screen.getByRole('combobox'))
    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'Beta')
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
  })
})
