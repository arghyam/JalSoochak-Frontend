import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { ToastContainer } from './toast-container'

describe('ToastContainer', () => {
  it('renders all toast messages', () => {
    renderWithProviders(
      <ToastContainer
        toasts={[
          { id: '1', message: 'Saved', type: 'success' },
          { id: '2', message: 'Failed', type: 'error' },
        ]}
        onRemove={jest.fn()}
      />
    )
    expect(screen.getByText('Saved')).toBeInTheDocument()
    expect(screen.getByText('Failed')).toBeInTheDocument()
  })
})
