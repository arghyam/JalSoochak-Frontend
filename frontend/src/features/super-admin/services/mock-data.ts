import type { SuperAdminOverviewData } from '../types/overview'
import type { SuperUser, CreateSuperUserInput, UpdateSuperUserInput } from '../types/super-users'
import type { SystemRulesConfiguration } from '../types/system-rules'
import type { IngestionMonitorData } from '../types/ingestion-monitor'
import type { ApiCredentialsData } from '../types/api-credentials'
import type { SystemConfiguration, SaveSystemConfigPayload } from '../types/system-config'
import {
  INDIAN_STATES_UTS,
  type StateUT,
  type CreateStateUTInput,
  type UpdateStateUTInput,
  type StateUTOption,
  type StateAdminDetails,
} from '../types/states-uts'
import type { StateAdmin } from '../types/state-admins'
import type { CreateTenantInput, Tenant } from '../types/tenant'

export const mockSuperAdminOverviewData: SuperAdminOverviewData = {
  stats: {
    totalStatesManaged: 28,
    activeStates: 26,
    inactiveStates: 2,
  },
  ingestionData: [
    { month: 'Jan', successfulIngestions: 520, failedIngestions: 16 },
    { month: 'Feb', successfulIngestions: 680, failedIngestions: 20 },
    { month: 'Mar', successfulIngestions: 850, failedIngestions: 28 },
    { month: 'Apr', successfulIngestions: 320, failedIngestions: 24 },
    { month: 'May', successfulIngestions: 580, failedIngestions: 18 },
    { month: 'Jun', successfulIngestions: 720, failedIngestions: 22 },
    { month: 'Jul', successfulIngestions: 420, failedIngestions: 8 },
    { month: 'Aug', successfulIngestions: 850, failedIngestions: 26 },
    { month: 'Sep', successfulIngestions: 680, failedIngestions: 20 },
    { month: 'Oct', successfulIngestions: 620, failedIngestions: 18 },
    { month: 'Nov', successfulIngestions: 650, failedIngestions: 22 },
    { month: 'Dec', successfulIngestions: 820, failedIngestions: 24 },
  ],
  waterSupplyOutages: [
    {
      label: 'Andhra Pradesh',
      electricityFailure: 10,
      pipelineLeak: 18,
      pumpFailure: 14,
      valveIssue: 22,
      sourceDrying: 26,
    },
    {
      label: 'Gujarat',
      electricityFailure: 12,
      pipelineLeak: 16,
      pumpFailure: 18,
      valveIssue: 20,
      sourceDrying: 22,
    },
    {
      label: 'Karnataka',
      electricityFailure: 20,
      pipelineLeak: 14,
      pumpFailure: 12,
      valveIssue: 18,
      sourceDrying: 26,
    },
    {
      label: 'Maharashtra',
      electricityFailure: 14,
      pipelineLeak: 12,
      pumpFailure: 22,
      valveIssue: 16,
      sourceDrying: 20,
    },
    {
      label: 'Rajasthan',
      electricityFailure: 18,
      pipelineLeak: 20,
      pumpFailure: 16,
      valveIssue: 14,
      sourceDrying: 12,
    },
    {
      label: 'Tamil Nadu',
      electricityFailure: 15,
      pipelineLeak: 19,
      pumpFailure: 11,
      valveIssue: 21,
      sourceDrying: 24,
    },
    {
      label: 'Uttar Pradesh',
      electricityFailure: 16,
      pipelineLeak: 14,
      pumpFailure: 20,
      valveIssue: 18,
      sourceDrying: 22,
    },
    {
      label: 'West Bengal',
      electricityFailure: 11,
      pipelineLeak: 22,
      pumpFailure: 15,
      valveIssue: 19,
      sourceDrying: 23,
    },
    {
      label: 'Bihar',
      electricityFailure: 19,
      pipelineLeak: 13,
      pumpFailure: 17,
      valveIssue: 21,
      sourceDrying: 20,
    },
    {
      label: 'Kerala',
      electricityFailure: 13,
      pipelineLeak: 17,
      pumpFailure: 19,
      valveIssue: 17,
      sourceDrying: 24,
    },
  ],
}

