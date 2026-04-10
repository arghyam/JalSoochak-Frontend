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
})
