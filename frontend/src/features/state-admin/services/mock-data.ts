import type { OverviewData } from '../types/overview'
import type { ActivityLog } from '../types/activity'
import type { LanguageConfiguration } from '../types/language'
import type { IntegrationConfiguration } from '../types/integration'
import type { WaterNormsConfiguration } from '../types/water-norms'
import type { Escalation } from '../types/escalations'
import type { ThresholdConfiguration } from '../types/thresholds'
import type { NudgeTemplate } from '../types/nudges'
import type { StaffSyncData } from '../types/staff-sync'
import type { ConfigurationData } from '../types/configuration'
import { DEFAULT_METER_CHANGE_REASONS } from '../types/configuration'
import type {
  StateUTAdmin,
  CreateStateUTAdminInput,
  UpdateStateUTAdminInput,
} from '../types/state-ut-admins'
import type { EscalationRulesConfig } from '../types/escalation-rules'
import type { MessageTemplatesData } from '../types/message-templates'

export const mockOverviewData: OverviewData = {
  stats: {
    configurationStatus: { value: 'Completed', subtitle: 'All modules configured' },
    activeStaff: { value: 2543, subtitle: 'Out of 3000 total' },
    activeSchemes: { value: 147, subtitle: 'Across 12 Sub-Divisions' },
    activeIntegrations: { value: 2, subtitle: 'WhatsApp, Email' },
  },
}

export const getMockOverviewData = (): Promise<OverviewData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockOverviewData)
    }, 300)
  })
}

export const mockActivityData: ActivityLog[] = [
  {
    id: '1',
    timestamp: new Date('2025-09-08T15:00:00'),
    action: 'Reload State Configuration',
    status: 'Success',
  },
  {
    id: '2',
    timestamp: new Date('2025-11-02T09:30:00'),
    action: 'Clear Cache',
    status: 'Failed',
  },
  {
    id: '3',
    timestamp: new Date('2025-08-22T13:30:00'),
    action: 'Test Integrations',
    status: 'Success',
  },
  {
    id: '4',
    timestamp: new Date('2025-02-16T18:00:00'),
    action: 'Reload State Configuration',
    status: 'Success',
  },
  {
    id: '5',
    timestamp: new Date('2025-04-29T11:00:00'),
    action: 'Reload State Configuration',
    status: 'Success',
  },
  {
    id: '6',
    timestamp: new Date('2025-12-04T16:30:00'),
    action: 'Test Integrations',
    status: 'Success',
  },
  {
    id: '7',
    timestamp: new Date('2025-07-19T19:00:00'),
    action: 'Reload State Configuration',
    status: 'Failed',
  },
  {
    id: '8',
    timestamp: new Date('2025-03-06T14:00:00'),
    action: 'Clear Cache',
    status: 'Success',
  },
  {
    id: '9',
    timestamp: new Date('2025-05-14T12:30:00'),
    action: 'Test Integrations',
    status: 'Success',
  },
  {
    id: '10',
    timestamp: new Date('2025-01-15T08:45:00'),
    action: 'Reload State Configuration',
    status: 'Success',
  },
]

export const getMockActivityData = (): Promise<ActivityLog[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockActivityData)
    }, 300)
  })
}

// Language Configuration Mock Data
export const mockLanguageConfiguration: LanguageConfiguration = {
  id: '',
  primaryLanguage: '',
  secondaryLanguage: '',
  tertiaryLanguage: '',
  isConfigured: false,
}

export const getMockLanguageConfiguration = (): Promise<LanguageConfiguration> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockLanguageConfiguration)
    }, 300)
  })
}

export const saveMockLanguageConfiguration = (
  config: Omit<LanguageConfiguration, 'id'>
): Promise<LanguageConfiguration> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const savedConfig: LanguageConfiguration = {
        id: '1',
        primaryLanguage: config.primaryLanguage as string,
        secondaryLanguage: config.secondaryLanguage as string | undefined,
        tertiaryLanguage: config.tertiaryLanguage as string | undefined,
        isConfigured: true,
      }
      resolve(savedConfig)
    }, 500)
  })
}

// Integration Configuration Mock Data
export const mockIntegrationConfiguration: IntegrationConfiguration = {
  id: '',
  apiUrl: '',
  apiKey: '',
  organizationId: '',
  isConfigured: false,
}

export const getMockIntegrationConfiguration = (): Promise<IntegrationConfiguration> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockIntegrationConfiguration)
    }, 300)
  })
}

export const saveMockIntegrationConfiguration = (
  config: Omit<IntegrationConfiguration, 'id' | 'isConfigured' | 'apiKey'> & { apiKey?: string }
): Promise<IntegrationConfiguration> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const savedConfig: IntegrationConfiguration = {
        id: '1',
        apiUrl: config.apiUrl as string,
        apiKey: config.apiKey ?? '',
        organizationId: config.organizationId as string,
        isConfigured: true,
      }
      resolve(savedConfig)
    }, 500)
  })
}

