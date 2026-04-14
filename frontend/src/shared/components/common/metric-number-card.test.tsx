import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { MetricNumberCard } from './metric-number-card'

describe('MetricNumberCard', () => {
  it('renders title, description, and notifies on input change', async () => {
    const onChange = jest.fn()
    renderWithProviders(
      <MetricNumberCard
        title="Threshold"
        description="Max value"
        value="10"
        onChange={onChange}
        descriptionId="desc-1"
        inputAriaLabel="Threshold input"
      />
    )
    expect(screen.getByRole('heading', { name: /threshold/i })).toBeInTheDocument()
    expect(screen.getByText('Max value')).toHaveAttribute('id', 'desc-1')
    const input = screen.getByRole('spinbutton', { name: /threshold input/i })
    expect(input).toHaveAttribute('aria-describedby', 'desc-1')
    fireEvent.change(input, { target: { value: '5' } })
    expect(onChange).toHaveBeenCalled()
  })

  it('uses article wrapper and card aria-label when requested', () => {
    renderWithProviders(
      <MetricNumberCard
        title="T"
        description="D"
        value=""
        onChange={jest.fn()}
        as="article"
        cardAriaLabel="Metric card"
      />
    )
    expect(screen.getByRole('article', { name: 'Metric card' })).toBeInTheDocument()
  })
})
