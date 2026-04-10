import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { ActionTooltip } from './action-tooltip'

describe('ActionTooltip', () => {
  it('renders child and shows label when open', () => {
    renderWithProviders(
      <ActionTooltip label="Save changes" isOpen>
        <button type="button">Save</button>
      </ActionTooltip>
    )
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    expect(screen.getByText('Save changes')).toBeInTheDocument()
  })
})
