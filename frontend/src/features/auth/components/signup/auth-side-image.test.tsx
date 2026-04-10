import { screen } from '@testing-library/react'
import { AuthSideImage } from './auth-side-image'
import { renderWithProviders } from '@/test/render-with-providers'

describe('AuthSideImage', () => {
  it('renders banner image when visible', () => {
    const { container } = renderWithProviders(<AuthSideImage isVisible />)
    const img = container.querySelector('img[alt="JalSoochak banner"]')
    expect(img).toBeTruthy()
  })

  it('renders nothing when not visible', () => {
    renderWithProviders(<AuthSideImage isVisible={false} />)
    expect(screen.queryByAltText('JalSoochak banner')).not.toBeInTheDocument()
  })

  it('defaults to visible', () => {
    const { container } = renderWithProviders(<AuthSideImage />)
    expect(container.querySelector('img[alt="JalSoochak banner"]')).toBeTruthy()
  })
})
