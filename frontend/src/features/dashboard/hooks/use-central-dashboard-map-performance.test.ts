import { createElement, type PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { dashboardQueryKeys } from '../services/query/dashboard-query-keys'
import type {
  AverageWaterSupplyPerRegionResponse,
  GeoJsonGeometry,
  NationalDashboardBoundaryResponse,
  NationalDashboardDistrictBoundaryResponse,
  NationalDashboardResponse,
  NationalOnboardedDistrictsResponse,
  OnboardedRegionsQueryParams,
  OnboardedRegionsResponse,
  TenantBoundaryGeoJsonQueryParams,
  TenantBoundaryGeoJsonResponse,
  TenantBoundaryResponse,
} from '../types'
import type { ChildRegionIds } from '../utils/onboarded-regions'
import { useCentralDashboardMapPerformance } from './use-central-dashboard-map-performance'

const mockGetTenantBoundaryGeoJson =
  jest.fn<(params: TenantBoundaryGeoJsonQueryParams) => Promise<TenantBoundaryGeoJsonResponse>>()
const mockGetOnboardedRegions =
  jest.fn<(params: OnboardedRegionsQueryParams) => Promise<OnboardedRegionsResponse>>()
const mockGetNationalDashboardDistrictBoundaries =
  jest.fn<() => Promise<NationalDashboardDistrictBoundaryResponse>>()
const mockGetNationalOnboardedDistricts =
  jest.fn<() => Promise<NationalOnboardedDistrictsResponse>>()

jest.mock('../services/api/dashboard-api', () => ({
  dashboardApi: {
    getTenantBoundaryGeoJson: (params: TenantBoundaryGeoJsonQueryParams) =>
      mockGetTenantBoundaryGeoJson(params),
    getOnboardedRegions: (params: OnboardedRegionsQueryParams) => mockGetOnboardedRegions(params),
    getNationalDashboardDistrictBoundaries: () => mockGetNationalDashboardDistrictBoundaries(),
    getNationalOnboardedDistricts: () => mockGetNationalOnboardedDistricts(),
  },
}))

type MapPerformanceParams = Parameters<typeof useCentralDashboardMapPerformance>[0]

const polygon: GeoJsonGeometry = {
  type: 'Polygon',
  coordinates: [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 0],
    ],
  ],
}

const isAlphaOnboarded = (region: ChildRegionIds) => region.childLgdId === 12

const createQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

const renderMapPerformance = (
  overrides: Partial<MapPerformanceParams>,
  queryClient: QueryClient = createQueryClient()
) =>
  renderHook(
    () =>
      useCentralDashboardMapPerformance({
        averagePersonsPerHousehold: 5,
        emptyEntityPerformance: [],
        expectedOverallPerformanceOptions: [],
        hoveredOverallPerformanceRow: null,
        isCentralLandingView: false,
        isDepartmentCircleSelected: false,
        isDepartmentDivisionSelected: false,
        isDepartmentStateSelected: false,
        isDepartmentTabActive: false,
        isDepartmentZoneSelected: false,
        isHierarchyFourthLevelSelected: false,
        isHierarchySecondLevelSelected: false,
        isHierarchyStateSelected: false,
        isHierarchyThirdLevelSelected: false,
        isMapDistrictView: false,
        isNationalDashboardBoundariesPending: false,
        isOnboardedChild: () => true,
        isOnboardedChildrenLoading: false,
        isTenantBoundariesFetching: false,
        isTenantBoundariesLoading: false,
        isTenantBoundaryGeoJsonFetching: false,
        isTenantBoundaryGeoJsonLoading: false,
        nationalDefaultAverageMembersPerHousehold: 5,
        shouldFetchTenantBoundaryGeoJson: false,
        tenantBoundaryAnalyticsParams: null,
        tenantBoundaryLocationOptions: [],
        ...overrides,
      }),
    {
      wrapper: ({ children }: PropsWithChildren) =>
        createElement(QueryClientProvider, { client: queryClient }, children),
    }
  )

