import { render } from '@testing-library/react'
import { TotalStaffIcon, PumpOperatorIcon, TotalAdminsIcon } from './overview-icons'

describe('overview-icons', () => {
  it('renders TotalStaffIcon as svg', () => {
    const { container } = render(<TotalStaffIcon data-testid="total-staff" />)
    const svg = container.querySelector('svg[data-testid="total-staff"]')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('viewBox', '0 0 19 24')
  })

  it('renders PumpOperatorIcon as svg', () => {
    const { container } = render(<PumpOperatorIcon />)
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 21 24')
  })

  it('renders TotalAdminsIcon as svg', () => {
    const { container } = render(<TotalAdminsIcon />)
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 23 24')
  })
})