// Water Norms Configuration Mock Data
let mockWaterNormsConfiguration: WaterNormsConfiguration = {
  id: '',
  stateQuantity: 0,
  districtOverrides: [],
  oversupplyThreshold: 0,
  undersupplyThreshold: 0,
  isConfigured: false,
}

export const getMockWaterNormsConfiguration = (): Promise<WaterNormsConfiguration> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ ...mockWaterNormsConfiguration })
    }, 300)
  })
}

export const saveMockWaterNormsConfiguration = (
  config: Omit<WaterNormsConfiguration, 'id'>
): Promise<WaterNormsConfiguration> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const savedConfig: WaterNormsConfiguration = {
        id: '1',
        stateQuantity: Number(config.stateQuantity),
        districtOverrides: Array.isArray(config.districtOverrides) ? config.districtOverrides : [],
        oversupplyThreshold: Number(config.oversupplyThreshold),
        undersupplyThreshold: Number(config.undersupplyThreshold),
        isConfigured: true,
      }
      mockWaterNormsConfiguration = savedConfig
      resolve(savedConfig)
    }, 500)
  })
}

// Escalations Mock Data
let mockEscalations: Escalation[] = [
  {
    id: '1',
    name: 'Water Quantity Alert',
    alertType: 'water-quantity-alert',
    levels: [
      {
        id: 'level-1-1',
        levelNumber: 1,
        targetRole: 'pump-operator',
        escalateAfterHours: 12,
      },
      {
        id: 'level-1-2',
        levelNumber: 2,
        targetRole: 'section-officer',
        escalateAfterHours: 20,
      },
    ],
  },
  {
    id: '2',
    name: 'Operator Inactivity Alert',
    alertType: 'operator-inactivity-alert',
    levels: [
      {
        id: 'level-2-1',
        levelNumber: 1,
        targetRole: 'pump-operator',
        escalateAfterHours: 12,
      },
      {
        id: 'level-2-2',
        levelNumber: 2,
        targetRole: 'section-officer',
        escalateAfterHours: 20,
      },
      {
        id: 'level-2-3',
        levelNumber: 3,
        targetRole: 'sub-divisional-officer',
        escalateAfterHours: 48,
      },
    ],
  },
  {
    id: '3',
    name: 'Repeated Non-Compliance Escalation',
    alertType: 'repeated-non-compliance',
    levels: [
      {
        id: 'level-3-1',
        levelNumber: 1,
        targetRole: 'pump-operator',
        escalateAfterHours: 12,
      },
      {
        id: 'level-3-2',
        levelNumber: 2,
        targetRole: 'section-officer',
        escalateAfterHours: 20,
      },
    ],
  },
  {
    id: '4',
    name: 'Delayed Submission Escalation',
    alertType: 'delayed-submission',
    levels: [
      {
        id: 'level-4-1',
        levelNumber: 1,
        targetRole: 'pump-operator',
        escalateAfterHours: 12,
      },
      {
        id: 'level-4-2',
        levelNumber: 2,
        targetRole: 'section-officer',
        escalateAfterHours: 20,
      },
      {
        id: 'level-4-3',
        levelNumber: 3,
        targetRole: 'sub-divisional-officer',
        escalateAfterHours: 48,
      },
    ],
  },
]

export const getMockEscalations = (): Promise<Escalation[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockEscalations])
    }, 300)
  })
}

export const getMockEscalationById = (id: string): Promise<Escalation | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const escalation = mockEscalations.find((e) => e.id === id)
      resolve(escalation || null)
    }, 300)
  })
}

export const saveMockEscalation = (
  escalation: Omit<Escalation, 'id' | 'name'>
): Promise<Escalation> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const alertTypeLabels: Record<string, string> = {
        'water-quantity-alert': 'Water Quantity Alert',
        'operator-inactivity-alert': 'Operator Inactivity Alert',
        'repeated-non-compliance': 'Repeated Non-Compliance Escalation',
        'delayed-submission': 'Delayed Submission Escalation',
      }

      const savedEscalation: Escalation = {
        id: `escalation-${Date.now()}`,
        name: alertTypeLabels[escalation.alertType] || escalation.alertType,
        alertType: escalation.alertType,
        levels: escalation.levels.map((level, index) => ({
          ...level,
          id: level.id || `level-${Date.now()}-${index}`,
          levelNumber: index + 1,
        })),
      }
      mockEscalations = [...mockEscalations, savedEscalation]
      resolve(savedEscalation)
    }, 500)
  })
}

