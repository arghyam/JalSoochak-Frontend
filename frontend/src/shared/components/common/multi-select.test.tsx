import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { MultiSelect } from './multi-select'

describe('MultiSelect', () => {
  it('renders placeholder when no value is selected', () => {
    const onChange = jest.fn()
    renderWithProviders(
      <MultiSelect
        options={[
          { value: 'x', label: 'X' },
          { value: 'y', label: 'Y' },
        ]}
        value={[]}
        onChange={onChange}
      />
    )
    expect(screen.getByRole('combobox')).toHaveTextContent('Select')
  })
})
