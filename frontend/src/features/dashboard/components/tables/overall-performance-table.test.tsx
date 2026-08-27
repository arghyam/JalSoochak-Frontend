import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, jest } from '@jest/globals'
import { renderWithProviders } from '@/test/render-with-providers'
import type { EntityPerformance } from '../../types'
import { OverallPerformanceTable } from './overall-performance-table'

const tableData: EntityPerformance[] = [
  {
    id: 's1',
    name: 'Alpha',
    coverage: 65,
    regularity: 70,
    continuity: 0,
    quantity: 52,
    compositeScore: 62,
    status: 'needs-attention',
    households: 97681,
  },
  {
    id: 's2',
    name: 'Beta',
    coverage: 88,
    regularity: 82,
    continuity: 0,
    quantity: 68,
    compositeScore: 79,
    status: 'good',
    households: 1200,
  },
  {
    id: 's3',
    name: 'Gamma',
    coverage: 41,
    regularity: 91,
    continuity: 0,
    quantity: 45,
    compositeScore: 59,
    status: 'critical',
    households: 45000,
  },
]

function getStateOrder(container: HTMLElement) {
  return Array.from(container.querySelectorAll('tbody tr td:first-child')).map((cell) =>
    cell.textContent?.trim()
  )
}

describe('OverallPerformanceTable', () => {
  it('renders a no data state when there are no rows', () => {
    renderWithProviders(<OverallPerformanceTable data={[]} />)

    expect(screen.getByText('No data available')).toBeTruthy()
    expect(screen.queryAllByRole('columnheader')).toHaveLength(0)
  })

  it('renders only the 5 expected columns', () => {
    renderWithProviders(<OverallPerformanceTable data={tableData} />)

    expect(screen.getByText('State/UT')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Quantity (MLD)' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Quantity (LPCD)' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Regularity (%)' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Household' })).toBeTruthy()
    expect(screen.queryByText('Average (%)')).toBeNull()

    const headerOrder = screen
      .getAllByRole('columnheader')
      .map((header) => header.textContent?.replace(/\s+/g, ' ').trim())
    expect(headerOrder).toEqual([
      'State/UT',
      'Regularity (%)',
      'Quantity (MLD)',
      'Quantity (LPCD)',
      'Household',
    ])
  })

  it('sizes the table to its container and caps the entity name column', () => {
    const { container } = renderWithProviders(<OverallPerformanceTable data={tableData} />)
    const table = container.querySelector('table') as HTMLElement
    const [nameHeader, ...metricHeaders] = screen.getAllByRole('columnheader')

    // A max-content table can never shrink, which forces horizontal scroll even
    // when the card is wide enough for the content.
    expect(window.getComputedStyle(table).width).not.toBe('max-content')
    expect(window.getComputedStyle(nameHeader).width).toBe('30%')
    metricHeaders.forEach((header) => {
      expect(window.getComputedStyle(header).width).toBe('')
      expect(window.getComputedStyle(header).verticalAlign).toBe('top')
    })
  })

  it('wraps metric column headers while keeping the sort indicator on the first line', () => {
    renderWithProviders(<OverallPerformanceTable data={tableData} />)

    const header = screen.getByRole('button', { name: 'Quantity (MLD)' })
    const label = header.firstElementChild as HTMLElement

    expect(window.getComputedStyle(label).whiteSpace).toBe('normal')
    // The indicator is a sibling of the wrapping label, top-aligned, so it stays
    // beside the first line rather than following the wrapped unit down.
    expect(label.tagName).toBe('SPAN')
    expect(header.lastElementChild?.tagName.toLowerCase()).toBe('svg')
    expect(window.getComputedStyle(header).alignItems).toBe('flex-start')
  })

  it('defaults to sorting by Regularity in descending order', () => {
    const { container } = renderWithProviders(<OverallPerformanceTable data={tableData} />)
    const regularityButton = screen.getByRole('button', { name: 'Regularity (%)' })

    expect(getStateOrder(container)).toEqual(['Gamma', 'Beta', 'Alpha'])
    expect(regularityButton.closest('th')?.getAttribute('aria-sort')).toBe('descending')
  })

  it('renders quantity (MLD) values without a percent sign', () => {
    renderWithProviders(<OverallPerformanceTable data={tableData} />)

    expect(screen.getByText('65.0')).toBeTruthy()
    expect(screen.queryByText('65.0%')).toBeNull()
    expect(screen.getByText('70.0%')).toBeTruthy()
  })

  it('sorts by Quantity (MLD) descending then ascending on repeated clicks', () => {
    const { container } = renderWithProviders(<OverallPerformanceTable data={tableData} />)
    const quantityMldButton = screen.getByRole('button', { name: 'Quantity (MLD)' })

    fireEvent.click(quantityMldButton)
    expect(getStateOrder(container)).toEqual(['Beta', 'Alpha', 'Gamma'])
    expect(quantityMldButton.closest('th')?.getAttribute('aria-sort')).toBe('descending')

    fireEvent.click(quantityMldButton)
    expect(getStateOrder(container)).toEqual(['Gamma', 'Alpha', 'Beta'])
    expect(quantityMldButton.closest('th')?.getAttribute('aria-sort')).toBe('ascending')
  })

  it('sorts by Quantity (LPCD) and Regularity when their headers are clicked', () => {
    const { container } = renderWithProviders(<OverallPerformanceTable data={tableData} />)
    const quantityLpcdButton = screen.getByRole('button', { name: 'Quantity (LPCD)' })
    const regularityButton = screen.getByRole('button', { name: 'Regularity (%)' })

    fireEvent.click(quantityLpcdButton)
    expect(getStateOrder(container)).toEqual(['Beta', 'Alpha', 'Gamma'])
    expect(quantityLpcdButton.closest('th')?.getAttribute('aria-sort')).toBe('descending')

    fireEvent.click(regularityButton)
    expect(getStateOrder(container)).toEqual(['Gamma', 'Beta', 'Alpha'])
    expect(regularityButton.closest('th')?.getAttribute('aria-sort')).toBe('descending')
    expect(quantityLpcdButton.closest('th')?.getAttribute('aria-sort')).toBeNull()
  })

  it('renders the household count formatted with locale grouping', () => {
    const { container } = renderWithProviders(<OverallPerformanceTable data={tableData} />)

    const householdCells = Array.from(container.querySelectorAll('tbody tr td:last-child')).map(
      (cell) => cell.textContent?.trim()
    )

    expect(householdCells).toEqual(['45,000', '1,200', '97,681'])
  })

  it('renders a dash when the household count is unavailable', () => {
    const { container } = renderWithProviders(
      <OverallPerformanceTable data={[{ ...tableData[0], households: undefined }]} />
    )

    expect(container.querySelector('tbody tr td:last-child')?.textContent?.trim()).toBe('-')
  })

  it('sorts by Household descending then ascending on repeated clicks', () => {
    const { container } = renderWithProviders(<OverallPerformanceTable data={tableData} />)
    const householdButton = screen.getByRole('button', { name: 'Household' })

    fireEvent.click(householdButton)
    expect(getStateOrder(container)).toEqual(['Alpha', 'Gamma', 'Beta'])
    expect(householdButton.closest('th')?.getAttribute('aria-sort')).toBe('descending')

    fireEvent.click(householdButton)
    expect(getStateOrder(container)).toEqual(['Beta', 'Gamma', 'Alpha'])
    expect(householdButton.closest('th')?.getAttribute('aria-sort')).toBe('ascending')
  })

  it('sorts rows without a household count last when sorting descending', () => {
    const { container } = renderWithProviders(
      <OverallPerformanceTable data={[{ ...tableData[0], households: undefined }, tableData[1]]} />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Household' }))

    expect(getStateOrder(container)).toEqual(['Beta', 'Alpha'])
  })

  it('calls onRowClick when a row is clicked', () => {
    const onRowClick = jest.fn()
    renderWithProviders(<OverallPerformanceTable data={tableData} onRowClick={onRowClick} />)

    fireEvent.click(screen.getByText('Alpha'))

    expect(onRowClick).toHaveBeenCalledTimes(1)
    expect(onRowClick).toHaveBeenCalledWith(tableData[0])
  })

  it('calls onRowHover on enter and leave', () => {
    const onRowHover = jest.fn()
    renderWithProviders(<OverallPerformanceTable data={tableData} onRowHover={onRowHover} />)

    const alphaCell = screen.getByText('Alpha')
    fireEvent.mouseEnter(alphaCell)
    fireEvent.mouseLeave(alphaCell)

    expect(onRowHover).toHaveBeenNthCalledWith(1, tableData[0])
    expect(onRowHover).toHaveBeenNthCalledWith(2, null)
  })
})
