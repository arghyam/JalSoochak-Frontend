import { createElement, type PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { dashboardQueryKeys } from '../services/query/dashboard-query-keys'
import type {
  AverageWaterSupplyPerRegionResponse,
  GeoJsonGeometry,
  NationalDashboardBoundaryResponse,
  NationalDashboardResponse,
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

jest.mock('../services/api/dashboard-api', () => ({
  dashboardApi: {
    getTenantBoundaryGeoJson: (params: TenantBoundaryGeoJsonQueryParams) =>
      mockGetTenantBoundaryGeoJson(params),
    getOnboardedRegions: (params: OnboardedRegionsQueryParams) => mockGetOnboardedRegions(params),
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
    const nationalBoundaries: NationalDashboardBoundaryResponse = {
      stateWiseBoundaries: [punjab],
    }
    const nationalData: NationalDashboardResponse = {
      startDate: '2026-11-01',
      endDate: '2026-11-10',
      daysInRange: 10,
      stateWiseQuantityPerformance: [],
      stateWiseRegularity: [
        {
          tenantId: 3,
          stateCode: 'PB',
          stateTitle: 'Punjab',
          schemeCount: 4,
          totalSupplyDays: 30,
          regularSchemeCount: 3,
          averageRegularity: 0.75,
        },
      ],
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
    const onboardedDistricts = (
      overrides: Partial<OnboardedRegionsResponse> = {}
    ): OnboardedRegionsResponse => ({
      tenantId: 3,
      parentLgdId: 1,
      parentDepartmentId: null,
      phasedRollout: true,
      onboardedChildIds: [12],
      ...overrides,
    })

    const punjabDistrictBoundaries: TenantBoundaryGeoJsonResponse = {
      tenantId: 3,
      stateCode: 'PB',
      childBoundaryCount: 2,
      childRegions: [
        { lgdId: 12, title: 'Alpha', parsedBoundaryGeoJson: polygon },
        { lgdId: 13, title: 'Beta', parsedBoundaryGeoJson: polygon },
      ],
    }

    beforeEach(() => {
      mockGetTenantBoundaryGeoJson.mockResolvedValue(punjabDistrictBoundaries)
    })

    it('draws districts that are not onboarded without metrics and maps only the others', async () => {
      mockGetOnboardedRegions.mockResolvedValue(onboardedDistricts())

      const { result } = renderMapPerformance(districtViewParams)

      await waitFor(() => expect(result.current.districtMapChartData).toHaveLength(2))
      expect(mockGetOnboardedRegions).toHaveBeenCalledWith({ tenantId: 3, parentLgdId: 1 })
      expect(result.current.districtMapChartData).toEqual([
        expect.objectContaining({ id: '12', regularity: 75 }),
        expect.objectContaining({ id: '13', regularity: -1, quantity: -1 }),
      ])
      expect([...result.current.districtToStateMap.keys()]).toEqual(['12'])
    })

    it('keeps every district while the rollout is off', async () => {
      mockGetOnboardedRegions.mockResolvedValue(
        onboardedDistricts({ phasedRollout: false, onboardedChildIds: null })
      )

      const { result } = renderMapPerformance(districtViewParams)

      await waitFor(() => expect(result.current.districtMapChartData).toHaveLength(2))
      expect(result.current.districtMapChartData.map((district) => district.regularity)).toEqual([
        75, 75,
      ])
      expect([...result.current.districtToStateMap.keys()]).toEqual(['12', '13'])
    })

    it('draws no district with metrics when the onboarded list fails', async () => {
      mockGetOnboardedRegions.mockRejectedValue(new Error('Request failed with status code 404'))

      const { result } = renderMapPerformance(districtViewParams)

      await waitFor(() => expect(result.current.districtMapChartData).toHaveLength(2))
      expect(result.current.districtMapChartData.map((district) => district.regularity)).toEqual([
        -1, -1,
      ])
      expect(result.current.districtToStateMap.size).toBe(0)
    })

    it("waits for a state's onboarded list before drawing its districts", async () => {
      // The geometry is already cached, so only the onboarded list is outstanding.
      const queryClient = createQueryClient()
      queryClient.setQueryData(
        dashboardQueryKeys.tenantBoundaryGeoJson({ tenantId: 3, parentLgdId: 1 }),
        punjabDistrictBoundaries
      )
      mockGetOnboardedRegions.mockReturnValue(new Promise<OnboardedRegionsResponse>(() => {}))

      const { result } = renderMapPerformance(districtViewParams, queryClient)

      await waitFor(() => expect(mockGetOnboardedRegions).toHaveBeenCalled())
      expect(mockGetTenantBoundaryGeoJson).not.toHaveBeenCalled()
      expect(result.current.districtMapChartData).toEqual([])
      expect(result.current.districtToStateMap.size).toBe(0)
      expect(result.current.isDistrictMapLoading).toBe(true)
    })
  })
})
