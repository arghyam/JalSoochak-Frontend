import { screen } from '@testing-library/react'
import { AuthSideImage } from './auth-side-image'
import { renderWithProviders } from '@/test/render-with-providers'

describe('AuthSideImage', () => {
  it('renders banner image when visible', () => {
    renderWithProviders(<AuthSideImage isVisible />)
    expect(screen.queryByAltText('JalSoochak banner')).toBeInTheDocument()
  })

  it('renders nothing when not visible', () => {
    renderWithProviders(<AuthSideImage isVisible={false} />)
    expect(screen.queryByAltText('JalSoochak banner')).not.toBeInTheDocument()
  })

  it('defaults to visible', () => {
    renderWithProviders(<AuthSideImage />)
    expect(screen.getByAltText('JalSoochak banner')).toBeInTheDocument()
  })
})
