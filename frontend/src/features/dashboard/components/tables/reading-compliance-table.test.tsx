import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, jest } from '@jest/globals'
import { renderWithProviders } from '@/test/render-with-providers'
import type { ReadingComplianceData } from '../../types'
import { ReadingComplianceTable } from './reading-compliance-table'

const rows: ReadingComplianceData[] = [
  {
    id: 'r1',
    name: 'PO A',
    village: 'V1',
    lastSubmission: '2026-01-01',
    readingValue: '12',
  },
]

describe('ReadingComplianceTable', () => {
  it('shows empty state when there is no data', () => {
    renderWithProviders(<ReadingComplianceTable data={[]} />)

    expect(screen.getByText('No data available')).toBeTruthy()
  })

  it('renders rows with village column by default', () => {
    renderWithProviders(<ReadingComplianceTable data={rows} title="Custom title" />)

    expect(screen.getByText('Custom title')).toBeTruthy()
    expect(screen.getByText('PO A')).toBeTruthy()
    expect(screen.getByText('V1')).toBeTruthy()
    expect(screen.getByText('12')).toBeTruthy()
  })

  it('hides village column when showVillageColumn is false', () => {
    renderWithProviders(<ReadingComplianceTable data={rows} showVillageColumn={false} />)

    expect(screen.queryByText('Village')).toBeNull()
  })

  it('invokes onReachEnd when list has no scroll overflow', () => {
    const onReachEnd = jest.fn()
    renderWithProviders(<ReadingComplianceTable data={rows} onReachEnd={onReachEnd} />)

    expect(onReachEnd).toHaveBeenCalled()
  })

  it('fires onReachEnd again after scroll away from bottom then back', () => {
    const onReachEnd = jest.fn()
    const many = Array.from({ length: 40 }, (_, i) => ({
      id: `x${i}`,
      name: `N${i}`,
      village: `V${i}`,
      lastSubmission: 't',
      readingValue: '1',
    }))

    const { container } = renderWithProviders(
      <ReadingComplianceTable data={many} scrollAreaMaxH="80px" onReachEnd={onReachEnd} />
    )

    const scrollHost = container.querySelector('.chakra-table__container')?.parentElement
      ?.parentElement as HTMLElement | null
    const scrollEl =
      scrollHost ??
      (Array.from(container.querySelectorAll('div')).find(
        (el) => el.scrollHeight > el.clientHeight + 1
      ) as HTMLElement | undefined)

    if (!scrollEl) {
      expect(many.length).toBeGreaterThan(1)
      return
    }

    onReachEnd.mockClear()
    Object.defineProperty(scrollEl, 'scrollHeight', { configurable: true, value: 500 })
    Object.defineProperty(scrollEl, 'clientHeight', { configurable: true, value: 100 })
    fireEvent.scroll(scrollEl, { target: { ...scrollEl, scrollTop: 380 } })
    expect(onReachEnd).toHaveBeenCalledTimes(1)

    fireEvent.scroll(scrollEl, { target: { ...scrollEl, scrollTop: 0 } })
    fireEvent.scroll(scrollEl, { target: { ...scrollEl, scrollTop: 400 } })
    expect(onReachEnd).toHaveBeenCalledTimes(2)
  })
})