export const updateMockEscalation = (
  id: string,
  escalation: Omit<Escalation, 'id' | 'name'>
): Promise<Escalation> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const existing = mockEscalations.find((e) => e.id === id)
      if (!existing) {
        reject(new Error('Escalation not found'))
        return
      }
      const alertTypeLabels: Record<string, string> = {
        'water-quantity-alert': 'Water Quantity Alert',
        'operator-inactivity-alert': 'Operator Inactivity Alert',
        'repeated-non-compliance': 'Repeated Non-Compliance Escalation',
        'delayed-submission': 'Delayed Submission Escalation',
      }

      const updatedEscalation: Escalation = {
        id,
        name: alertTypeLabels[escalation.alertType] || escalation.alertType,
        alertType: escalation.alertType,
        levels: escalation.levels.map((level, index) => ({
          ...level,
          id: level.id || `level-${Date.now()}-${index}`,
          levelNumber: index + 1,
        })),
      }
      mockEscalations = mockEscalations.map((e) => (e.id === id ? updatedEscalation : e))
      resolve(updatedEscalation)
    }, 500)
  })
}

export const deleteMockEscalation = (id: string): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockEscalations = mockEscalations.filter((e) => e.id !== id)
      resolve()
    }, 300)
  })
}

// Thresholds Configuration Mock Data
let mockThresholdConfiguration: ThresholdConfiguration = {
  id: '',
  coverage: '',
  continuity: '',
  quantity: '',
  regularity: '',
  isConfigured: false,
}

export const getMockThresholdConfiguration = (): Promise<ThresholdConfiguration> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ ...mockThresholdConfiguration })
    }, 300)
  })
}

export const saveMockThresholdConfiguration = (
  config: Omit<ThresholdConfiguration, 'id'>
): Promise<ThresholdConfiguration> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const savedConfig: ThresholdConfiguration = {
        id: '1',
        coverage: config.coverage,
        continuity: config.continuity,
        quantity: config.quantity,
        regularity: config.regularity,
        isConfigured: true,
      }
      mockThresholdConfiguration = savedConfig
      resolve(savedConfig)
    }, 500)
  })
}

// Nudges Template Mock Data
let mockNudgeTemplates: NudgeTemplate[] = [
  {
    id: '1',
    name: 'No-Water Alert',
    type: 'no-water-alert',
    availableVariables: ['{operator_name}', '{village_name}', '{days}'],
    messages: [
      {
        language: 'english',
        message:
          'Dear {operator_name},\nThis is an urgent alert regarding the water point in {village_name}. It has been reported no water for {days} consecutive days. Please investigate and report the status immediately.\n\nJalSoochak',
      },
      {
        language: 'telugu',
        message:
          'ప్రియమైన {operator_name},\n{village_name}లో నీటి పాయింట్ గురించి ఇది అత్యవసర హెచ్చరిక. {days} వరుస రోజులు నీరు లేదని నివేదించబడింది. దయచేసి వెంటనే పరిశీలించి స్థితిని నివేదించండి.\n\nJalSoochak',
      },
    ],
  },
  {
    id: '2',
    name: 'Low Quantity Alert',
    type: 'low-quantity-alert',
    availableVariables: ['{operator_name}', '{village_name}', '{LPCD}'],
    messages: [
      {
        language: 'english',
        message:
          'Dear {operator_name},\nWater Quantity at {village_name} is currently {LPCD} LPCD, which is below the threshold. Please check the supply and system functionality.\n\nJalSoochak',
      },
      {
        language: 'telugu',
        message:
          'ప్రియమైన {operator_name},\n{village_name}లో నీటి పరిమాణం ప్రస్తుతం {LPCD} LPCD, ఇది పరిమితి కంటే తక్కువ. దయచేసి సరఫరా మరియు వ్యవస్థ పనితీరును తనిఖీ చేయండి.\n\nJalSoochak',
      },
    ],
  },
  {
    id: '3',
    name: 'Operator Inactivity',
    type: 'operator-inactivity',
    availableVariables: ['{operator_name}', '{village_name}', '{days}', '{last_report_day}'],
    messages: [
      {
        language: 'english',
        message:
          'Dear {operator_name},\nWe have noticed that data has not been reported for {village_name} for the last {days} days. Please ensure regular updates.\n\nJalSoochak',
      },
      {
        language: 'telugu',
        message:
          'ప్రియమైన {operator_name},\n{village_name} కోసం గత {days} రోజులుగా డేటా నివేదించబడలేదని మేము గమనించాము. దయచేసి క్రమం తప్పకుండా అప్‌డేట్‌లను అందించండి.\n\nJalSoochak',
      },
    ],
  },
]

export const getMockNudgeTemplates = (): Promise<NudgeTemplate[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockNudgeTemplates])
    }, 300)
  })
}

