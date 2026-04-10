import { render, waitFor } from '@testing-library/react'
import * as echarts from 'echarts'
import { EChartsWrapper } from './echarts-wrapper'

const resizeObserverDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'ResizeObserver')

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(globalThis, 'ResizeObserver', {
    configurable: true,
    writable: true,
    value: ResizeObserverMock,
  })
})

afterAll(() => {
  if (resizeObserverDescriptor) {
    Object.defineProperty(globalThis, 'ResizeObserver', resizeObserverDescriptor)
  } else {
    delete (globalThis as Record<string, unknown>).ResizeObserver
  }
})

jest.mock('echarts', () => {
  return {
    init: jest.fn().mockImplementation(() => ({
      setOption: jest.fn(),
      dispose: jest.fn(),
      resize: jest.fn(),
      isDisposed: jest.fn(() => false),
    })),
    getInstanceByDom: jest.fn(() => undefined),
  }
})

describe('EChartsWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('mounts container with dimensions and calls init and setOption', async () => {
    const option = { series: [] }
    const onChartReadyOnce = jest.fn()
    const { container } = render(
      <EChartsWrapper option={option} height={200} onChartReadyOnce={onChartReadyOnce} />
    )

    const el = container.firstChild as HTMLElement
    expect(el.tagName.toLowerCase()).toBe('div')
    expect(el.style.width).toBe('100%')
    expect(el.style.height).toBe('200px')

    await waitFor(() => {
      expect(jest.mocked(echarts.init)).toHaveBeenCalled()
    })

    const mockInstance = jest.mocked(echarts.init).mock.results[0]?.value as {
      setOption: jest.Mock
    }
    expect(mockInstance.setOption).toHaveBeenCalledWith(option, true)
    expect(onChartReadyOnce).toHaveBeenCalledWith(mockInstance)
  })

  it('disposes chart on unmount', async () => {
    const { unmount } = render(<EChartsWrapper option={{}} />)
    await waitFor(() => {
      expect(jest.mocked(echarts.init)).toHaveBeenCalled()
    })
    const instance = jest.mocked(echarts.init).mock.results[0]?.value as { dispose: jest.Mock }
    unmount()
    expect(instance.dispose).toHaveBeenCalled()
  })
})
