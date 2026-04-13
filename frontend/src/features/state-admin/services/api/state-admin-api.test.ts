import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { AxiosError } from 'axios'
import { stateAdminApi, type SaveConfigurationPayload } from './state-admin-api'
import { apiClient } from '@/shared/lib/axios'
import { useAuthStore } from '@/app/store/auth-store'
import {
  DEFAULT_DATE_FORMAT_CONFIG,
  DEFAULT_METER_CHANGE_REASONS,
  DEFAULT_SUPPLY_OUTAGE_REASONS,
} from '../../types/configuration'

jest.mock('@/shared/lib/axios', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn() },
}))
jest.mock('@/app/store/auth-store', () => ({
  useAuthStore: { getState: jest.fn() },
}))

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>
const mockedGetState = useAuthStore.getState as jest.Mock

const tenantEnvelope = (configs: Record<string, unknown> = {}) =>
  ({ data: { data: { configs } } }) as never

const minimalSaveConfigurationPayload: SaveConfigurationPayload = {
  supportedChannels: ['BFM'],
  meterChangeReasons: DEFAULT_METER_CHANGE_REASONS,
  supplyOutageReasons: DEFAULT_SUPPLY_OUTAGE_REASONS,
  locationCheckRequired: false,
  displayDepartmentMaps: false,
  dataConsolidationTime: '09:00',
  pumpOperatorReminderNudgeTime: '10:00',
  dateFormatScreen: DEFAULT_DATE_FORMAT_CONFIG,
  dateFormatTable: DEFAULT_DATE_FORMAT_CONFIG,
  averageMembersPerHousehold: 4,
  isConfigured: true,
}