export const getMockNudgeTemplateById = (id: string): Promise<NudgeTemplate | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const template = mockNudgeTemplates.find((t) => t.id === id)
      resolve(template || null)
    }, 300)
  })
}

export const updateMockNudgeTemplate = (
  id: string,
  updates: { language: string; message: string }
): Promise<NudgeTemplate> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const template = mockNudgeTemplates.find((t) => t.id === id)
      if (template) {
        const updatedMessages = template.messages.map((m) =>
          m.language === updates.language ? { ...m, message: updates.message } : m
        )
        const updatedTemplate = {
          ...template,
          messages: updatedMessages,
        }
        mockNudgeTemplates = mockNudgeTemplates.map((t) => (t.id === id ? updatedTemplate : t))
        resolve(updatedTemplate)
      } else {
        reject(new Error('Template not found'))
      }
    }, 500)
  })
}

// Staff Sync Mock Data
export const mockStaffSyncData: StaffSyncData = {
  stats: {
    totalPumpOperators: 112,
    totalSubDivisionOfficers: 75,
    totalSectionOfficers: 80,
  },
  gramPanchayats: [
    {
      value: 'Achampet',
      label: 'Achampet',
      villages: [
        { value: 'Achampet Village', label: 'Achampet Village' },
        { value: 'Lingapur', label: 'Lingapur' },
        { value: 'Rajpur', label: 'Rajpur' },
      ],
    },
    {
      value: 'Bhongir',
      label: 'Bhongir',
      villages: [
        { value: 'Bhongir Main', label: 'Bhongir Main' },
        { value: 'Aleru', label: 'Aleru' },
        { value: 'Yadagirigutta', label: 'Yadagirigutta' },
      ],
    },
    {
      value: 'Bodhan',
      label: 'Bodhan',
      villages: [
        { value: 'Bodhan Village', label: 'Bodhan Village' },
        { value: 'Banswada', label: 'Banswada' },
        { value: 'Yellareddy', label: 'Yellareddy' },
      ],
    },
  ],
  staff: [
    {
      id: 'staff-1',
      gramPanchayat: 'Achampet',
      village: 'Achampet Village',
      name: 'Ravi Kumar',
      role: 'pump-operator',
      mobileNumber: '+91 98452-85564',
      lastSubmission: '2025-09-08T15:00:00',
      activityStatus: 'active',
    },
    {
      id: 'staff-2',
      gramPanchayat: 'Achampet',
      village: 'Lingapur',
      name: 'Sanjay Reddy',
      role: 'section-officer',
      mobileNumber: '+91 78945-32101',
      lastSubmission: null,
      activityStatus: 'active',
    },
    {
      id: 'staff-3',
      gramPanchayat: 'Achampet',
      village: 'Rajpur',
      name: 'Amit Gupta',
      role: 'sub-division-officer',
      mobileNumber: '+91 85296-36987',
      lastSubmission: null,
      activityStatus: 'active',
    },
    {
      id: 'staff-4',
      gramPanchayat: 'Achampet',
      village: 'Achampet Village',
      name: 'Priya Sharma',
      role: 'pump-operator',
      mobileNumber: '+91 87654-90123',
      lastSubmission: '2025-04-29T11:00:00',
      activityStatus: 'inactive',
    },
    {
      id: 'staff-5',
      gramPanchayat: 'Achampet',
      village: 'Lingapur',
      name: 'Karan Singh',
      role: 'pump-operator',
      mobileNumber: '+91 74185-96321',
      lastSubmission: '2025-09-08T15:00:00',
      activityStatus: 'active',
    },
    {
      id: 'staff-6',
      gramPanchayat: 'Achampet',
      village: 'Rajpur',
      name: 'Vikash Kumar',
      role: 'pump-operator',
      mobileNumber: '+91 76543-21098',
      lastSubmission: '2025-09-08T15:00:00',
      activityStatus: 'active',
    },
    {
      id: 'staff-7',
      gramPanchayat: 'Achampet',
      village: 'Achampet Village',
      name: 'Padma Latha',
      role: 'section-officer',
      mobileNumber: '+91 21098-76532',
      lastSubmission: null,
      activityStatus: 'active',
    },
    {
      id: 'staff-8',
      gramPanchayat: 'Achampet',
      village: 'Rajpur',
      name: 'Venkateswara Rao',
      role: 'sub-division-officer',
      mobileNumber: '+91 10987-65421',
      lastSubmission: null,
      activityStatus: 'active',
    },
    {
      id: 'staff-9',
      gramPanchayat: 'Achampet',
      village: 'Lingapur',
      name: 'Saraswathi Devi',
      role: 'pump-operator',
      mobileNumber: '+91 43210-98754',
      lastSubmission: '2025-01-15T08:45:00',
      activityStatus: 'active',
    },
    {
      id: 'staff-10',
      gramPanchayat: 'Bhongir',
      village: 'Bhongir Main',
      name: 'Vijay Yadav',
      role: 'section-officer',
      mobileNumber: '+91 98765-43210',
      lastSubmission: null,
      activityStatus: 'active',
    },
    {
      id: 'staff-11',
      gramPanchayat: 'Bhongir',
      village: 'Aleru',
      name: 'Rohan Verma',
      role: 'pump-operator',
      mobileNumber: '+91 87654-90123',
      lastSubmission: '2025-09-08T15:00:00',
      activityStatus: 'inactive',
    },
    {
      id: 'staff-12',
      gramPanchayat: 'Bhongir',
      village: 'Yadagirigutta',
      name: 'Sanjeev Kumar',
      role: 'section-officer',
      mobileNumber: '+91 76543-21098',
      lastSubmission: null,
      activityStatus: 'active',
    },
    {
      id: 'staff-13',
      gramPanchayat: 'Bhongir',
      village: 'Bhongir Main',
      name: 'Ajay Sharma',
      role: 'sub-division-officer',
      mobileNumber: '+91 78945-32101',
      lastSubmission: null,
      activityStatus: 'active',
    },
    {
      id: 'staff-14',
      gramPanchayat: 'Bhongir',
      village: 'Aleru',
      name: 'Sunita Devi',
      role: 'pump-operator',
      mobileNumber: '+91 65432-10987',
      lastSubmission: '2025-08-22T13:30:00',
      activityStatus: 'active',
    },
    {
      id: 'staff-15',
      gramPanchayat: 'Bhongir',
      village: 'Yadagirigutta',
      name: 'Rajesh Gupta',
      role: 'sub-division-officer',
      mobileNumber: '+91 54321-09876',
      lastSubmission: null,
      activityStatus: 'active',
    },
    {
      id: 'staff-16',
      gramPanchayat: 'Bhongir',
      village: 'Bhongir Main',
      name: 'Meena Kumari',
      role: 'section-officer',
      mobileNumber: '+91 43210-98765',
      lastSubmission: null,
      activityStatus: 'active',
    },
    {
      id: 'staff-17',
      gramPanchayat: 'Bhongir',
      village: 'Aleru',
      name: 'Srinu Reddy',
      role: 'pump-operator',
      mobileNumber: '+91 98765-43209',
      lastSubmission: '2025-07-19T19:00:00',
      activityStatus: 'active',
    },
    {
      id: 'staff-18',
      gramPanchayat: 'Bhongir',
      village: 'Yadagirigutta',
      name: 'Bhagya Laxmi',
      role: 'pump-operator',
      mobileNumber: '+91 87654-32198',
      lastSubmission: '2025-03-06T14:00:00',
      activityStatus: 'active',
    },
    {
      id: 'staff-19',
      gramPanchayat: 'Bodhan',
      village: 'Bodhan Village',
      name: 'Arjun Reddy',
      role: 'pump-operator',
      mobileNumber: '+91 87654-32109',
      lastSubmission: '2025-09-08T15:00:00',
      activityStatus: 'active',
    },
    {
      id: 'staff-20',
      gramPanchayat: 'Bodhan',
      village: 'Banswada',
      name: 'Kavita Sharma',
      role: 'pump-operator',
      mobileNumber: '+91 76543-21087',
      lastSubmission: '2025-02-16T18:00:00',
      activityStatus: 'active',
    },
    {
      id: 'staff-21',
      gramPanchayat: 'Bodhan',
      village: 'Yellareddy',
      name: 'Suresh Babu',
      role: 'sub-division-officer',
      mobileNumber: '+91 65432-10976',
      lastSubmission: null,
      activityStatus: 'active',
    },
    {
      id: 'staff-22',
      gramPanchayat: 'Bodhan',
      village: 'Bodhan Village',
      name: 'Lakshmi Devi',
      role: 'section-officer',
      mobileNumber: '+91 54321-09865',
      lastSubmission: null,
      activityStatus: 'inactive',
    },
    {
      id: 'staff-23',
      gramPanchayat: 'Bodhan',
      village: 'Banswada',
      name: 'Ramu Naik',
      role: 'pump-operator',
      mobileNumber: '+91 43210-98754',
      lastSubmission: '2025-09-08T15:00:00',
      activityStatus: 'active',
    },
    {
      id: 'staff-24',
      gramPanchayat: 'Bodhan',
      village: 'Yellareddy',
      name: 'Chandra Sekhar',
      role: 'pump-operator',
      mobileNumber: '+91 32109-87643',
      lastSubmission: '2025-12-04T16:30:00',
      activityStatus: 'active',
    },
    {
      id: 'staff-25',
      gramPanchayat: 'Bodhan',
      village: 'Bodhan Village',
      name: 'Krishna Murthy',
      role: 'sub-division-officer',
      mobileNumber: '+91 76543-21087',
      lastSubmission: null,
      activityStatus: 'active',
    },
    {
      id: 'staff-26',
      gramPanchayat: 'Bodhan',
      village: 'Banswada',
      name: 'Nirmala Devi',
      role: 'section-officer',
      mobileNumber: '+91 65432-10976',
      lastSubmission: null,
      activityStatus: 'active',
    },
    {
      id: 'staff-27',
      gramPanchayat: 'Bodhan',
      village: 'Yellareddy',
      name: 'Ganesh Babu',
      role: 'pump-operator',
      mobileNumber: '+91 54321-09865',
      lastSubmission: '2025-05-14T12:30:00',
      activityStatus: 'active',
    },
  ],
}

