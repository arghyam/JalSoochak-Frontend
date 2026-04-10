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
  | 'DATE_FORMAT_SCREEN'
  | 'DATE_FORMAT_TABLE'
  | 'GLIFIC_MESSAGE_TEMPLATES'
  | 'STATE_IT_SYSTEM_CONNECTION'
  | 'STATE_DATA_RECONCILIATION_TIME'
  | 'EMAIL_TEMPLATE_JSON'
  | 'DISPLAY_DEPARTMENT_MAPS'
  | 'SUPPLY_OUTAGE_REASONS'

export interface ConfigStatusEntry {
  status: ConfigKeyStatus
  mandatory: boolean
}

export type ConfigStatusMap = { [K in ConfigKey]?: ConfigStatusEntry }

export type WizardStepId = 'configuration' | 'language' | 'waterNorms' | 'escalations'

export interface WizardStep {
  id: WizardStepId
  labelKey: string
  route: string
  keys: Array<keyof ConfigStatusMap>
}
