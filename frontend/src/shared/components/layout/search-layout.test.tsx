import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from '@jest/globals'
import { SearchLayout } from './search-layout'
import { renderWithProviders } from '@/test/render-with-providers'

describe('SearchLayout', () => {
  const getSearchInput = () => screen.getByRole('textbox')

  it('renders default search placeholder and download button', () => {
    renderWithProviders(<SearchLayout />)

    const searchInput = getSearchInput()
    const downloadButton = screen.getByRole('button', { name: 'Download Report' })

    expect(searchInput).toBeTruthy()
    expect(searchInput.getAttribute('placeholder')).toBe('Search')
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

    const searchInput = getSearchInput()

    fireEvent.focus(searchInput)
    expect(screen.getByText('States (36)')).toBeTruthy()
    expect(screen.getByText('All States/UTs')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Telangana' }))
    expect(screen.getByText('All States/UTs')).toBeTruthy()
    expect(screen.getAllByText('Telangana').length).toBeGreaterThan(0)
  })

  it('renders trail with last selected as chip', () => {
    renderWithProviders(<SearchLayout selectionTrail={['Telangana', 'Sangareddy']} />)

    const activeBreadcrumb = screen.getByRole('button', { name: 'Breadcrumb: Sangareddy' })
    const previousBreadcrumb = screen.getByRole('button', { name: 'Breadcrumb: Telangana' })

    expect(screen.getByText('Telangana')).toBeTruthy()
    expect(activeBreadcrumb).toBeTruthy()
    expect(activeBreadcrumb.getAttribute('aria-current')).toBe('page')
    expect(previousBreadcrumb.hasAttribute('aria-current')).toBe(false)
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

    const searchInput = getSearchInput()
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

    const searchInput = getSearchInput()

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

  it('renders closed trail slot only while the search panel is closed', () => {
    renderWithProviders(
      <SearchLayout
        selectionTrail={['Telangana', 'Sangareddy']}
        closedTrailSlot={<button type="button">Clear</button>}
        breadcrumbPanelProps={{
          stateOptions: [{ value: 'telangana', label: 'Telangana' }],
          totalStatesCount: 36,
        }}
      />
    )

    const searchInput = getSearchInput()

    expect(screen.getByRole('button', { name: 'Clear' })).toBeTruthy()

    fireEvent.focus(searchInput)
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull()

    fireEvent.click(screen.getByTestId('search-dropdown-close'))
    expect(screen.getByRole('button', { name: 'Clear' })).toBeTruthy()
  })

  it('closes dropdown when close icon is clicked', () => {
    renderWithProviders(
      <SearchLayout
        breadcrumbPanelProps={{
          stateOptions: [{ value: 'telangana', label: 'Telangana' }],
          totalStatesCount: 36,
        }}
      />
    )

    const searchInput = getSearchInput()
    fireEvent.focus(searchInput)

    expect(screen.getByTestId('search-dropdown-close')).toBeTruthy()
    fireEvent.click(screen.getByTestId('search-dropdown-close'))
    expect(screen.queryByTestId('search-dropdown-close')).toBeNull()
  })

  it('does not render closed chips when active trail points to All States/UTs', () => {
    renderWithProviders(
      <SearchLayout selectionTrail={['Telangana', 'Sangareddy']} activeTrailIndex={-1} />
    )

    expect(screen.queryByTestId('search-trail-closed')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Breadcrumb: Telangana' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Breadcrumb: Sangareddy' })).toBeNull()
  })

  it('normalizes uppercase option labels before rendering', () => {
    renderWithProviders(
      <SearchLayout
        breadcrumbPanelProps={{
          stateOptions: [{ value: 'ganesh-pur-jaipong', label: 'GANESH PUR (JAIPONG)' }],
          totalStatesCount: 1,
        }}
      />
    )

    const searchInput = screen.getByPlaceholderText(
      'Search by state/UT, district, block, gram panchayat, village'
    )

    fireEvent.focus(searchInput)

    expect(screen.getByRole('button', { name: 'Ganesh Pur (Jaipong)' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'GANESH PUR (JAIPONG)' })).toBeNull()
  })
})
