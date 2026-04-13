import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render-with-providers'
import { MultiSelect } from './multi-select'

const options = [
  { value: 'x', label: 'X' },
  { value: 'y', label: 'Y' },
]

describe('MultiSelect', () => {
  it('renders placeholder when no value is selected', () => {
    const onChange = jest.fn()
    renderWithProviders(<MultiSelect options={options} value={[]} onChange={onChange} />)
    expect(screen.getByRole('combobox')).toHaveTextContent('Select')
  })

  it('shows single label when one value selected', () => {
    const onChange = jest.fn()
    renderWithProviders(<MultiSelect options={options} value={['x']} onChange={onChange} />)
    expect(screen.getByRole('combobox')).toHaveTextContent('X')
  })

  it('shows count when multiple values selected', () => {
    const onChange = jest.fn()
    renderWithProviders(<MultiSelect options={options} value={['x', 'y']} onChange={onChange} />)
    expect(screen.getByRole('combobox')).toHaveTextContent('2 selected')
  })

  it('opens list and selects an option', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    renderWithProviders(<MultiSelect options={options} value={[]} onChange={onChange} />)
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'X' }))
    expect(onChange).toHaveBeenCalledWith(['x'])
  })

  it('does not open when disabled', () => {
    const onChange = jest.fn()
    renderWithProviders(<MultiSelect options={options} value={[]} onChange={onChange} disabled />)
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-disabled', 'true')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
