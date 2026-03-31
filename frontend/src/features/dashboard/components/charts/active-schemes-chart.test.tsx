import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { ActiveSchemesChart } from './active-schemes-chart'

const mockEChartsWrapper = jest.fn((_props: { option: unknown }) => (
  <div data-testid="echarts-wrapper" />
))

jest.mock('@/shared/components/common/echarts-wrapper', () => ({
  EChartsWrapper: (props: { option: unknown }) => mockEChartsWrapper(props),
}))

beforeEach(() => {
  mockEChartsWrapper.mockClear()
})

describe('ActiveSchemesChart', () => {
  it('shows a no data available legend item when the pie data is empty', () => {
    renderWithProviders(<ActiveSchemesChart data={[]} />)

    expect(screen.getByText('No data available')).toBeTruthy()
  })
})
