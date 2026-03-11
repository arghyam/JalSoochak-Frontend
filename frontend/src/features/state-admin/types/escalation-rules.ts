export type EscalationUserType = 'SECTION_OFFICER' | 'SUBDIVISION_OFFICER' | 'EXECUTIVE_ENGINEER'

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
  SUBDIVISION_OFFICER: 'Sub-Division Officer',
  EXECUTIVE_ENGINEER: 'Executive Engineer',
}

export const ESCALATION_USER_TYPE_OPTIONS = Object.entries(ESCALATION_USER_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as EscalationUserType, label })
)
