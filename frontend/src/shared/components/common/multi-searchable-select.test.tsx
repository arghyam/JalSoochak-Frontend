import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render-with-providers'
import { MultiSearchableSelect } from './multi-searchable-select'

describe('MultiSearchableSelect', () => {
  it('shows placeholder when empty and toggles option', async () => {
    const onChange = jest.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <MultiSearchableSelect
        options={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
        ]}
        value={[]}
        onChange={onChange}
      />
    )
    expect(screen.getByRole('combobox')).toHaveTextContent('Select')
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('Beta'))
    expect(onChange).toHaveBeenCalledWith(['b'])
  })

  it('shows count label when multiple values selected', () => {
    renderWithProviders(
      <MultiSearchableSelect
        options={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
        ]}
        value={['a', 'b']}
        onChange={jest.fn()}
      />
    )
    expect(screen.getByRole('combobox')).toHaveTextContent('2 selected')
  })

  it('shows no results when options empty', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MultiSearchableSelect options={[]} value={[]} onChange={jest.fn()} />)
    await user.click(screen.getByRole('combobox'))
    expect(screen.getByRole('status')).toHaveTextContent(/no results/i)
  })
})
