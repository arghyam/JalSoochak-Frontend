import type { HourlySubmissionActivityBucket } from '../types'

const HOURS_IN_DAY = 24
const HOUR_OF_TIMESTAMP = /T(\d{2}):/

/**
 * Folds hourly buckets over a date range into submissions per hour of the day (index 0 = 00:00).
 * The hour is read straight from the timestamp text: the API sends IST without an offset, and
 * parsing it as a Date would shift it into the browser's time zone.
 */
export const toSubmissionsByHourOfDay = (
  buckets: Array<Pick<HourlySubmissionActivityBucket, 'hourStart' | 'submissionCount'>> | undefined
): number[] => {
  const totals = Array<number>(HOURS_IN_DAY).fill(0)

  for (const bucket of buckets ?? []) {
    const hour = Number(HOUR_OF_TIMESTAMP.exec(bucket.hourStart)?.[1])
    const count = Number(bucket.submissionCount)
    if (!Number.isInteger(hour) || hour < 0 || hour >= HOURS_IN_DAY || !Number.isFinite(count)) {
      continue
    }
    totals[hour] += count
  }

  return totals
}
