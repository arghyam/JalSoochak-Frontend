import fileMock from './file-mock'

describe('file mock', () => {
  it('exports expected mock token', () => {
    expect(fileMock).toBe('test-file-stub')
  })
})
