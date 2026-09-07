import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { GlossaryPage } from './glossary-page'

describe('GlossaryPage', () => {
  it('renders the scheme status glossary entry with both dimension definitions', () => {
    renderWithProviders(<GlossaryPage />)

    expect(screen.getByText('Schemes by Status')).toBeTruthy()
    expect(
      screen.getByText(
        'Count of schemes grouped by their recorded status. Use the toggle on the card to switch between work status and operating status.'
      )
    ).toBeTruthy()
    expect(screen.getByText('Work Status:')).toBeTruthy()
    expect(screen.getByText('Operating Status:')).toBeTruthy()
  })

  it('no longer renders the retired active/non-active scheme wording', () => {
    renderWithProviders(<GlossaryPage />)

    expect(screen.queryByText('Active Schemes')).toBeNull()
    expect(screen.queryByText(/Non-active Schemes/)).toBeNull()
  })
})