describe('stateAdminApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedGetState.mockReturnValue({ user: { tenantId: '1', tenantCode: 'TN' } })
  })

  describe('getTenantId / getStaffCounts auth', () => {
    it('throws when tenantId missing for tenant-scoped config GET', async () => {
      mockedGetState.mockReturnValue({ user: { tenantCode: 'TN' } })
      await expect(stateAdminApi.getLanguageConfiguration()).rejects.toThrow(/tenantId unavailable/)
    })

    it('throws when tenantCode missing for getStaffCounts', async () => {
      mockedGetState.mockReturnValue({ user: { tenantId: '1' } })
      await expect(stateAdminApi.getStaffCounts()).rejects.toThrow(/tenantCode unavailable/)
    })
  })

  describe('tenant config HTTP', () => {
    it('getLanguageConfiguration maps envelope configs', async () => {
      mockedApiClient.get.mockResolvedValueOnce(tenantEnvelope({}))
      const res = await stateAdminApi.getLanguageConfiguration()
      expect(mockedApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/tenants/1/config?keys=SUPPORTED_LANGUAGES')
      )
      expect(res.id).toBe('1')
    })

    it('saveLanguageConfiguration PUTs mapped payload', async () => {
      mockedApiClient.put.mockResolvedValueOnce(tenantEnvelope({}))
      await stateAdminApi.saveLanguageConfiguration({
        primaryLanguage: 'en',
        isConfigured: true,
      })
      expect(mockedApiClient.put).toHaveBeenCalledWith(
        '/api/v1/tenants/1/config',
        expect.objectContaining({ configs: expect.any(Object) })
      )
    })

    it('getIntegrationConfiguration and saveIntegrationConfiguration', async () => {
      mockedApiClient.get.mockResolvedValueOnce(tenantEnvelope({}))
      await stateAdminApi.getIntegrationConfiguration()
      expect(mockedApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('MESSAGE_BROKER_CONNECTION_SETTINGS')
      )

      mockedApiClient.put.mockResolvedValueOnce(tenantEnvelope({}))
      await stateAdminApi.saveIntegrationConfiguration({
        apiUrl: 'https://x',
        organizationId: 'o',
        isConfigured: true,
      })
      expect(mockedApiClient.put).toHaveBeenCalled()
    })

    it('getWaterNormsConfiguration and saveWaterNormsConfiguration', async () => {
      mockedApiClient.get.mockResolvedValueOnce(tenantEnvelope({}))
      await stateAdminApi.getWaterNormsConfiguration()
      mockedApiClient.put.mockResolvedValueOnce(tenantEnvelope({}))
      await stateAdminApi.saveWaterNormsConfiguration({
        stateQuantity: null,
        districtOverrides: [],
        oversupplyThreshold: null,
        undersupplyThreshold: null,
        isConfigured: false,
      })
      expect(mockedApiClient.get).toHaveBeenCalled()
      expect(mockedApiClient.put).toHaveBeenCalled()
    })

    it('getMessageTemplates returns empty screens when GLIFIC missing', async () => {
      mockedApiClient.get.mockResolvedValueOnce(tenantEnvelope({}))
      const res = await stateAdminApi.getMessageTemplates()
      expect(res.screens).toEqual({})
      expect(res.supportedLanguages).toEqual([])
    })

    it('getConfiguration and saveConfiguration', async () => {
      mockedApiClient.get.mockResolvedValueOnce(tenantEnvelope({}))
      const got = await stateAdminApi.getConfiguration()
      expect(got.id).toBe('1')

      mockedApiClient.put.mockResolvedValueOnce(tenantEnvelope({}))
      const saved = await stateAdminApi.saveConfiguration(minimalSaveConfigurationPayload)
      expect(saved.id).toBe('1')
      expect(mockedApiClient.put).toHaveBeenCalledWith(
        '/api/v1/tenants/1/config',
        expect.objectContaining({
          configs: expect.objectContaining({
            TENANT_SUPPORTED_CHANNELS: { channels: ['BFM'] },
            LOCATION_CHECK_REQUIRED: { value: 'NO' },
            DISPLAY_DEPARTMENT_MAPS: { value: 'NO' },
          }),
        })
      )
    })

    it('getSystemChannels returns data array', async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: ['BFM', 'ELM'] } } as never)
      await expect(stateAdminApi.getSystemChannels()).resolves.toEqual(['BFM', 'ELM'])
      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/v1/system/channels')
    })

    it('getEscalationRules and saveEscalationRules', async () => {
      mockedApiClient.get.mockResolvedValueOnce(tenantEnvelope({}))
      const rules = await stateAdminApi.getEscalationRules()
      expect(rules.levels).toEqual([])

      mockedApiClient.put.mockResolvedValueOnce(tenantEnvelope({}))
      const payload = {
        schedule: { hour: 9, minute: 0 },
        levels: [{ days: 1, userType: 'SECTION_OFFICER' as const }],
      }
      await stateAdminApi.saveEscalationRules(payload)
      expect(mockedApiClient.put).toHaveBeenCalled()
    })
  })

  describe('logo', () => {
    it('returns blob on success', async () => {
      const blob = new Blob(['x'])
      mockedApiClient.get.mockResolvedValueOnce({ data: blob } as never)
      await expect(stateAdminApi.getLogo()).resolves.toBe(blob)
    })

    it('returns null on 404', async () => {
      const err = new AxiosError('Not found')
      err.response = { status: 404 } as never
      mockedApiClient.get.mockRejectedValueOnce(err)
      await expect(stateAdminApi.getLogo()).resolves.toBeNull()
    })

    it('rethrows non-404 logo errors', async () => {
      const err = new AxiosError('Server error')
      err.response = { status: 500 } as never
      mockedApiClient.get.mockRejectedValueOnce(err)
      await expect(stateAdminApi.getLogo()).rejects.toBe(err)
    })

    it('updateLogo sends multipart', async () => {
      const file = new File(['a'], 'logo.png')
      mockedApiClient.put.mockResolvedValueOnce({} as never)
      await stateAdminApi.updateLogo(file)
      expect(mockedApiClient.put).toHaveBeenCalledWith(
        '/api/v1/tenants/1/logo',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      )
      const formData = mockedApiClient.put.mock.calls[0][1] as FormData
      expect(formData.get('file')).toBe(file)
    })
  })

  describe('staff', () => {
    it('maps staff counts by role', async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          data: [
            { role: 'PUMP_OPERATOR', count: 2 },
            { role: 'SECTION_OFFICER', count: 3 },
            { role: 'SUB_DIVISIONAL_OFFICER', count: 1 },
            { role: 'STATE_ADMIN', count: 4 },
          ],
        },
      } as never)
      const res = await stateAdminApi.getStaffCounts()
      expect(res).toEqual({
        totalStaff: 6,
        pumpOperators: 2,
        sectionOfficers: 3,
        subDivisionOfficers: 1,
        totalAdmins: 4,
      })
    })

    it('getStaffList passes optional filters when set', async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: { content: [], totalElements: 0 } },
      } as never)
      await stateAdminApi.getStaffList({
        roles: ['PUMP_OPERATOR'],
        page: 0,
        limit: 10,
        tenantCode: 'TN',
        status: 'ACTIVE',
        name: 'Ada',
      })
      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/v1/tenant/user/staff', {
        params: expect.objectContaining({
          role: 'PUMP_OPERATOR',
          status: 'ACTIVE',
          name: 'Ada',
          page: 0,
          limit: 10,
          tenantCode: 'TN',
        }),
      })
    })

    it('getStaffList omits optional params when absent', async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: { content: [], totalElements: 0 } },
      } as never)
      await stateAdminApi.getStaffList({
        roles: ['SECTION_OFFICER'],
        page: 1,
        limit: 5,
        tenantCode: 'TN',
      })
      const params = (mockedApiClient.get.mock.calls[0][1] as { params: Record<string, unknown> })
        .params
      expect(params).not.toHaveProperty('status')
      expect(params).not.toHaveProperty('name')
    })

    it('uploadPumpOperators posts FormData with header', async () => {
      const file = new File(['x'], 'staff.xls')
      mockedApiClient.post.mockResolvedValueOnce({} as never)
      await stateAdminApi.uploadPumpOperators(file, 'TN')
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/api/v1/state-admin/pump-operators/upload',
        expect.any(FormData),
        expect.objectContaining({ headers: expect.objectContaining({ 'X-Tenant-Code': 'TN' }) })
      )
      const formData = mockedApiClient.post.mock.calls[0][1] as FormData
      expect(formData.get('file')).toBe(file)
    })
  })

  describe('schemes', () => {
    it('getSchemeCounts returns response.data', async () => {
      const counts = {
        totalSchemes: 10,
        activeSchemes: 7,
        inactiveSchemes: 3,
        statusCounts: [],
        workStatusCounts: [],
        operatingStatusCounts: [],
      }
      mockedApiClient.get.mockResolvedValueOnce({ data: counts } as never)
      await expect(stateAdminApi.getSchemeCounts('TN')).resolves.toEqual(counts)
    })

    it('getSchemeList maps content and optional query params', async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { content: [{ id: 1 }], totalElements: 1 },
      } as never)
      const res = await stateAdminApi.getSchemeList({
        tenantCode: 'TN',
        page: 0,
        limit: 10,
        workStatus: 'W',
        operatingStatus: 'O',
        schemeName: 'S',
        sortDir: 'asc',
      })
      expect(res.items).toEqual([{ id: 1 }])
      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/v1/scheme/schemes', {
        params: expect.objectContaining({
          workStatus: 'W',
          operatingStatus: 'O',
          schemeName: 'S',
          sortDir: 'asc',
        }),
      })
    })

    it('uploadSchemes posts with tenant header', async () => {
      const file = new File(['x'], 's.xls')
      mockedApiClient.post.mockResolvedValueOnce({} as never)
      await stateAdminApi.uploadSchemes(file, 'TN')
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/api/v1/scheme/schemes/upload',
        expect.any(FormData),
        expect.objectContaining({ headers: expect.objectContaining({ 'X-Tenant-Code': 'TN' }) })
      )
      const formData = mockedApiClient.post.mock.calls[0][1] as FormData
      expect(formData.get('file')).toBe(file)
    })

    it('getSchemeMappingsList and uploadSchemeMappings', async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { content: [], totalElements: 0 },
      } as never)
      await stateAdminApi.getSchemeMappingsList({
        tenantCode: 'TN',
        page: 0,
        limit: 5,
        schemeName: 'n',
        sortDir: 'desc',
      })

      const file = new File(['x'], 'm.xls')
      mockedApiClient.post.mockResolvedValueOnce({} as never)
      await stateAdminApi.uploadSchemeMappings(file, 'TN')
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/api/v1/scheme/schemes/mappings/upload',
        expect.any(FormData),
        expect.objectContaining({ headers: expect.objectContaining({ 'X-Tenant-Code': 'TN' }) })
      )
      const formData = mockedApiClient.post.mock.calls[0][1] as FormData
      expect(formData.get('file')).toBe(file)
    })
  })

  describe('state UT admins', () => {
    it('getStateUTAdmins builds query with name and status when provided', async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0 } },
      } as never)
      await stateAdminApi.getStateUTAdmins('TN', {
        page: 0,
        size: 10,
        name: 'Bob',
        status: 'ACTIVE',
      })
      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/v1/users/state-admins', {
        params: { tenantCode: 'TN', page: 0, size: 10, name: 'Bob', status: 'ACTIVE' },
      })
    })

    it('getStateUTAdmins omits name/status when absent', async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0 } },
      } as never)
      await stateAdminApi.getStateUTAdmins('TN', { page: 1, size: 20 })
      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/v1/users/state-admins', {
        params: { tenantCode: 'TN', page: 1, size: 20 },
      })
    })

    it('maps ACTIVE, PENDING, and INACTIVE API user statuses', async () => {
      const fetchAdmin = async (status: 'ACTIVE' | 'PENDING' | 'INACTIVE') => {
        mockedApiClient.get.mockResolvedValueOnce({
          data: {
            data: {
              id: 1,
              email: 'e@e.com',
              firstName: 'F',
              lastName: 'L',
              phoneNumber: '1',
              status,
            },
          },
        } as never)
        return stateAdminApi.getStateUTAdminById('1')
      }
      await expect(fetchAdmin('ACTIVE')).resolves.toMatchObject({ status: 'active' })
      await expect(fetchAdmin('PENDING')).resolves.toMatchObject({ status: 'pending' })
      await expect(fetchAdmin('INACTIVE')).resolves.toMatchObject({ status: 'inactive' })
    })

    it('returns null when state UT admin is not found', async () => {
      const err = new AxiosError('Not found')
      err.response = { status: 404 } as never
      mockedApiClient.get.mockRejectedValueOnce(err)
      await expect(stateAdminApi.getStateUTAdminById('missing')).resolves.toBeNull()
    })

    it('rethrows non-404 getStateUTAdminById errors', async () => {
      const err = new AxiosError('Bad')
      err.response = { status: 400 } as never
      mockedApiClient.get.mockRejectedValueOnce(err)
      await expect(stateAdminApi.getStateUTAdminById('1')).rejects.toBe(err)
    })

    it('updateStateUTAdmin patches user', async () => {
      mockedApiClient.patch.mockResolvedValueOnce({} as never)
      await stateAdminApi.updateStateUTAdmin('9', {
        firstName: 'A',
        lastName: 'B',
        phone: '99',
      })
      expect(mockedApiClient.patch).toHaveBeenCalledWith('/api/v1/users/9', {
        firstName: 'A',
        lastName: 'B',
        phoneNumber: '99',
      })
    })

    it('updateStateUTAdminStatus posts deactivate for inactive', async () => {
      mockedApiClient.post.mockResolvedValueOnce({} as never)
      await stateAdminApi.updateStateUTAdminStatus('9', 'inactive')
      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/v1/users/9/deactivate')
    })

    it('updateStateUTAdminStatus posts activate for active', async () => {
      mockedApiClient.post.mockResolvedValueOnce({} as never)
      await stateAdminApi.updateStateUTAdminStatus('9', 'active')
      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/v1/users/9/activate')
    })

    it('inviteStateUTAdmin and reinviteStateUTAdmin', async () => {
      mockedApiClient.post.mockResolvedValueOnce({} as never)
      await stateAdminApi.inviteStateUTAdmin({
        firstName: 'A',
        lastName: 'B',
        phoneNumber: '1',
        email: 'e@e.com',
        tenantCode: 'TN',
      })
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/api/v1/users/invitations',
        expect.objectContaining({ role: 'STATE_ADMIN', tenantCode: 'TN' })
      )

      mockedApiClient.post.mockResolvedValueOnce({} as never)
      await stateAdminApi.reinviteStateUTAdmin('12')
      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/v1/users/12/invitations')
    })
  })

  describe('hierarchy', () => {
    it('maps LGD hierarchy from API levels', async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            hierarchyType: 'LGD',
            levels: [{ level: 1, levelName: [{ title: 'State' }] }],
          },
        },
      } as never)
      const res = await stateAdminApi.getLgdHierarchy()
      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/v1/tenants/1/location-hierarchy/LGD')
      expect(res.hierarchyType).toBe('LGD')
      expect(res.levels[0]).toEqual({ level: 1, name: 'State' })
    })

    it('getDepartmentHierarchy maps DEPARTMENT type', async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            levels: [{ level: 1, levelName: [{ title: 'Dept' }] }],
          },
        },
      } as never)
      const res = await stateAdminApi.getDepartmentHierarchy()
      expect(res.hierarchyType).toBe('DEPARTMENT')
      expect(res.levels[0]?.name).toBe('Dept')
    })

    it('getLgdEditConstraints and getDepartmentEditConstraints', async () => {
      const lgdConstraints = {
        hierarchyType: 'LGD' as const,
        structuralChangesAllowed: true,
        seededRecordCount: 0,
      }
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: lgdConstraints } } as never)
      await expect(stateAdminApi.getLgdEditConstraints()).resolves.toEqual(lgdConstraints)
      const deptConstraints = {
        hierarchyType: 'DEPARTMENT' as const,
        structuralChangesAllowed: false,
        seededRecordCount: 5,
      }
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: deptConstraints } } as never)
      await expect(stateAdminApi.getDepartmentEditConstraints()).resolves.toEqual(deptConstraints)
    })

    it('saveLgdHierarchy and saveDepartmentHierarchy', async () => {
      const levels = [{ level: 1, name: 'State' }]
      mockedApiClient.put.mockResolvedValueOnce({
        data: {
          data: {
            levels: [{ level: 1, levelName: [{ title: 'State' }] }],
          },
        },
      } as never)
      const lgd = await stateAdminApi.saveLgdHierarchy(levels)
      expect(lgd.hierarchyType).toBe('LGD')

      mockedApiClient.put.mockResolvedValueOnce({
        data: {
          data: {
            levels: [{ level: 1, levelName: [{ title: 'D' }] }],
          },
        },
      } as never)
      const dept = await stateAdminApi.saveDepartmentHierarchy(levels)
      expect(dept.hierarchyType).toBe('DEPARTMENT')
    })
  })

  describe('broadcast and config status', () => {
    it('broadcastWelcomeMessage posts with tenant query', async () => {
      mockedApiClient.post.mockResolvedValueOnce({} as never)
      await stateAdminApi.broadcastWelcomeMessage({
        roles: ['PUMP_OPERATOR'],
        type: 'EMAIL',
        onboardedAfter: '2026-01-01',
        onboardedBefore: '2026-02-01',
      })
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/api/v1/tenant/user/welcome?tenantCode=TN',
        expect.any(Object)
      )
    })

    it('throws when broadcast welcome is called without tenant code', async () => {
      mockedGetState.mockReturnValue({ user: { tenantId: '1', tenantCode: '' } })
      await expect(
        stateAdminApi.broadcastWelcomeMessage({
          roles: ['PUMP_OPERATOR'],
          type: 'EMAIL',
          onboardedAfter: '2026-01-01',
          onboardedBefore: '2026-02-01',
        })
      ).rejects.toThrow(/tenantCode unavailable/)
    })

    it('getConfigStatus filters unknown keys and invalid statuses', async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            configs: {
              NOT_A_REAL_KEY: { status: 'CONFIGURED', mandatory: true },
              SUPPORTED_LANGUAGES: { status: 'PENDING', mandatory: false },
              WATER_NORM: { status: 'WRONG', mandatory: true },
              TENANT_LOGO: { status: 'CONFIGURED', mandatory: false },
            },
          },
        },
      } as never)
      const res = await stateAdminApi.getConfigStatus()
      expect(res.SUPPORTED_LANGUAGES).toEqual({ status: 'PENDING', mandatory: false })
      expect(res.TENANT_LOGO).toEqual({ status: 'CONFIGURED', mandatory: false })
      expect('NOT_A_REAL_KEY' in res).toBe(false)
      expect(res.WATER_NORM).toBeUndefined()
    })
  })
})
