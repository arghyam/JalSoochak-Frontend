export type EscalationUserType = 'SECTION_OFFICER' | 'DISTRICT_OFFICER'

export interface EscalationRuleLevel {
  days: number
  userType: EscalationUserType
}

export interface EscalationRulesConfig extends Record<string, unknown> {
  schedule: { hour: number; minute: number }
  levels: EscalationRuleLevel[]
}

export type SaveEscalationRulesPayload = EscalationRulesConfig

export const ESCALATION_USER_TYPE_LABELS: Record<EscalationUserType, string> = {
  SECTION_OFFICER: 'Section Officer',
  DISTRICT_OFFICER: 'District Officer',
}

export const ESCALATION_USER_TYPE_OPTIONS = Object.entries(ESCALATION_USER_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as EscalationUserType, label })
)