export const getMockStaffSyncData = (): Promise<StaffSyncData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockStaffSyncData)
    }, 300)
  })
}

// Configuration Mock Data
let mockConfigurationData: ConfigurationData = {
  id: '',
  supportedChannels: [],
  logoUrl: undefined,
  meterChangeReasons: DEFAULT_METER_CHANGE_REASONS.map((r) => ({ ...r })),
  locationCheckRequired: false,
  dataConsolidationTime: '',
  pumpOperatorReminderNudgeTime: '',
  averageMembersPerHousehold: 0,
  isConfigured: false,
}

export const getMockConfigurationData = (): Promise<ConfigurationData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ ...mockConfigurationData })
    }, 300)
  })
}

export const saveMockConfigurationData = (
  config: Omit<ConfigurationData, 'id'>
): Promise<ConfigurationData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const saved = {
        ...config,
        id: mockConfigurationData.id || '1',
        isConfigured: true,
      } as ConfigurationData
      mockConfigurationData = saved
      resolve(saved)
    }, 500)
  })
}

// State/UT Admins Mock Data
let mockStateUTAdmins: StateUTAdmin[] = [
  {
    id: 'admin-1',
    firstName: 'Ravi',
    lastName: 'Kumar',
    email: 'ravi@gmail.com',
    phone: '9845285564',
    status: 'active',
  },
  {
    id: 'admin-2',
    firstName: 'Vijay',
    lastName: 'Yadav',
    email: 'vijay@gmail.com',
    phone: '7418596321',
    status: 'active',
  },
  {
    id: 'admin-3',
    firstName: 'Rohan',
    lastName: 'Verma',
    email: 'rohan@gmail.com',
    phone: '9876543210',
    status: 'active',
  },
  {
    id: 'admin-4',
    firstName: 'Sanjeev',
    lastName: 'Kumar',
    email: 'sanjeev@gmail.com',
    phone: '8765490123',
    status: 'inactive',
  },
]