export const getMockSuperAdminOverviewData = (): Promise<SuperAdminOverviewData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockSuperAdminOverviewData)
    }, 300)
  })
}

// System Rules Configuration Mock Data
let mockSystemRulesConfiguration: SystemRulesConfiguration = {
  id: '',
  coverage: '',
  continuity: '',
  quantity: '',
  regularity: '',
  isConfigured: false,
}

export const getMockSystemRulesConfiguration = (): Promise<SystemRulesConfiguration> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ ...mockSystemRulesConfiguration })
    }, 300)
  })
}

export const saveMockSystemRulesConfiguration = (
  config: Omit<SystemRulesConfiguration, 'id'>
): Promise<SystemRulesConfiguration> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const savedConfig: SystemRulesConfiguration = {
        id: '1',
        coverage: config.coverage,
        continuity: config.continuity,
        quantity: config.quantity,
        regularity: config.regularity,
        isConfigured: true,
      }
      mockSystemRulesConfiguration = savedConfig
      resolve(savedConfig)
    }, 500)
  })
}

// Ingestion Monitor Mock Data
export const mockIngestionMonitorData: IngestionMonitorData = {
  stats: {
    totalIngestions: 5234,
    successfulIngestions: 4890,
    failedIngestions: 344,
    currentWarnings: 12,
    successRate: 93.4,
    failureRate: 6.6,
  },
  chartData: [
    { month: 'Jan', successfulIngestions: 520, failedIngestions: 16 },
    { month: 'Feb', successfulIngestions: 680, failedIngestions: 20 },
    { month: 'Mar', successfulIngestions: 850, failedIngestions: 28 },
    { month: 'Apr', successfulIngestions: 320, failedIngestions: 24 },
    { month: 'May', successfulIngestions: 580, failedIngestions: 18 },
    { month: 'Jun', successfulIngestions: 720, failedIngestions: 22 },
    { month: 'Jul', successfulIngestions: 420, failedIngestions: 8 },
    { month: 'Aug', successfulIngestions: 850, failedIngestions: 26 },
    { month: 'Sep', successfulIngestions: 680, failedIngestions: 20 },
    { month: 'Oct', successfulIngestions: 620, failedIngestions: 18 },
    { month: 'Nov', successfulIngestions: 650, failedIngestions: 22 },
    { month: 'Dec', successfulIngestions: 820, failedIngestions: 24 },
  ],
  logs: [
    {
      id: '1',
      title: "District data package 'CAL-D001' ingested successfully.",
      description: 'Records processed: 12,345',
      batchId: '5f7c3d1e-8a9b-4c0d-9e2f',
      sourceSystem: 'State Data Hub',
      processingTime: '150ms',
      recordsProcessed: 12345,
      status: 'successful',
      timestamp: new Date('2025-11-20T10:30:00'),
    },
    {
      id: '2',
      title: "Partial ingestion for 'FL-D010'. 5% of records malformed.",
      description:
        "Issue: Data validation for 50 out of 1000 records due to missing 'district_id'. Review schema compliance for future submissions.",
      batchId: '5f7c3d1e-8a9b-4c0d-9e2f',
      sourceSystem: 'State Data Hub',
      processingTime: '150ms',
      status: 'warning',
      timestamp: new Date('2025-11-20T10:30:00'),
      issueDetails:
        "Data validation for 50 out of 1000 records due to missing 'district_id'. Review schema compliance for future submissions.",
    },
    {
      id: '3',
      title: "Database connection lost during 'CAL-D002' ingestion. Reconnection attempt failed.",
      description:
        'Error: DB_CONNECT_TIMEOUT Service Status: Database service appears offline. Data ingestion from this district is paused.',
      batchId: '5f7c3d1e-8a9b-4c0d-9e2f',
      sourceSystem: 'State Data Hub',
      processingTime: '150ms',
      status: 'failed',
      timestamp: new Date('2025-11-20T10:30:00'),
      errorDetails:
        'DB_CONNECT_TIMEOUT Service Status: Database service appears offline. Data ingestion from this district is paused.',
    },
  ],
}

