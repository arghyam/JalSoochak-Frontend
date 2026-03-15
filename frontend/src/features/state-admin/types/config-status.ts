export type ConfigKeyStatus = 'CONFIGURED' | 'PENDING'

export interface ConfigStatusMap {
  TENANT_SUPPORTED_CHANNELS?: ConfigKeyStatus
  METER_CHANGE_REASONS?: ConfigKeyStatus
  AVERAGE_MEMBERS_PER_HOUSEHOLD?: ConfigKeyStatus
  DATA_CONSOLIDATION_TIME?: ConfigKeyStatus
  PUMP_OPERATOR_REMINDER_NUDGE_TIME?: ConfigKeyStatus
  LOCATION_CHECK_REQUIRED?: ConfigKeyStatus
  TENANT_LOGO?: ConfigKeyStatus
  SUPPORTED_LANGUAGES?: ConfigKeyStatus
  WATER_NORM?: ConfigKeyStatus
  TENANT_WATER_QUANTITY_SUPPLY_THRESHOLD?: ConfigKeyStatus
  MESSAGE_BROKER_CONNECTION_SETTINGS?: ConfigKeyStatus
  FIELD_STAFF_ESCALATION_RULES?: ConfigKeyStatus
  [key: string]: ConfigKeyStatus | undefined
}

export type WizardStepId =
  | 'configuration'
  | 'language'
  | 'waterNorms'
  | 'integration'
  | 'escalations'

export interface WizardStep {
  id: WizardStepId
  labelKey: string
  route: string
  keys: Array<keyof ConfigStatusMap>
}
