import { describe, expect, it, jest } from '@jest/globals'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import type { PumpOperatorPerformanceData } from '../../types'
import { SchemePerformanceTable } from './scheme-performance-table'

const tableData: PumpOperatorPerformanceData[] = [
  {
    id: 'op-1',
    name: 'Vikash',
    village: 'Bibipur',
    block: 'Rajpura',
    reportingRate: 90,
    photoCompliance: 70,
    waterSupplied: 50,
  },
  {
    id: 'op-2',
    name: 'Navdeep',
    village: 'Dhablan',
    block: 'Banur',
    reportingRate: 88,
    photoCompliance: 69,
    waterSupplied: 45,
  },
  {
    id: 'op-3',
    name: 'Nitish',
    village: 'Karamgarh',
    block: 'Samana',
    reportingRate: 84,
    photoCompliance: 68,
    waterSupplied: 55,
  },
]

function getNameOrder(container: HTMLElement) {
  return Array.from(container.querySelectorAll('tbody tr td:first-child')).map((cell) =>
    cell.textContent?.trim()
  )
}

describe('SchemePerformanceTable', () => {
  it('renders a no data available state when there are no rows', () => {
    renderWithProviders(<SchemePerformanceTable title="Scheme Performance" data={[]} />)

    expect(screen.getByText('No data available')).toBeTruthy()
    expect(screen.queryAllByRole('columnheader')).toHaveLength(0)
  })

  it('renders headers in Name, Village, Block order', () => {
    renderWithProviders(<SchemePerformanceTable title="Scheme Performance" data={tableData} />)

    const headers = screen.getAllByRole('columnheader').map((header) => header.textContent ?? '')
    expect(headers[0]).toContain('Name')
    expect(headers[1]).toContain('Village')
    expect(headers[2]).toContain('Block')
  })

  it('omits the village column when configured for district dashboard', () => {
    renderWithProviders(
      <SchemePerformanceTable
        title="Scheme Performance"
        data={tableData}
        showVillageColumn={false}
      />
    )

    const headers = screen.getAllByRole('columnheader').map((header) => header.textContent ?? '')
    expect(headers).toHaveLength(4)
    expect(headers[0]).toContain('Name')
    expect(headers[1]).toContain('Block')
    expect(headers).not.toContain('Village')
  })

  it('omits the block column when configured not to show it', () => {
    renderWithProviders(
      <SchemePerformanceTable title="Scheme Performance" data={tableData} showBlockColumn={false} />
    )

    const headers = screen.getAllByRole('columnheader').map((header) => header.textContent ?? '')
    expect(headers).toHaveLength(4)
    expect(headers[0]).toContain('Name')
    expect(headers[1]).toContain('Village')
    expect(headers).not.toContain('Block')
  })

  it('uses the custom secondary column label when provided', () => {
    renderWithProviders(
      <SchemePerformanceTable
        title="Scheme Performance"
        data={tableData}
        secondaryColumnLabel="My Secondary"
      />
    )

    const headers = screen.getAllByRole('columnheader').map((header) => header.textContent ?? '')
    expect(headers).toContain('My Secondary')
  })

  it('uses custom block column label when provided', () => {
    renderWithProviders(
      <SchemePerformanceTable
        title="Scheme Performance"
        data={tableData}
        showVillageColumn={false}
        blockColumnLabel="Circle"
      />
    )

    const headers = screen.getAllByRole('columnheader').map((header) => header.textContent ?? '')
    expect(headers).toContain('Circle')
    expect(headers).not.toContain('Block')
  })

  it('sorts reporting rate descending then ascending', () => {
    const { container } = renderWithProviders(
      <SchemePerformanceTable title="Scheme Performance" data={tableData} />
    )
    const reportingButton = screen.getByRole('button', { name: 'Reporting Rate (%)' })

    fireEvent.click(reportingButton)
    expect(getNameOrder(container)).toEqual(['Vikash', 'Navdeep', 'Nitish'])
    expect(reportingButton.closest('th')?.getAttribute('aria-sort')).toBe('descending')

    fireEvent.click(reportingButton)
    expect(getNameOrder(container)).toEqual(['Nitish', 'Navdeep', 'Vikash'])
    expect(reportingButton.closest('th')?.getAttribute('aria-sort')).toBe('ascending')
  })

  it('sorts water supplied when water column is clicked', () => {
    const { container } = renderWithProviders(
      <SchemePerformanceTable title="Scheme Performance" data={tableData} />
    )
    const waterButton = screen.getByRole('button', { name: 'Water Supplied' })

    fireEvent.click(waterButton)
    expect(getNameOrder(container)).toEqual(['Nitish', 'Vikash', 'Navdeep'])
    expect(waterButton.closest('th')?.getAttribute('aria-sort')).toBe('descending')
  })

  it('renders missing analytics fields as dashes', () => {
    renderWithProviders(
      <SchemePerformanceTable
        title="Scheme Performance"
        data={[
          {
            id: 'scheme-1',
            name: 'Scheme Alpha',
            village: null,
            block: null,
            reportingRate: null,
            photoCompliance: 0,
            waterSupplied: null,
          },
        ]}
      />
    )

    expect(screen.getAllByText('-')).toHaveLength(4)
  })

  it('fires onReachEnd when scrolled to the bottom', () => {
    const scrollTestId = 'scheme-performance-scroll-area'
    const isScrollArea = (el: unknown): el is HTMLElement =>
      el instanceof HTMLElement && el.getAttribute('data-testid') === scrollTestId
    const scrollHeightDesc = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollHeight')
    const clientHeightDesc = Object.getOwnPropertyDescriptor(Element.prototype, 'clientHeight')
    const scrollHeightSpy = jest
      .spyOn(Element.prototype, 'scrollHeight', 'get')
      .mockImplementation(function (this: Element) {
        if (isScrollArea(this)) return 500
        return scrollHeightDesc?.get?.call(this) ?? 0
      })
    const clientHeightSpy = jest
      .spyOn(Element.prototype, 'clientHeight', 'get')
      .mockImplementation(function (this: Element) {
        if (isScrollArea(this)) return 100
        return clientHeightDesc?.get?.call(this) ?? 0
      })
    const onReachEnd = jest.fn()
    const many = Array.from({ length: 40 }, (_, i) => ({
      id: `scheme-${i}`,
      name: `Scheme ${i}`,
      village: `Village ${i}`,
      block: `Block ${i}`,
      reportingRate: i,
      photoCompliance: 0,
      waterSupplied: i * 1000,
    }))

    try {
      const { container } = renderWithProviders(
        <SchemePerformanceTable title="Scheme Performance" data={many} onReachEnd={onReachEnd} />
      )
      const scrollArea = container.querySelector(
        `[data-testid="${scrollTestId}"]`
      ) as HTMLElement | null

      expect(scrollArea).not.toBeNull()
      onReachEnd.mockClear()

      Object.defineProperty(scrollArea as HTMLElement, 'scrollTop', {
        configurable: true,
        writable: true,
        value: 390,
      })
      fireEvent.scroll(scrollArea as HTMLElement)

      expect(onReachEnd).toHaveBeenCalledTimes(1)
    } finally {
      scrollHeightSpy.mockRestore()
      clientHeightSpy.mockRestore()
    }
  })
})