export const getMockIngestionMonitorData = (): Promise<IngestionMonitorData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockIngestionMonitorData)
    }, 300)
  })
}

// API Credentials Mock Data
export const mockApiCredentialsData: ApiCredentialsData = {
  credentials: [
    {
      id: '1',
      stateUtName: 'Maharashtra',
      apiKey: 'ak-r88880z1a',
      lastUsed: new Date('2025-09-08T15:00:00'),
      createdOn: new Date('2025-02-05'),
      nextRotation: new Date('2025-09-10'),
      status: 'active',
    },
    {
      id: '2',
      stateUtName: 'Himachal Pradesh',
      apiKey: 'ak-r88880z1a',
      lastUsed: new Date('2025-09-08T15:00:00'),
      createdOn: new Date('2025-02-05'),
      nextRotation: new Date('2025-09-10'),
      status: 'inactive',
    },
    {
      id: '3',
      stateUtName: 'Gujarat',
      apiKey: 'ak-r88880z1a',
      lastUsed: new Date('2025-09-08T15:00:00'),
      createdOn: new Date('2025-02-05'),
      nextRotation: new Date('2025-09-10'),
      status: 'inactive',
    },
    {
      id: '4',
      stateUtName: 'Haryana',
      apiKey: 'ak-r88880z1a',
      lastUsed: new Date('2025-09-08T15:00:00'),
      createdOn: new Date('2025-02-05'),
      nextRotation: new Date('2025-09-10'),
      status: 'active',
    },
    {
      id: '5',
      stateUtName: 'Punjab',
      apiKey: 'ak-r88880z1a',
      lastUsed: new Date('2025-09-08T15:00:00'),
      createdOn: new Date('2025-02-05'),
      nextRotation: new Date('2025-09-10'),
      status: 'active',
    },
    {
      id: '6',
      stateUtName: 'Uttar Pradesh',
      apiKey: 'ak-r88880z1a',
      lastUsed: new Date('2025-09-08T15:00:00'),
      createdOn: new Date('2025-02-05'),
      nextRotation: new Date('2025-09-10'),
      status: 'active',
    },
  ],
}

export const getMockApiCredentialsData = (): Promise<ApiCredentialsData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockApiCredentialsData)
    }, 300)
  })
}

export const generateApiKey = (_stateId: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const randomPart = Math.random().toString(36).substring(2, 10)
      resolve(`ak-${randomPart}`)
    }, 300)
  })
}

export const sendApiKey = (_stateId: string): Promise<{ success: boolean }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true })
    }, 300)
  })
}

