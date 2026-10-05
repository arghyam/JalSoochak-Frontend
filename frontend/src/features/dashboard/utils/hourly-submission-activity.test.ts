import { describe, expect, it } from '@jest/globals'
import { toSubmissionsByHourOfDay } from './hourly-submission-activity'

describe('toSubmissionsByHourOfDay', () => {
  it('returns 24 zero buckets when there is no activity', () => {
    expect(toSubmissionsByHourOfDay([])).toEqual(Array(24).fill(0))
    expect(toSubmissionsByHourOfDay(undefined)).toEqual(Array(24).fill(0))
  })

  it('adds up submissions for the same hour across days', () => {
    const result = toSubmissionsByHourOfDay([
      { hourStart: '2026-03-01T09:00:00', submissionCount: 4 },
      { hourStart: '2026-03-02T09:00:00', submissionCount: 6 },
      { hourStart: '2026-03-02T18:00:00', submissionCount: 2 },
    ])

    expect(result[9]).toBe(10)
    expect(result[18]).toBe(2)
    expect(result.reduce((sum, value) => sum + value, 0)).toBe(12)
  })

  it('keeps the hour as sent (IST) instead of shifting it to the browser time zone', () => {
    const result = toSubmissionsByHourOfDay([
      { hourStart: '2026-03-01T00:00:00', submissionCount: 3 },
      { hourStart: '2026-03-01T23:00:00', submissionCount: 5 },
    ])

    expect(result[0]).toBe(3)
    expect(result[23]).toBe(5)
  })

  it('ignores buckets with an unreadable hour or count', () => {
    const result = toSubmissionsByHourOfDay([
      { hourStart: 'not-a-date', submissionCount: 3 },
      { hourStart: '2026-03-01T07:00:00', submissionCount: Number.NaN },
      { hourStart: '2026-03-01T08:00:00', submissionCount: 2 },
    ])

    expect(result.reduce((sum, value) => sum + value, 0)).toBe(2)
    expect(result[8]).toBe(2)
  })
})
