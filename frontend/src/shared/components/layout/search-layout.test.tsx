import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from '@jest/globals'
import { SearchLayout } from './search-layout'
import { renderWithProviders } from '@/test/render-with-providers'

describe('SearchLayout', () => {
  it('renders default search placeholder and download button', () => {
    renderWithProviders(<SearchLayout />)

    const searchInput = screen.getByPlaceholderText(
      'Search by state/UT, district, block, gram panchayat, village'
    )
    const downloadButton = screen.getByRole('button', { name: 'Download Report' })

    expect(searchInput).toBeTruthy()
    expect(downloadButton).toBeTruthy()
  })

  it('shows default and selected breadcrumb header states', () => {
    renderWithProviders(
      <SearchLayout
        breadcrumbPanelProps={{
          stateOptions: [{ value: 'telangana', label: 'Telangana' }],
          totalStatesCount: 36,
        }}
      />
    )

    const searchInput = screen.getByPlaceholderText(
      'Search by state/UT, district, block, gram panchayat, village'
    )

    fireEvent.focus(searchInput)
    expect(screen.getByText('States (36)')).toBeTruthy()
    expect(screen.getByText('All States/UTs')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Telangana' }))
    expect(screen.getByText('All States/UTs')).toBeTruthy()
    expect(screen.getAllByText('Telangana').length).toBeGreaterThan(0)
  })

  it('renders trail with last selected as chip', () => {
    renderWithProviders(<SearchLayout selectionTrail={['Telangana', 'Sangareddy']} />)

    expect(screen.getByText('Telangana')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Breadcrumb: Sangareddy' })).toBeTruthy()
  })

  it('does not render chip when external trail is empty', () => {
    renderWithProviders(
      <SearchLayout
        selectionTrail={[]}
        breadcrumbPanelProps={{
          stateOptions: [{ value: 'telangana', label: 'Telangana' }],
          totalStatesCount: 36,
        }}
      />
    )

    const searchInput = screen.getByPlaceholderText(
      'Search by state/UT, district, block, gram panchayat, village'
    )
    fireEvent.focus(searchInput)
    fireEvent.click(screen.getByRole('button', { name: 'Telangana' }))
    fireEvent.mouseDown(document.body)
    fireEvent.mouseUp(document.body)
    fireEvent.click(document.body)

    expect(screen.queryByRole('button', { name: 'Telangana' })).toBeNull()
  })

  it('hides trail while search panel is open and shows it again when closed', () => {
    renderWithProviders(
      <SearchLayout
        selectionTrail={['Telangana', 'Sangareddy']}
        breadcrumbPanelProps={{
          stateOptions: [{ value: 'telangana', label: 'Telangana' }],
          totalStatesCount: 36,
        }}
      />
    )

    const searchInput = screen.getByPlaceholderText(
      'Search by state/UT, district, block, gram panchayat, village'
    )

    expect(screen.getByTestId('search-trail-closed')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Breadcrumb: Sangareddy' })).toBeTruthy()

    fireEvent.focus(searchInput)
    expect(screen.queryByTestId('search-trail-closed')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Telangana' }))
    expect(screen.queryByTestId('search-trail-closed')).toBeNull()

    fireEvent.mouseDown(document.body)
    fireEvent.mouseUp(document.body)
    fireEvent.click(document.body)
    expect(screen.getByTestId('search-trail-closed')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Breadcrumb: Sangareddy' })).toBeTruthy()
  })

  it('does not render closed chips when active trail points to All States/UTs', () => {
    renderWithProviders(
      <SearchLayout selectionTrail={['Telangana', 'Sangareddy']} activeTrailIndex={-1} />
    )

    expect(screen.queryByTestId('search-trail-closed')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Breadcrumb: Telangana' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Breadcrumb: Sangareddy' })).toBeNull()
  })
})
