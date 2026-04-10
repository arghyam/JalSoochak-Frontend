import { renderWithProviders } from '@/test/render-with-providers'
import { CalendarIcon } from './calendar-icon'

describe('CalendarIcon', () => {
  it('renders svg with path', () => {
    const { container } = renderWithProviders(<CalendarIcon data-testid="cal" aria-hidden />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg?.querySelector('path')).toBeInTheDocument()
  })
})
