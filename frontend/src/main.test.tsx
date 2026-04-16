import React from 'react'

const mockRender = jest.fn()
const mockCreateRoot = jest.fn((_container: Element | DocumentFragment) => ({ render: mockRender }))

jest.mock('react-dom/client', () => ({
  createRoot: (container: Element | DocumentFragment) => mockCreateRoot(container),
}))

describe('main bootstrap', () => {
  it('mounts app into root container', async () => {
    document.body.innerHTML = '<div id="root"></div>'

    await import('./main')

    const rootElement = document.getElementById('root')
    expect(mockCreateRoot).toHaveBeenCalledWith(rootElement)
    expect(mockRender).toHaveBeenCalledTimes(1)
    expect(React.isValidElement(mockRender.mock.calls[0][0])).toBe(true)
  })
})
