import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render-with-providers'
import { ChartInfoTooltip } from './chart-info-tooltip'

describe('ChartInfoTooltip', () => {
  it('renders the info icon button', () => {
    renderWithProviders(<ChartInfoTooltip tooltipContent={<span>Info text</span>} />)
    expect(screen.getByRole('button', { name: 'More info' })).toBeInTheDocument()
  })

  it('uses the provided ariaLabel', () => {
    renderWithProviders(
      <ChartInfoTooltip tooltipContent={<span>Info</span>} ariaLabel="Regularity info" />
    )
    expect(screen.getByRole('button', { name: 'Regularity info' })).toBeInTheDocument()
  })

  it('shows tooltip content on hover', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <ChartInfoTooltip tooltipContent={<span>Formula detail</span>} ariaLabel="Formula" />
    )
    await user.hover(screen.getByRole('button', { name: 'Formula' }))
    expect(await screen.findByText('Formula detail')).toBeInTheDocument()
  })
})
