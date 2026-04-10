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
    const scrollTestId = 'reading-compliance-scroll-area'
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
      id: `x${i}`,
      name: `N${i}`,
      village: `V${i}`,
      lastSubmission: 't',
      readingValue: '1',
    }))

    try {
      const { container } = renderWithProviders(
        <ReadingComplianceTable data={many} scrollAreaMaxH="80px" onReachEnd={onReachEnd} />
      )

      const scrollTarget = container.querySelector(
        `[data-testid="${scrollTestId}"]`
      ) as HTMLElement | null

      expect(scrollTarget).not.toBeNull()
      expect(many.length).toBeGreaterThan(1)

      const scrollArea = scrollTarget as HTMLElement

      // Effect should see overflow (500 − 100 > 24) so it does not pre-mark end; scroll drives callbacks.
      onReachEnd.mockClear()

      const setScrollTop = (value: number) => {
        Object.defineProperty(scrollArea, 'scrollTop', {
          configurable: true,
          writable: true,
          value,
        })
      }

      setScrollTop(380)
      fireEvent.scroll(scrollArea)
      expect(onReachEnd).toHaveBeenCalledTimes(1)

      setScrollTop(0)
      fireEvent.scroll(scrollArea)
      setScrollTop(400)
      fireEvent.scroll(scrollArea)
      expect(onReachEnd).toHaveBeenCalledTimes(2)
    } finally {
      scrollHeightSpy.mockRestore()
      clientHeightSpy.mockRestore()
    }
  })
})