// States/UTs Mock Data
const mockStatesUTsData: StateUT[] = [
  {
    id: '1',
    name: 'Andhra Pradesh',
    code: '28',
    status: 'active',
    lastSyncDate: new Date('2025-09-08T15:00:00'),
    totalDistricts: 29,
    admin: {
      firstName: 'Rajesh',
      lastName: 'Kumar',
      email: 'rajesh.kumar@jalsoochak.com',
      phone: '9876543210',
      secondaryEmail: '',
      contactNumber: '',
    },
  },
  {
    id: '2',
    name: 'Arunachal Pradesh',
    code: '12',
    status: 'active',
    lastSyncDate: new Date('2025-11-02T09:30:00'),
    totalDistricts: 28,
    admin: {
      firstName: 'Tenzin',
      lastName: 'Dorje',
      email: 'tenzin.dorje@jalsoochak.com',
      phone: '9876543211',
    },
  },
  {
    id: '3',
    name: 'Assam',
    code: '18',
    status: 'active',
    lastSyncDate: new Date('2025-08-22T13:30:00'),
    totalDistricts: 35,
    admin: {
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya.sharma@jalsoochak.com',
      phone: '9876543212',
    },
  },
  {
    id: '4',
    name: 'Bihar',
    code: '10',
    status: 'active',
    lastSyncDate: new Date('2025-02-16T18:00:00'),
    totalDistricts: 38,
    admin: {
      firstName: 'Amit',
      lastName: 'Singh',
      email: 'amit.singh@jalsoochak.com',
      phone: '9876543213',
    },
  },
  {
    id: '5',
    name: 'Chhattisgarh',
    code: '22',
    status: 'active',
    lastSyncDate: new Date('2025-04-29T11:00:00'),
    totalDistricts: 33,
    admin: {
      firstName: 'Sunita',
      lastName: 'Verma',
      email: 'sunita.verma@jalsoochak.com',
      phone: '9876543214',
    },
  },
  {
    id: '6',
    name: 'Goa',
    code: '30',
    status: 'active',
    lastSyncDate: new Date('2025-12-04T16:30:00'),
    totalDistricts: 2,
    admin: {
      firstName: 'Miguel',
      lastName: 'Fernandes',
      email: 'miguel.fernandes@jalsoochak.com',
      phone: '9876543215',
    },
  },
  {
    id: '7',
    name: 'Gujarat',
    code: '24',
    status: 'inactive',
    lastSyncDate: new Date('2025-07-19T07:00:00'),
    totalDistricts: 33,
    admin: {
      firstName: 'Kiran',
      lastName: 'Patel',
      email: 'kiran.patel@jalsoochak.com',
      phone: '9876543216',
    },
  },
  {
    id: '8',
    name: 'Haryana',
    code: '06',
    status: 'active',
    lastSyncDate: new Date('2025-03-06T14:00:00'),
    totalDistricts: 23,
    admin: {
      firstName: 'Deepak',
      lastName: 'Yadav',
      email: 'deepak.yadav@jalsoochak.com',
      phone: '9876543217',
    },
  },
  {
    id: '9',
    name: 'Himachal Pradesh',
    code: '02',
    status: 'inactive',
    lastSyncDate: new Date('2025-05-14T12:30:00'),
    totalDistricts: 12,
    admin: {
      firstName: 'Anita',
      lastName: 'Thakur',
      email: 'anita.thakur@jalsoochak.com',
      phone: '9876543218',
    },
  },
  {
    id: '10',
    name: 'Jharkhand',
    code: '20',
    status: 'active',
    lastSyncDate: new Date('2025-09-11T20:30:00'),
    totalDistricts: 24,
    admin: {
      firstName: 'Ravi',
      lastName: 'Oraon',
      email: 'ravi.oraon@jalsoochak.com',
      phone: '9876543219',
    },
  },
]

export const getMockStatesUTsData = (): Promise<StateUT[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockStatesUTsData])
    }, 300)
  })
}

export const getStateUTById = (id: string): Promise<StateUT> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const state = mockStatesUTsData.find((s) => s.id === id)
      if (!state) {
        reject(new Error(`StateUT with id "${id}" not found`))
        return
      }
      resolve({ ...state })
    }, 300)
  })
}

export const createStateUT = (data: CreateStateUTInput): Promise<StateUT> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newState: StateUT = {
        id: String(mockStatesUTsData.length + 1),
        name: data.name,
        code: data.code,
        status: 'active',
        lastSyncDate: new Date(),
        totalDistricts: 0,
        admin: {
          firstName: data.admin.firstName,
          lastName: data.admin.lastName,
          email: data.admin.email,
          phone: data.admin.phone,
          secondaryEmail: data.admin.secondaryEmail,
          contactNumber: data.admin.contactNumber,
        },
      }
      mockStatesUTsData.push(newState)
      resolve({ ...newState })
    }, 500)
  })
}

export const updateStateUT = (id: string, data: UpdateStateUTInput): Promise<StateUT> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockStatesUTsData.findIndex((s) => s.id === id)
      if (index === -1) {
        reject(new Error(`StateUT with id "${id}" not found`))
        return
      }
      mockStatesUTsData[index] = {
        ...mockStatesUTsData[index],
        admin: {
          ...mockStatesUTsData[index].admin,
          firstName: data.admin.firstName,
          lastName: data.admin.lastName,
          phone: data.admin.phone,
          secondaryEmail: data.admin.secondaryEmail,
          contactNumber: data.admin.contactNumber,
        },
      }
      resolve({ ...mockStatesUTsData[index] })
    }, 500)
  })
}