export const getMockStateUTAdmins = (): Promise<StateUTAdmin[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockStateUTAdmins])
    }, 300)
  })
}

export const getMockStateUTAdminById = (id: string): Promise<StateUTAdmin | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const admin = mockStateUTAdmins.find((a) => a.id === id)
      resolve(admin ?? null)
    }, 300)
  })
}

export const createMockStateUTAdmin = (input: CreateStateUTAdminInput): Promise<StateUTAdmin> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const created: StateUTAdmin = {
        id: `admin-${Date.now()}`,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        status: 'active',
      }
      mockStateUTAdmins = [...mockStateUTAdmins, created]
      resolve(created)
    }, 500)
  })
}

export const updateMockStateUTAdmin = (
  id: string,
  input: UpdateStateUTAdminInput
): Promise<StateUTAdmin> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const existing = mockStateUTAdmins.find((a) => a.id === id)
      if (!existing) {
        reject(new Error('Admin not found'))
        return
      }
      const updated: StateUTAdmin = { ...existing, ...input }
      mockStateUTAdmins = mockStateUTAdmins.map((a) => (a.id === id ? updated : a))
      resolve(updated)
    }, 500)
  })
}

export const updateMockStateUTAdminStatus = (
  id: string,
  status: 'active' | 'inactive'
): Promise<StateUTAdmin> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const existing = mockStateUTAdmins.find((a) => a.id === id)
      if (!existing) {
        reject(new Error('Admin not found'))
        return
      }
      const updated: StateUTAdmin = { ...existing, status }
      mockStateUTAdmins = mockStateUTAdmins.map((a) => (a.id === id ? updated : a))
      resolve(updated)
    }, 300)
  })
}

// Escalation Rules Mock Data
let mockEscalationRules: EscalationRulesConfig = {
  schedule: { hour: 9, minute: 0 },
  levels: [
    { days: 3, userType: 'SECTION_OFFICER' },
    { days: 7, userType: 'SUBDIVISION_OFFICER' },
  ],
}

