import { act, screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { Toast } from './toast'

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  it('auto closes after duration', () => {
    const onClose = jest.fn()
    renderWithProviders(
      <Toast id="1" message="ok" type="success" onClose={onClose} duration={200} />
    )
    expect(screen.getByText('ok')).toBeInTheDocument()
    act(() => {
      jest.advanceTimersByTime(200)
    })
    expect(onClose).toHaveBeenCalledWith('1')
  })
})