describe('useCentralDashboardMapPerformance', () => {
  beforeEach(() => {
    mockGetTenantBoundaryGeoJson.mockReset()
    mockGetOnboardedRegions.mockReset()
    mockGetNationalDashboardDistrictBoundaries.mockReset()
    mockGetNationalOnboardedDistricts.mockReset()
  })

  describe('state map', () => {
    // The boundaries list every district; the metrics only the onboarded one (F-P3a).
    const tenantBoundaryData: TenantBoundaryResponse = {
      tenantId: 3,
      stateCode: 'PB',
      childBoundaryCount: 2,
      childRegions: [
        { childLgdId: 12, childLgdTitle: 'Alpha', averageSchemeRegularity: 0.5 },
        { childLgdId: 13, childLgdTitle: 'Beta', averageSchemeRegularity: 0.9 },
      ],
    }
    const tenantBoundaryGeoJsonData: TenantBoundaryGeoJsonResponse = {
      tenantId: 3,
      stateCode: 'PB',
      childBoundaryCount: 2,
      childRegions: [
        { lgdId: 12, title: 'Alpha', parsedBoundaryGeoJson: polygon },
        { lgdId: 13, title: 'Beta', parsedBoundaryGeoJson: polygon },
      ],
    }
    const averageWaterSupplyData: AverageWaterSupplyPerRegionResponse = {
      tenantId: 3,
      stateCode: 'PB',
      parentLgdLevel: 1,
      parentDepartmentLevel: null,
      startDate: '2026-11-01',
      endDate: '2026-11-10',
      daysInRange: 10,
      schemeCount: 2,
      childRegionCount: 1,
      childRegions: [
        {
          lgdId: 12,
          departmentId: null,
          title: 'Alpha',
          totalHouseholdCount: 100,
          totalWaterSuppliedLiters: 1000,
          schemeCount: 2,
          avgWaterSupplyPerScheme: 500,
        },
      ],
    }
    const stateMapParams: Partial<MapPerformanceParams> = {
      averageWaterSupplyData,
      isHierarchyStateSelected: true,
      tenantBoundaryAnalyticsParams: { tenantId: 3, parentLgdId: 1 },
      tenantBoundaryData,
      tenantBoundaryGeoJsonData,
    }

    it('draws a region that is not onboarded without metrics, even if its boundary has some', () => {
      const { result } = renderMapPerformance({
        ...stateMapParams,
        isOnboardedChild: isAlphaOnboarded,
      })

      expect(result.current.mapChartData).toEqual([
        expect.objectContaining({ id: '12', name: 'Alpha', regularity: 50 }),
        expect.objectContaining({ id: '13', name: 'Beta', regularity: -1, quantity: -1 }),
      ])
      expect(result.current.isMapDataLoading).toBe(false)
    })

    it('lists only the regions of the filtered metrics, not every boundary', () => {
      const { result } = renderMapPerformance({
        ...stateMapParams,
        isOnboardedChild: isAlphaOnboarded,
      })

      expect(result.current.overallPerformanceTableData.map((row) => row.id)).toEqual(['12'])
    })

    it('draws every region without metrics and reports loading while the onboarded list loads', () => {
      const { result } = renderMapPerformance({
        ...stateMapParams,
        isOnboardedChild: () => false,
        isOnboardedChildrenLoading: true,
      })

      expect(result.current.isMapDataLoading).toBe(true)
      expect(result.current.mapChartData.map((region) => region.regularity)).toEqual([-1, -1])
    })

    it('ignores the onboarded list while there is no boundary to draw', () => {
      const { result } = renderMapPerformance({ isOnboardedChildrenLoading: true })

      expect(result.current.isMapDataLoading).toBe(false)
      expect(result.current.mapChartData).toEqual([])
    })
  })

  describe('national district view', () => {
    const punjab = {
      tenantId: 3,
      lgdId: 1,
      tenantStatus: 1,
      stateCode: 'PB',
      stateTitle: 'Punjab',
      boundary: polygon,
    }
    const kerala = { ...punjab, tenantId: 9, lgdId: 2, stateCode: 'KL', stateTitle: 'Kerala' }
    const nationalBoundaries: NationalDashboardBoundaryResponse = {
      stateWiseBoundaries: [punjab],
    }
    const stateRegularity = (tenantId: number, stateTitle: string, regularSchemeCount: number) => ({
      tenantId,
      stateCode: '',
      stateTitle,
      schemeCount: 4,
      totalSupplyDays: 30,
      regularSchemeCount,
      averageRegularity: regularSchemeCount / 4,
    })
    const nationalData: NationalDashboardResponse = {
      startDate: '2026-11-01',
      endDate: '2026-11-10',
      daysInRange: 10,
      stateWiseQuantityPerformance: [],
      stateWiseRegularity: [stateRegularity(3, 'Punjab', 3), stateRegularity(9, 'Kerala', 2)],
      stateWiseReadingSubmissionRate: [],
      overallOutageReasonDistribution: {},
    }
    const districtViewParams: Partial<MapPerformanceParams> = {
      filteredNationalDashboardBoundaries: nationalBoundaries,
      filteredNationalDashboardData: nationalData,
      isCentralLandingView: true,
      isMapDistrictView: true,
      nationalDashboardBoundariesData: nationalBoundaries,
      shouldFetchTenantBoundaryGeoJson: true,
    }
    const twoStateParams: Partial<MapPerformanceParams> = {
      ...districtViewParams,
      filteredNationalDashboardBoundaries: { stateWiseBoundaries: [punjab, kerala] },
      nationalDashboardBoundariesData: { stateWiseBoundaries: [punjab, kerala] },
    }
    const onboardedDistricts = (
      overrides: Partial<NationalOnboardedDistrictsResponse> = {}
    ): NationalOnboardedDistrictsResponse => ({
      phasedRollout: true,
      tenants: [{ tenantId: 3, onboardedDistrictIds: [12] }],
      ...overrides,
    })
    const district = (tenantId: number, lgdId: number, title: string) => ({
      tenantId,
      lgdId,
      tenantStatus: 1,
      stateCode: '',
      stateTitle: '',
      title,
      boundary: polygon,
    })
    const districtBoundaries: NationalDashboardDistrictBoundaryResponse = {
      lgdLevel2Boundaries: [
        district(3, 12, 'Alpha'),
        district(3, 13, 'Beta'),
        district(9, 40, 'Gamma'),
        // A tenant the national map leaves out, such as one that isn't active.
        district(77, 70, 'Elsewhere'),
      ],
    }
    const rateLimited = () => {
      const error = new AxiosError('Request failed with status code 429')
      error.response = {
        status: 429,
        data: {},
        statusText: 'Too Many Requests',
        headers: {},
        config: { headers: {} } as InternalAxiosRequestConfig,
      }
      return error
    }

    beforeEach(() => {
      mockGetNationalDashboardDistrictBoundaries.mockResolvedValue(districtBoundaries)
    })

    it('draws districts that are not onboarded without metrics and maps only the others', async () => {
      mockGetNationalOnboardedDistricts.mockResolvedValue(onboardedDistricts())

      const { result } = renderMapPerformance(districtViewParams)

      await waitFor(() => expect(result.current.districtMapChartData).toHaveLength(2))
      expect(result.current.districtMapChartData).toEqual([
        expect.objectContaining({
          id: '12',
          name: 'Alpha::12',
          regularity: 75,
          boundaryGeoJson: polygon,
        }),
        expect.objectContaining({ id: '13', regularity: -1, quantity: -1 }),
      ])
      expect([...result.current.districtToStateMap.keys()]).toEqual(['12'])
    })

    it('asks once for every state, never once per state', async () => {
      mockGetNationalOnboardedDistricts.mockResolvedValue(onboardedDistricts())

      const { result } = renderMapPerformance(twoStateParams)

      await waitFor(() => expect(result.current.districtMapChartData).toHaveLength(3))
      expect(mockGetNationalDashboardDistrictBoundaries).toHaveBeenCalledTimes(1)
      expect(mockGetNationalOnboardedDistricts).toHaveBeenCalledTimes(1)
      expect(mockGetTenantBoundaryGeoJson).not.toHaveBeenCalled()
      expect(mockGetOnboardedRegions).not.toHaveBeenCalled()
    })

    it("checks each state's districts against its own list, and draws only the map's states", async () => {
      mockGetNationalOnboardedDistricts.mockResolvedValue(onboardedDistricts())

      const { result } = renderMapPerformance(twoStateParams)

      await waitFor(() => expect(result.current.districtMapChartData).toHaveLength(3))
      // Kerala isn't listed, so none of its districts is onboarded; tenant 77 isn't on the map.
      expect(
        result.current.districtMapChartData.map(({ id, regularity }) => [id, regularity])
      ).toEqual([
        ['12', 75],
        ['13', -1],
        ['40', -1],
      ])
      expect([...result.current.districtToStateMap.entries()]).toEqual([['12', punjab]])
    })

    it('keeps every district while the rollout is off', async () => {
      mockGetNationalOnboardedDistricts.mockResolvedValue(
        onboardedDistricts({ phasedRollout: false, tenants: null })
      )

      const { result } = renderMapPerformance(twoStateParams)

      await waitFor(() => expect(result.current.districtMapChartData).toHaveLength(3))
      expect(result.current.districtMapChartData.map((d) => d.regularity)).toEqual([75, 75, 50])
      expect([...result.current.districtToStateMap.keys()]).toEqual(['12', '13', '40'])
    })

    it('skips a district without a boundary on the map but still maps it to its state', async () => {
      mockGetNationalDashboardDistrictBoundaries.mockResolvedValue({
        lgdLevel2Boundaries: [
          { ...district(3, 12, 'Alpha'), boundary: null },
          district(3, 13, 'Beta'),
        ],
      })
      mockGetNationalOnboardedDistricts.mockResolvedValue(
        onboardedDistricts({ tenants: [{ tenantId: 3, onboardedDistrictIds: [12, 13] }] })
      )

      const { result } = renderMapPerformance(districtViewParams)

      await waitFor(() => expect(result.current.districtMapChartData).toHaveLength(1))
      expect(result.current.districtMapChartData[0]).toEqual(expect.objectContaining({ id: '13' }))
      expect([...result.current.districtToStateMap.keys()]).toEqual(['12', '13'])
    })

    it('draws no district with metrics when the onboarded list fails', async () => {
      mockGetNationalOnboardedDistricts.mockRejectedValue(new Error('Invalid response'))

      const { result } = renderMapPerformance(districtViewParams)

      await waitFor(() => expect(result.current.districtMapChartData).toHaveLength(2))
      expect(result.current.districtMapChartData.map((d) => d.regularity)).toEqual([-1, -1])
      expect(result.current.districtToStateMap.size).toBe(0)
      expect(mockGetNationalOnboardedDistricts).toHaveBeenCalledTimes(1)
    })

    it('ignores the last onboarded list once a refetch of it fails', async () => {
      mockGetNationalOnboardedDistricts.mockResolvedValueOnce(onboardedDistricts())
      const queryClient = createQueryClient()

      const { result } = renderMapPerformance(districtViewParams, queryClient)

      await waitFor(() =>
        expect(result.current.districtMapChartData.map((d) => d.regularity)).toEqual([75, -1])
      )

      mockGetNationalOnboardedDistricts.mockRejectedValue(new Error('Invalid response'))
      await act(() =>
        queryClient.refetchQueries({ queryKey: dashboardQueryKeys.nationalOnboardedDistricts() })
      )

      // The failed refetch keeps the old list in `data`; the map must not trust it.
      await waitFor(() =>
        expect(result.current.districtMapChartData.map((d) => d.regularity)).toEqual([-1, -1])
      )
      expect(result.current.districtToStateMap.size).toBe(0)
    })

    it('retries a rate-limited onboarded list instead of greying the map', async () => {
      mockGetNationalOnboardedDistricts
        .mockRejectedValueOnce(rateLimited())
        .mockResolvedValue(onboardedDistricts())
      const queryClient = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } })

      const { result } = renderMapPerformance(districtViewParams, queryClient)

      await waitFor(() => expect(result.current.districtMapChartData).toHaveLength(2))
      expect(mockGetNationalOnboardedDistricts).toHaveBeenCalledTimes(2)
      expect(result.current.districtMapChartData.map((d) => d.regularity)).toEqual([75, -1])
    })

    it('waits for the onboarded list before drawing the districts', async () => {
      // The geometry is already cached, so only the onboarded list is outstanding.
      const queryClient = createQueryClient()
      queryClient.setQueryData(
        dashboardQueryKeys.nationalDashboardDistrictBoundaries(),
        districtBoundaries
      )
      mockGetNationalOnboardedDistricts.mockReturnValue(
        new Promise<NationalOnboardedDistrictsResponse>(() => {})
      )

      const { result } = renderMapPerformance(districtViewParams, queryClient)

      await waitFor(() => expect(mockGetNationalOnboardedDistricts).toHaveBeenCalled())
      expect(mockGetNationalDashboardDistrictBoundaries).not.toHaveBeenCalled()
      expect(result.current.districtMapChartData).toEqual([])
      expect(result.current.districtToStateMap.size).toBe(0)
      expect(result.current.isDistrictMapLoading).toBe(true)
    })

    it('asks for nothing outside the district view', () => {
      renderMapPerformance({ ...districtViewParams, isMapDistrictView: false })

      expect(mockGetNationalDashboardDistrictBoundaries).not.toHaveBeenCalled()
      expect(mockGetNationalOnboardedDistricts).not.toHaveBeenCalled()
    })
  })
})
