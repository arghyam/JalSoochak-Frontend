import { render, screen } from '@testing-library/react'
import { describe, it, expect } from '@jest/globals'
import { SyncPageLayout } from './sync-page-layout'

describe('SyncPageLayout', () => {
  it('renders toolbar slot', () => {
    render(
      <SyncPageLayout
        toolbar={<div>toolbar content</div>}
        stats={<div>stats content</div>}
        table={<div>table content</div>}
      />
    )
    expect(screen.getByText('toolbar content')).toBeTruthy()
  })

  it('renders stats slot', () => {
    render(
      <SyncPageLayout
        toolbar={<div>toolbar content</div>}
        stats={<div>stats content</div>}
        table={<div>table content</div>}
      />
    )
    expect(screen.getByText('stats content')).toBeTruthy()
  })

  it('renders table slot', () => {
    render(
      <SyncPageLayout
        toolbar={<div>toolbar content</div>}
        stats={<div>stats content</div>}
        table={<div>table content</div>}
      />
    )
    expect(screen.getByText('table content')).toBeTruthy()
  })

  it('renders all three slots in document order: toolbar → stats → table', () => {
    render(
      <SyncPageLayout
        toolbar={<section data-testid="toolbar" />}
        stats={<section data-testid="stats" />}
        table={<section data-testid="table" />}
      />
    )

    const [toolbar, stats, table] = [
      screen.getByTestId('toolbar'),
      screen.getByTestId('stats'),
      screen.getByTestId('table'),
    ]

    expect(toolbar.compareDocumentPosition(stats) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(stats.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('renders without adding an extra wrapping DOM element', () => {
    const { container } = render(
      <SyncPageLayout
        toolbar={<div data-testid="toolbar" />}
        stats={<div data-testid="stats" />}
        table={<div data-testid="table" />}
      />
    )

    // The container is the default <div> injected by render().
    // Its direct children should be exactly the three slot elements — no extra wrapper.
    expect(container.firstElementChild?.getAttribute('data-testid')).toBe('toolbar')
  })

  it('renders null slots without throwing', () => {
    expect(() => render(<SyncPageLayout toolbar={null} stats={null} table={null} />)).not.toThrow()
  })
})