export const updateStateUTStatus = (
  id: string,
  status: 'active' | 'inactive'
): Promise<StateUT> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockStatesUTsData.findIndex((s) => s.id === id)
      if (index === -1) {
        reject(new Error(`StateUT with id "${id}" not found`))
        return
      }
      mockStatesUTsData[index] = {
        ...mockStatesUTsData[index],
        status,
      }
      resolve({ ...mockStatesUTsData[index] })
    }, 300)
  })
}

// State/UT Admins mock data (for Manage State/UTs Admins page)
const mockStateAdminsData: StateAdmin[] = [
  {
    id: 'sa-1',
    adminName: 'Ravi Kumar',
    stateUt: 'Andhra Pradesh',
    mobileNumber: '+91 98452-85564',
    emailAddress: 'ravi@gmail.com',
    signupStatus: 'completed',
    stateUtId: '1',
  },
  {
    id: 'sa-2',
    adminName: 'Vijay Yadav',
    stateUt: 'Arunachal Pradesh',
    mobileNumber: '+91 74185-96321',
    emailAddress: 'vijay@gmail.com',
    signupStatus: 'pending',
    stateUtId: '2',
  },
  {
    id: 'sa-3',
    adminName: 'Rohan',
    stateUt: 'Assam',
    mobileNumber: '+91 98765-43210',
    emailAddress: 'rohan@gmail.com',
    signupStatus: 'completed',
    stateUtId: '3',
  },
  {
    id: 'sa-4',
    adminName: 'Sanjeev Kumar',
    stateUt: 'Bihar',
    mobileNumber: '+91 87654-90123',
    emailAddress: 'sanjeev@gmail.com',
    signupStatus: 'pending',
    stateUtId: '4',
  },
  {
    id: 'sa-5',
    adminName: 'Sunita Verma',
    stateUt: 'Chhattisgarh',
    mobileNumber: '+91 76543-21098',
    emailAddress: 'sunita.verma@jalsoochak.com',
    signupStatus: 'completed',
    stateUtId: '5',
  },
  {
    id: 'sa-6',
    adminName: 'Miguel Fernandes',
    stateUt: 'Goa',
    mobileNumber: '+91 65432-10987',
    emailAddress: 'miguel.fernandes@jalsoochak.com',
    signupStatus: 'completed',
    stateUtId: '6',
  },
  {
    id: 'sa-7',
    adminName: 'Kiran Patel',
    stateUt: 'Gujarat',
    mobileNumber: '+91 54321-09876',
    emailAddress: 'kiran.patel@jalsoochak.com',
    signupStatus: 'pending',
    stateUtId: '7',
  },
  {
    id: 'sa-8',
    adminName: 'Deepak Yadav',
    stateUt: 'Haryana',
    mobileNumber: '+91 43210-98765',
    emailAddress: 'deepak.yadav@jalsoochak.com',
    signupStatus: 'completed',
    stateUtId: '8',
  },
  {
    id: 'sa-9',
    adminName: 'Anita Thakur',
    stateUt: 'Himachal Pradesh',
    mobileNumber: '+91 32109-87654',
    emailAddress: 'anita.thakur@jalsoochak.com',
    signupStatus: 'completed',
    stateUtId: '9',
  },
  {
    id: 'sa-10',
    adminName: 'Ravi Oraon',
    stateUt: 'Jharkhand',
    mobileNumber: '+91 21098-76543',
    emailAddress: 'ravi.oraon@jalsoochak.com',
    signupStatus: 'completed',
    stateUtId: '10',
  },
]

export const getMockStateAdminsData = (): Promise<StateAdmin[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockStateAdminsData])
    }, 300)
  })
}

export const getAssignedStateNames = (): string[] => {
  return mockStatesUTsData.map((s) => s.name)
}

export const getStateUTOptions = (): Promise<StateUTOption[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...INDIAN_STATES_UTS])
    }, 300)
  })
}