export const getMockEscalationRules = (): Promise<EscalationRulesConfig> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ ...mockEscalationRules, levels: [...mockEscalationRules.levels] })
    }, 300)
  })
}

export const saveMockEscalationRules = (
  payload: EscalationRulesConfig
): Promise<EscalationRulesConfig> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockEscalationRules = { ...payload, levels: [...payload.levels] }
      resolve(mockEscalationRules)
    }, 500)
  })
}

// Message Templates Mock Data
const mockMessageTemplatesData: MessageTemplatesData = {
  supportedLanguages: [
    { language: 'English', preference: 1 },
    { language: 'Hindi', preference: 2 },
  ],
  screens: {
    ISSUE_REPORT: {
      prompt: {
        en: 'Please type your issue in a few words.',
        hi: 'कृपया अपनी समस्या संक्षेप में लिखें।',
        ta: null,
        te: null,
        kn: null,
        ml: null,
        mr: null,
        gu: null,
        bn: null,
        pa: null,
        ur: null,
        or: null,
        as: null,
      },
      options: null,
      reasons: {
        REASON_1: {
          order: 1,
          label: {
            en: 'Meter Replaced',
            hi: 'मीटर बदला गया',
            ta: null,
            te: null,
            kn: null,
            ml: null,
            mr: null,
            gu: null,
            bn: null,
            pa: null,
            ur: null,
            or: null,
            as: null,
          },
        },
        REASON_2: {
          order: 2,
          label: {
            en: 'Meter not working',
            hi: 'मीटर काम नहीं कर रहा',
            ta: null,
            te: null,
            kn: null,
            ml: null,
            mr: null,
            gu: null,
            bn: null,
            pa: null,
            ur: null,
            or: null,
            as: null,
          },
        },
        REASON_3: {
          order: 3,
          label: {
            en: 'Meter damage',
            hi: 'मीटर खराब है',
            ta: null,
            te: null,
            kn: null,
            ml: null,
            mr: null,
            gu: null,
            bn: null,
            pa: null,
            ur: null,
            or: null,
            as: null,
          },
        },
        REASON_4: {
          order: 4,
          label: {
            en: 'Incorrect Reading Entered Previously',
            hi: 'पहले गलत रीडिंग दर्ज हुई थी',
            ta: null,
            te: null,
            kn: null,
            ml: null,
            mr: null,
            gu: null,
            bn: null,
            pa: null,
            ur: null,
            or: null,
            as: null,
          },
        },
        REASON_5: {
          order: 5,
          label: {
            en: 'Others',
            hi: 'अन्य',
            ta: null,
            te: null,
            kn: null,
            ml: null,
            mr: null,
            gu: null,
            bn: null,
            pa: null,
            ur: null,
            or: null,
            as: null,
          },
        },
      },
      confirmationTemplate: {
        en: 'Issue reported. Thank you.',
        hi: 'समस्या रिपोर्ट हो गई है। धन्यवाद।',
        ta: null,
        te: null,
        kn: null,
        ml: null,
        mr: null,
        gu: null,
        bn: null,
        pa: null,
        ur: null,
        or: null,
        as: null,
      },
      message: null,
    },
    INTRO_MESSAGE: {
      prompt: null,
      options: null,
      reasons: null,
      confirmationTemplate: null,
      message: {
        en: 'Hello {name}, please send a clear meter reading image.',
        hi: 'नमस्ते {name}, कृपया मीटर की स्पष्ट रीडिंग फोटो भेजें।',
        ta: null,
        te: null,
        kn: null,
        ml: null,
        mr: null,
        gu: null,
        bn: null,
        pa: null,
        ur: null,
        or: null,
        as: null,
      },
    },
    ITEM_SELECTION: {
      prompt: {
        en: 'Please select what you want to do:',
        hi: 'कृपया चुनें कि आप क्या करना चाहते हैं:',
        ta: null,
        te: null,
        kn: null,
        ml: null,
        mr: null,
        gu: null,
        bn: null,
        pa: null,
        ur: null,
        or: null,
        as: null,
      },
      options: {
        OPTION_1: {
          order: 1,
          label: {
            en: 'Submit Reading',
            hi: 'रीडिंग जमा करें',
            ta: null,
            te: null,
            kn: null,
            ml: null,
            mr: null,
            gu: null,
            bn: null,
            pa: null,
            ur: null,
            or: null,
            as: null,
          },
        },
        OPTION_2: {
          order: 2,
          label: {
            en: 'Report Issue',
            hi: 'समस्या दर्ज करें',
            ta: null,
            te: null,
            kn: null,
            ml: null,
            mr: null,
            gu: null,
            bn: null,
            pa: null,
            ur: null,
            or: null,
            as: null,
          },
        },
        OPTION_3: {
          order: 3,
          label: {
            en: 'Select Language',
            hi: 'भाषा चुनें',
            ta: null,
            te: null,
            kn: null,
            ml: null,
            mr: null,
            gu: null,
            bn: null,
            pa: null,
            ur: null,
            or: null,
            as: null,
          },
        },
        OPTION_4: {
          order: 4,
          label: {
            en: 'Select Channel',
            hi: 'चैनल चुनें',
            ta: null,
            te: null,
            kn: null,
            ml: null,
            mr: null,
            gu: null,
            bn: null,
            pa: null,
            ur: null,
            or: null,
            as: null,
          },
        },
      },
      reasons: null,
      confirmationTemplate: {
        en: '{item} selected',
        hi: '{item} चुना गया है',
        ta: null,
        te: null,
        kn: null,
        ml: null,
        mr: null,
        gu: null,
        bn: null,
        pa: null,
        ur: null,
        or: null,
        as: null,
      },
      message: null,
    },
    CLOSING_MESSAGE: {
      prompt: null,
      options: null,
      reasons: null,
      confirmationTemplate: null,
      message: {
        en: 'Thank you. Your reading has been recorded.',
        hi: 'धन्यवाद। आपकी रीडिंग दर्ज कर ली गई है।',
        ta: null,
        te: null,
        kn: null,
        ml: null,
        mr: null,
        gu: null,
        bn: null,
        pa: null,
        ur: null,
        or: null,
        as: null,
      },
    },
    CHANNEL_SELECTION: {
      prompt: {
        en: 'Please select your preferred channel by typing the corresponding number:',
        hi: 'कृपया संबंधित संख्या लिखकर अपना पसंदीदा चैनल चुनें:',
        ta: null,
        te: null,
        kn: null,
        ml: null,
        mr: null,
        gu: null,
        bn: null,
        pa: null,
        ur: null,
        or: null,
        as: null,
      },
      options: {
        OPTION_1: {
          order: 1,
          label: {
            en: 'BFM',
            hi: 'बीएफएम',
            ta: null,
            te: null,
            kn: null,
            ml: null,
            mr: null,
            gu: null,
            bn: null,
            pa: null,
            ur: null,
            or: null,
            as: null,
          },
        },
        OPTION_2: {
          order: 2,
          label: {
            en: 'Electric',
            hi: 'इलेक्ट्रिक',
            ta: null,
            te: null,
            kn: null,
            ml: null,
            mr: null,
            gu: null,
            bn: null,
            pa: null,
            ur: null,
            or: null,
            as: null,
          },
        },
      },
      reasons: null,
      confirmationTemplate: {
        en: 'Your preferred channel has been set to {channel}.',
        hi: 'आपका पसंदीदा चैनल {channel} सेट कर दिया गया है।',
        ta: null,
        te: null,
        kn: null,
        ml: null,
        mr: null,
        gu: null,
        bn: null,
        pa: null,
        ur: null,
        or: null,
        as: null,
      },
      message: null,
    },
    LANGUAGE_SELECTION: {
      prompt: {
        en: 'Please select your preferred language by typing the corresponding number:',
        hi: 'कृपया संबंधित संख्या टाइप करके अपनी पसंदीदा भाषा चुनें:',
        ta: null,
        te: null,
        kn: null,
        ml: null,
        mr: null,
        gu: null,
        bn: null,
        pa: null,
        ur: null,
        or: null,
        as: null,
      },
      options: {
        OPTION_1: {
          order: 1,
          label: {
            en: 'English',
            hi: 'अंग्रेज़ी',
            ta: null,
            te: null,
            kn: null,
            ml: null,
            mr: null,
            gu: null,
            bn: null,
            pa: null,
            ur: null,
            or: null,
            as: null,
          },
        },
        OPTION_2: {
          order: 2,
          label: {
            en: 'Hindi',
            hi: 'हिंदी',
            ta: null,
            te: null,
            kn: null,
            ml: null,
            mr: null,
            gu: null,
            bn: null,
            pa: null,
            ur: null,
            or: null,
            as: null,
          },
        },
      },
      reasons: null,
      confirmationTemplate: {
        en: 'Your preferred language has been set to {language}.',
        hi: 'आपकी पसंदीदा भाषा {language} सेट कर दी गई है।',
        ta: null,
        te: null,
        kn: null,
        ml: null,
        mr: null,
        gu: null,
        bn: null,
        pa: null,
        ur: null,
        or: null,
        as: null,
      },
      message: null,
    },
  },
}

export const getMockMessageTemplates = (): Promise<MessageTemplatesData> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockMessageTemplatesData), 300)
  })
}
