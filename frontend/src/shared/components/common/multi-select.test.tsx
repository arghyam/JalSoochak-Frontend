import { fireEvent, screen } from '@testing-library/react'
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
    const onChange = jest.fn()
    renderWithProviders(<MultiSelect options={options} value={[]} onChange={onChange} />)
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(await screen.findByText('X'))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(['x'])
  })

  it('does not open when disabled', () => {
    const onChange = jest.fn()
    renderWithProviders(<MultiSelect options={options} value={[]} onChange={onChange} disabled />)
    const combobox = screen.getByRole('combobox')
    expect(combobox).toHaveAttribute('aria-disabled', 'true')
    expect(combobox).toBeDisabled()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