/** Dummy implementation until real create-admin API is available. */
export const createStateAdmin = (
  _tenantId: string,
  _admin: StateAdminDetails
): Promise<{ success: boolean }> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true }), 300)
  })
}

export function mockCreateTenant(payload: CreateTenantInput): Promise<Tenant> {
  const now = new Date().toISOString()
  const tenant: Tenant = {
    id: 1,
    uuid: `mock-${payload.stateCode.toLowerCase()}-${Date.now()}`,
    stateCode: payload.stateCode,
    lgdCode: payload.lgdCode,
    name: payload.name,
    status: 'ACTIVE',
    createdAt: now,
    createdBy: 'system',
    onBoardedAt: now,
    updatedAt: now,
    updatedBy: 'system',
  }
  return Promise.resolve(tenant)
}

// Super Users Mock Data
const mockSuperUsersData: SuperUser[] = [
  {
    id: 'su-1',
    firstName: 'Ravi',
    lastName: 'Kumar',
    email: 'ravi@gmail.com',
    phone: '9845285564',
    status: 'active',
  },
  {
    id: 'su-2',
    firstName: 'Vijay',
    lastName: 'Yadav',
    email: 'vijay@gmail.com',
    phone: '7418596321',
    status: 'active',
  },
  {
    id: 'su-3',
    firstName: 'Rohan',
    lastName: 'Sharma',
    email: 'rohan@gmail.com',
    phone: '9876543210',
    status: 'active',
  },
  {
    id: 'su-4',
    firstName: 'Sanjeev',
    lastName: 'Kumar',
    email: 'sanjeev@gmail.com',
    phone: '8765490123',
    status: 'inactive',
  },
]

let nextMockSuperUserId = mockSuperUsersData.length + 1

export const getMockSuperUsers = (): Promise<SuperUser[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockSuperUsersData])
    }, 300)
  })
}

export const getMockSuperUserById = (id: string): Promise<SuperUser | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = mockSuperUsersData.find((u) => u.id === id) ?? null
      resolve(user ? { ...user } : null)
    }, 300)
  })
}

export const createMockSuperUser = (input: CreateSuperUserInput): Promise<SuperUser> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newUser: SuperUser = {
        id: `su-${nextMockSuperUserId++}`,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        status: 'active',
      }
      mockSuperUsersData.push(newUser)
      resolve({ ...newUser })
    }, 500)
  })
}

export const updateMockSuperUser = (
  id: string,
  input: UpdateSuperUserInput
): Promise<SuperUser> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockSuperUsersData.findIndex((u) => u.id === id)
      if (index === -1) {
        reject(new Error(`SuperUser with id "${id}" not found`))
        return
      }
      mockSuperUsersData[index] = {
        ...mockSuperUsersData[index],
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
      }
      resolve({ ...mockSuperUsersData[index] })
    }, 500)
  })
}

export const updateMockSuperUserStatus = (
  id: string,
  status: 'active' | 'inactive'
): Promise<SuperUser> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockSuperUsersData.findIndex((u) => u.id === id)
      if (index === -1) {
        reject(new Error(`SuperUser with id "${id}" not found`))
        return
      }
      mockSuperUsersData[index] = { ...mockSuperUsersData[index], status }
      resolve({ ...mockSuperUsersData[index] })
    }, 300)
  })
}

// ─── System Configuration ─────────────────────────────────────────────────────

let mockSystemConfigData: SystemConfiguration = {
  supportedChannels: ['BFM', 'MAN', 'ELM', 'PDU', 'IOT'],
  waterQuantityMaxThreshold: 100,
  waterQuantityMinThreshold: 100,
  bfmImageConfidenceThreshold: 89,
  locationAffinityThreshold: 78,
}

export function getMockSystemConfiguration(): Promise<SystemConfiguration> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ ...mockSystemConfigData })
    }, 300)
  })
}

export function saveMockSystemConfiguration(
  payload: SaveSystemConfigPayload
): Promise<SystemConfiguration> {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockSystemConfigData = { ...payload }
      resolve({ ...mockSystemConfigData })
    }, 500)
  })
}
