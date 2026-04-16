import { screen } from '@testing-library/react'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { renderWithProviders } from './render-with-providers'

function ProbeComponent() {
  const location = useLocation()
  const { data } = useQuery({
    queryKey: ['probe-query'],
    queryFn: async () => 'ready',
  })

  return (
    <div>
      <span data-testid="route">{location.pathname}</span>
      <span data-testid="query-data">{data ?? 'pending'}</span>
    </div>
  )
}

describe('renderWithProviders', () => {
  it('provides router and react-query context', async () => {
    renderWithProviders(<ProbeComponent />)

    expect(screen.getByTestId('route')).toHaveTextContent('/')
    expect(await screen.findByText('ready')).toBeInTheDocument()
  })
})
