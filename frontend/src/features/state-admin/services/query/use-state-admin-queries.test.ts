import { renderHook } from '@testing-library/react'
import { useStaffCountsQuery, useSchemeMappingsListQuery } from './use-state-admin-queries'
import { useQuery } from '@tanstack/react-query'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}))

describe('use-state-admin-queries', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('wires staff counts query', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useStaffCountsQuery())
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['state-admin', 'staff-counts'] })
    )
  })

  it('enables scheme mappings list only with tenant code', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() =>
      useSchemeMappingsListQuery({
        tenantCode: '',
        page: 0,
        limit: 10,
        schemeName: '',
        sortDir: '',
      })
    )
    expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })
})
