import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { renderHook } from '@testing-library/react'
import {
  useIntegrationConfigurationQuery,
  useLanguageConfigurationQuery,
  useSchemeMappingsListQuery,
  useStaffCountsQuery,
  useWaterNormsConfigurationQuery,
} from './use-state-admin-queries'
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

  it('enables scheme mappings list when tenant code is present', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() =>
      useSchemeMappingsListQuery({
        tenantCode: 'MH',
        page: 0,
        limit: 10,
        schemeName: 'x',
        sortDir: 'asc',
      })
    )
    expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }))
  })

  it('wires language, integration, and water norms configuration queries', () => {
    ;(useQuery as jest.Mock).mockReturnValue({})
    renderHook(() => useLanguageConfigurationQuery())
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['state-admin', 'language-configuration'] })
    )
    ;(useQuery as jest.Mock).mockClear()
    renderHook(() => useIntegrationConfigurationQuery())
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['state-admin', 'integration-configuration'] })
    )
    ;(useQuery as jest.Mock).mockClear()
    renderHook(() => useWaterNormsConfigurationQuery())
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['state-admin', 'water-norms-configuration'] })
    )
  })
})
