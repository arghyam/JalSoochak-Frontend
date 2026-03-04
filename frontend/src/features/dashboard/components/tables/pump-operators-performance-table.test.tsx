import { describe, expect, it } from '@jest/globals'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import type { PumpOperatorPerformanceData } from '../../types'
import { PumpOperatorsPerformanceTable } from './pump-operators-performance-table'

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

describe('PumpOperatorsPerformanceTable', () => {
  it('renders headers in Name, Village, Block order', () => {
    renderWithProviders(
      <PumpOperatorsPerformanceTable title="Pump Operators Performance" data={tableData} />
    )

    const headers = screen.getAllByRole('columnheader').map((header) => header.textContent ?? '')
    expect(headers[0]).toContain('Name')
    expect(headers[1]).toContain('Village')
    expect(headers[2]).toContain('Block')
  })

  it('sorts reporting rate descending then ascending', () => {
    const { container } = renderWithProviders(
      <PumpOperatorsPerformanceTable title="Pump Operators Performance" data={tableData} />
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
      <PumpOperatorsPerformanceTable title="Pump Operators Performance" data={tableData} />
    )
    const waterButton = screen.getByRole('button', { name: 'Water Supplied' })

    fireEvent.click(waterButton)
    expect(getNameOrder(container)).toEqual(['Nitish', 'Vikash', 'Navdeep'])
    expect(waterButton.closest('th')?.getAttribute('aria-sort')).toBe('descending')
  })
})
