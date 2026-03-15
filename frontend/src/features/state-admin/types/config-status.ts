export type ConfigKeyStatus = 'CONFIGURED' | 'PENDING'

export type ConfigKey =
  | 'TENANT_SUPPORTED_CHANNELS'
  | 'METER_CHANGE_REASONS'
  | 'AVERAGE_MEMBERS_PER_HOUSEHOLD'
  | 'DATA_CONSOLIDATION_TIME'
  | 'PUMP_OPERATOR_REMINDER_NUDGE_TIME'
  | 'LOCATION_CHECK_REQUIRED'
  | 'TENANT_LOGO'
  | 'SUPPORTED_LANGUAGES'
  | 'WATER_NORM'
  | 'TENANT_WATER_QUANTITY_SUPPLY_THRESHOLD'
  | 'MESSAGE_BROKER_CONNECTION_SETTINGS'
  | 'FIELD_STAFF_ESCALATION_RULES'

export type ConfigStatusMap = { [K in ConfigKey]?: ConfigKeyStatus }

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
