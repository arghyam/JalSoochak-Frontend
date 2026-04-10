import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals'
import {
  SYSTEM_CHANNEL_CODE_TO_NAME,
  mapApiResponseToSystemConfig,
  mapSystemConfigToApiPayload,
} from './system-config'

describe('system-config constants', () => {
  it('maps every supported channel code to a display name', () => {
    expect(SYSTEM_CHANNEL_CODE_TO_NAME.BFM).toBe('Bulk Flow Meter')
    expect(SYSTEM_CHANNEL_CODE_TO_NAME.MAN).toBe('Manual')
  })
})

describe('mapApiResponseToSystemConfig', () => {
  const warn = console.warn

  beforeEach(() => {
    console.warn = jest.fn()
  })

  afterEach(() => {
    console.warn = warn
  })

  it('maps known channel codes and numeric thresholds', () => {
    const config = mapApiResponseToSystemConfig({
      SYSTEM_SUPPORTED_CHANNELS: { channels: ['BFM', 'MAN'] },
      BFM_IMAGE_READING_CONFIDENCE_LEVEL_THRESHOLD: { value: '0.85' },
      LOCATION_AFFINITY_THRESHOLD: { value: '0.12' },
    })
    expect(config.supportedChannels).toEqual(['Bulk Flow Meter', 'Manual'])
    expect(config.bfmImageConfidenceThreshold).toBe(0.85)
    expect(config.locationAffinityThreshold).toBe(0.12)
  })

  it('skips unknown channel codes and uses 0 for non-finite numbers', () => {
    const config = mapApiResponseToSystemConfig({
      SYSTEM_SUPPORTED_CHANNELS: { channels: ['UNKNOWN'] },
      BFM_IMAGE_READING_CONFIDENCE_LEVEL_THRESHOLD: { value: 'nan' },
      LOCATION_AFFINITY_THRESHOLD: { value: '' },
    })
    expect(config.supportedChannels).toEqual([])
    expect(config.bfmImageConfidenceThreshold).toBe(0)
    expect(config.locationAffinityThreshold).toBe(0)
    expect(console.warn).toHaveBeenCalled()
  })

  it('handles missing optional sections', () => {
    const config = mapApiResponseToSystemConfig({})
    expect(config.supportedChannels).toEqual([])
    expect(config.bfmImageConfidenceThreshold).toBe(0)
    expect(config.locationAffinityThreshold).toBe(0)
  })
})

describe('mapSystemConfigToApiPayload', () => {
  const warn = console.warn

  beforeEach(() => {
    console.warn = jest.fn()
  })

  afterEach(() => {
    console.warn = warn
  })

  it('maps display names back to API codes and stringifies thresholds', () => {
    const body = mapSystemConfigToApiPayload({
      supportedChannels: ['Bulk Flow Meter', 'Manual'],
      bfmImageConfidenceThreshold: 0.5,
      locationAffinityThreshold: 1,
    })
    expect(body.configs.SYSTEM_SUPPORTED_CHANNELS).toEqual({ channels: ['BFM', 'MAN'] })
    expect(body.configs.BFM_IMAGE_READING_CONFIDENCE_LEVEL_THRESHOLD).toEqual({ value: '0.5' })
    expect(body.configs.LOCATION_AFFINITY_THRESHOLD).toEqual({ value: '1' })
  })

  it('drops unknown channel names from payload', () => {
    const body = mapSystemConfigToApiPayload({
      supportedChannels: ['Not A Channel' as never],
      bfmImageConfidenceThreshold: 0,
      locationAffinityThreshold: 0,
    })
    expect(body.configs.SYSTEM_SUPPORTED_CHANNELS).toEqual({ channels: [] })
    expect(console.warn).toHaveBeenCalled()
  })
})
