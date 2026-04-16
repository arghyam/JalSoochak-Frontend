import {
  CONDITION_TYPE_LABELS,
  CONDITION_TYPES,
  MESSAGE_FREQUENCIES,
  MESSAGE_FREQUENCY_LABELS,
  NOTIFY_ROLES,
  NOTIFY_ROLE_LABELS,
  WATER_NORM_CATEGORIES,
  WATER_NORM_CATEGORY_LABELS,
} from './state-admin'

describe('state admin constants', () => {
  it('maps notify roles to labels', () => {
    expect(NOTIFY_ROLE_LABELS[NOTIFY_ROLES.SECTION_OFFICER]).toBe('Section Officer')
    expect(NOTIFY_ROLE_LABELS[NOTIFY_ROLES.ASSISTANT_EXECUTIVE_ENGINEER]).toBe(
      'Assistant Executive Engineer'
    )
  })

  it('maps condition types to labels', () => {
    expect(CONDITION_TYPE_LABELS[CONDITION_TYPES.NO_SUBMISSION]).toBe('No Submission')
    expect(CONDITION_TYPE_LABELS[CONDITION_TYPES.THRESHOLD_BREACH]).toBe('Threshold Breach')
    expect(CONDITION_TYPE_LABELS[CONDITION_TYPES.ANOMALY_DETECTED]).toBe('Anomaly Detected')
  })

  it('maps message frequencies and water norm categories to labels', () => {
    expect(MESSAGE_FREQUENCY_LABELS[MESSAGE_FREQUENCIES.DAILY]).toBe('Daily')
    expect(MESSAGE_FREQUENCY_LABELS[MESSAGE_FREQUENCIES.WEEKLY]).toBe('Weekly')
    expect(MESSAGE_FREQUENCY_LABELS[MESSAGE_FREQUENCIES.MONTHLY]).toBe('Monthly')
    expect(WATER_NORM_CATEGORY_LABELS[WATER_NORM_CATEGORIES.RURAL]).toBe('Rural')
    expect(WATER_NORM_CATEGORY_LABELS[WATER_NORM_CATEGORIES.URBAN]).toBe('Urban')
  })
})
