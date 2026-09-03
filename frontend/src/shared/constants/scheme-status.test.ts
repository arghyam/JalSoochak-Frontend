import enCommon from '@/locales/en/common.json'
import hiCommon from '@/locales/hi/common.json'
import asCommon from '@/locales/as/common.json'
import {
  DEFAULT_SCHEME_STATUS_COLORS,
  OPERATING_STATUS_CODES,
  SCHEME_STATUS_DESCRIPTORS,
  UNKNOWN_SCHEME_STATUS_CHART_COLOR_TOKEN,
  UNKNOWN_SCHEME_STATUS_I18N_KEY,
  WORK_STATUS_CODES,
  findSchemeStatusByCode,
  findSchemeStatusByLabel,
  getSchemeStatusCanonicalLabel,
  getSchemeStatusChartColorToken,
  getSchemeStatusCodeOrder,
  getSchemeStatusColors,
  getSchemeStatusCount,
  getSchemeStatusDisplayOrder,
  getSchemeStatusOptions,
  isOperatingStatusCode,
  isWorkStatusCode,
  normalizeSchemeStatusLabel,
  resolveSchemeStatusLabel,
  sortSchemeStatusCounts,
} from './scheme-status'
import type { SchemeStatusCount, SchemeStatusDimension } from './scheme-status'

/** Returns the key itself, so assertions can pin the exact key that was requested. */
const mockT = (key: string) => key
/** Mimics i18next resolving a missing key to its `defaultValue`. */
const mockTMissing = (_key: string, options?: { defaultValue?: string }) =>
  options?.defaultValue ?? ''

const readNestedValue = (source: unknown, dottedPath: string): unknown =>
  dottedPath
    .split('.')
    .reduce<unknown>(
      (value, segment) =>
        value && typeof value === 'object'
          ? (value as Record<string, unknown>)[segment]
          : undefined,
      source
    )

describe('scheme status vocabulary', () => {
  describe('descriptor tables', () => {
    it('covers exactly the documented work status codes', () => {
      const codes = SCHEME_STATUS_DESCRIPTORS.workStatus.map((d) => d.code)

      expect([...codes].sort((a, b) => a - b)).toEqual([1, 2, 3, 4])
      expect(new Set(codes).size).toBe(codes.length)
    })

    it('covers exactly the documented operating status codes', () => {
      const codes = SCHEME_STATUS_DESCRIPTORS.operatingStatus.map((d) => d.code)

      expect([...codes].sort((a, b) => a - b)).toEqual([0, 1, 2])
      expect(new Set(codes).size).toBe(codes.length)
    })

    it('keeps display order distinct from code order for work status', () => {
      // Pre-migration WORK_STATUS_OPTIONS was lifecycle-ordered, i.e. codes [3, 1, 2, 4].
      expect(getSchemeStatusDisplayOrder('workStatus')).toEqual([3, 1, 2, 4])
      expect(getSchemeStatusCodeOrder('workStatus')).toEqual([1, 2, 3, 4])
    })

    it('keeps display order distinct from code order for operating status', () => {
      expect(getSchemeStatusDisplayOrder('operatingStatus')).toEqual([0, 2, 1])
      expect(getSchemeStatusCodeOrder('operatingStatus')).toEqual([0, 1, 2])
    })

    it('preserves the canonical English labels in display order', () => {
      expect(SCHEME_STATUS_DESCRIPTORS.workStatus.map((d) => d.label)).toEqual([
        'Not Started',
        'Ongoing',
        'Completed',
        'Handed Over',
      ])
      expect(SCHEME_STATUS_DESCRIPTORS.operatingStatus.map((d) => d.label)).toEqual([
        'Non-Operative',
        'Partially Operative',
        'Operative',
      ])
    })

    it('assigns a unique chart colour per status within each dimension', () => {
      ;(['workStatus', 'operatingStatus'] as const).forEach((dimension) => {
        const tokens = SCHEME_STATUS_DESCRIPTORS[dimension].map((d) => d.chartColorToken)

        expect(new Set(tokens).size).toBe(tokens.length)
        expect(tokens).not.toContain(UNKNOWN_SCHEME_STATUS_CHART_COLOR_TOKEN)
      })
    })
  })

  describe('i18n keys', () => {
    const locales = [
      ['en', enCommon],
      ['hi', hiCommon],
      ['as', asCommon],
    ] as const

    it.each(locales)('resolves every status key in %s', (_locale, bundle) => {
      const keys = [
        ...SCHEME_STATUS_DESCRIPTORS.workStatus,
        ...SCHEME_STATUS_DESCRIPTORS.operatingStatus,
      ].map((d) => d.i18nKey)

      ;[...keys, UNKNOWN_SCHEME_STATUS_I18N_KEY].forEach((qualifiedKey) => {
        const value = readNestedValue(bundle, qualifiedKey.replace('common:', ''))

        expect(typeof value).toBe('string')
        expect(value).not.toBe('')
      })
    })

    it('keeps the English values byte-identical to the canonical wire labels', () => {
      // The canonical label is the PATCH payload and the filter wire value; en must mirror it.
      ;(['workStatus', 'operatingStatus'] as const).forEach((dimension) => {
        SCHEME_STATUS_DESCRIPTORS[dimension].forEach((descriptor) => {
          const value = readNestedValue(enCommon, descriptor.i18nKey.replace('common:', ''))

          expect(value).toBe(descriptor.label)
        })
      })
    })

    it('namespace-qualifies every key so it resolves from any namespace', () => {
      const keys = [
        ...SCHEME_STATUS_DESCRIPTORS.workStatus,
        ...SCHEME_STATUS_DESCRIPTORS.operatingStatus,
      ].map((d) => d.i18nKey)

      ;[...keys, UNKNOWN_SCHEME_STATUS_I18N_KEY].forEach((key) => {
        expect(key.startsWith('common:')).toBe(true)
      })
    })
  })

  describe('normalizeSchemeStatusLabel', () => {
    it.each([
      ['Non-Operative', 'non operative'],
      ['NON_OPERATIVE', 'non operative'],
      ['  Partially   Operative ', 'partially operative'],
      ['Handed Over', 'handed over'],
    ])('folds %s', (input, expected) => {
      expect(normalizeSchemeStatusLabel(input)).toBe(expected)
    })
  })

  describe('findSchemeStatusByCode', () => {
    it('resolves a known work status code', () => {
      expect(findSchemeStatusByCode('workStatus', WORK_STATUS_CODES.HANDED_OVER)?.label).toBe(
        'Handed Over'
      )
    })

    it('resolves operating status code 0 rather than treating it as absent', () => {
      expect(findSchemeStatusByCode('operatingStatus', 0)?.label).toBe('Non-Operative')
    })

    it.each([[null], [undefined], [99]])('returns undefined for %p', (code) => {
      expect(findSchemeStatusByCode('operatingStatus', code)).toBeUndefined()
    })

    it('does not resolve a code across dimensions', () => {
      // Code 1 means Ongoing for work and Operative for operating — never interchangeable.
      expect(findSchemeStatusByCode('workStatus', 1)?.label).toBe('Ongoing')
      expect(findSchemeStatusByCode('operatingStatus', 1)?.label).toBe('Operative')
      expect(findSchemeStatusByCode('workStatus', 0)).toBeUndefined()
    })
  })

  describe('findSchemeStatusByLabel', () => {
    it('round-trips every canonical label', () => {
      ;(['workStatus', 'operatingStatus'] as const).forEach((dimension) => {
        SCHEME_STATUS_DESCRIPTORS[dimension].forEach((descriptor) => {
          expect(findSchemeStatusByLabel(dimension, descriptor.label)?.code).toBe(descriptor.code)
        })
      })
    })

    it.each([
      ['non operative', 0],
      ['NON-OPERATIVE', 0],
      ['  Partially   Operative ', 2],
      ['operative', 1],
    ])('matches %s case- and separator-insensitively', (label, expectedCode) => {
      expect(findSchemeStatusByLabel('operatingStatus', label)?.code).toBe(expectedCode)
    })

    it.each([[null], [undefined], [''], ['   '], ['Bogus Status']])(
      'returns undefined for %p rather than guessing',
      (label) => {
        expect(findSchemeStatusByLabel('operatingStatus', label)).toBeUndefined()
      }
    )

    it('does not match a label from the other dimension', () => {
      expect(findSchemeStatusByLabel('workStatus', 'Operative')).toBeUndefined()
      expect(findSchemeStatusByLabel('operatingStatus', 'Ongoing')).toBeUndefined()
    })
  })

  describe('getSchemeStatusCanonicalLabel', () => {
    it('returns the wire label for a known code', () => {
      expect(
        getSchemeStatusCanonicalLabel('operatingStatus', OPERATING_STATUS_CODES.NON_OPERATIVE)
      ).toBe('Non-Operative')
    })

    it('returns undefined for an unknown code', () => {
      expect(getSchemeStatusCanonicalLabel('operatingStatus', 99)).toBeUndefined()
      expect(getSchemeStatusCanonicalLabel('operatingStatus', null)).toBeUndefined()
    })
  })

  describe('type guards', () => {
    it.each([[1], [2], [3], [4]])('accepts work status code %p', (code) => {
      expect(isWorkStatusCode(code)).toBe(true)
    })

    it.each([[0], [5], [null], [undefined]])('rejects work status code %p', (code) => {
      expect(isWorkStatusCode(code)).toBe(false)
    })

    it.each([[0], [1], [2]])('accepts operating status code %p', (code) => {
      expect(isOperatingStatusCode(code)).toBe(true)
    })

    it.each([[3], [99], [null], [undefined]])('rejects operating status code %p', (code) => {
      expect(isOperatingStatusCode(code)).toBe(false)
    })
  })

  describe('colours', () => {
    it('returns the status colours for a known code', () => {
      expect(getSchemeStatusColors('operatingStatus', 0)).toEqual({
        bg: 'error.50',
        color: 'error.500',
      })
    })

    it('falls back to neutral for an unrecorded or unknown status', () => {
      expect(getSchemeStatusColors('operatingStatus', null)).toEqual(DEFAULT_SCHEME_STATUS_COLORS)
      expect(getSchemeStatusColors('workStatus', 99)).toEqual(DEFAULT_SCHEME_STATUS_COLORS)
    })

    it('returns a chart colour token for every known code', () => {
      ;(['workStatus', 'operatingStatus'] as const).forEach((dimension) => {
        SCHEME_STATUS_DESCRIPTORS[dimension].forEach((descriptor) => {
          expect(getSchemeStatusChartColorToken(dimension, descriptor.code)).toBe(
            descriptor.chartColorToken
          )
        })
      })
    })

    it('falls back to the unknown chart colour token', () => {
      expect(getSchemeStatusChartColorToken('workStatus', null)).toBe(
        UNKNOWN_SCHEME_STATUS_CHART_COLOR_TOKEN
      )
      expect(getSchemeStatusChartColorToken('workStatus', 99)).toBe(
        UNKNOWN_SCHEME_STATUS_CHART_COLOR_TOKEN
      )
    })
  })

  describe('resolveSchemeStatusLabel', () => {
    it('prefers the code over the supplied label', () => {
      expect(
        resolveSchemeStatusLabel(mockT, 'operatingStatus', { code: 1, label: 'GARBAGE' })
      ).toBe('common:schemeStatus.operating.operative')
    })

    it('resolves the same code differently per dimension', () => {
      expect(resolveSchemeStatusLabel(mockT, 'workStatus', { code: 1 })).toBe(
        'common:schemeStatus.work.ongoing'
      )
      expect(resolveSchemeStatusLabel(mockT, 'operatingStatus', { code: 1 })).toBe(
        'common:schemeStatus.operating.operative'
      )
    })

    it('falls back to the reverse label map when no code is present', () => {
      expect(resolveSchemeStatusLabel(mockT, 'workStatus', { label: 'handed over' })).toBe(
        'common:schemeStatus.work.handedOver'
      )
    })

    it('returns an unmapped label verbatim rather than blanking it', () => {
      expect(
        resolveSchemeStatusLabel(mockT, 'operatingStatus', { code: 99, label: 'Future Status' })
      ).toBe('Future Status')
      expect(
        resolveSchemeStatusLabel(mockT, 'operatingStatus', { label: 'Partially Operational' })
      ).toBe('Partially Operational')
    })

    it.each([[{ code: null, label: '' }], [{ code: null, label: '   ' }], [{}], [{ label: null }]])(
      'falls back to Unknown for %p',
      (status) => {
        expect(resolveSchemeStatusLabel(mockT, 'workStatus', status)).toBe(
          UNKNOWN_SCHEME_STATUS_I18N_KEY
        )
      }
    )

    it('uses the canonical label as the defaultValue when a key is missing', () => {
      expect(resolveSchemeStatusLabel(mockTMissing, 'workStatus', { code: 2 })).toBe('Completed')
      expect(resolveSchemeStatusLabel(mockTMissing, 'workStatus', { code: null })).toBe('Unknown')
    })
  })

  describe('getSchemeStatusOptions', () => {
    it('returns options in UI order with canonical wire values', () => {
      expect(getSchemeStatusOptions(mockT, 'operatingStatus')).toEqual([
        {
          value: 'Non-Operative',
          label: 'common:schemeStatus.operating.nonOperative',
          code: 0,
        },
        {
          value: 'Partially Operative',
          label: 'common:schemeStatus.operating.partiallyOperative',
          code: 2,
        },
        { value: 'Operative', label: 'common:schemeStatus.operating.operative', code: 1 },
      ])
    })

    it('keeps the work status lifecycle order', () => {
      expect(getSchemeStatusOptions(mockT, 'workStatus').map((option) => option.value)).toEqual([
        'Not Started',
        'Ongoing',
        'Completed',
        'Handed Over',
      ])
    })

    it('sends an English wire value even when the display label is translated', () => {
      const translated = getSchemeStatusOptions(
        (key) => (key === 'common:schemeStatus.operating.operative' ? 'पৰিচালিত' : key),
        'operatingStatus'
      )
      const operative = translated.find((option) => option.code === 1)

      expect(operative?.value).toBe('Operative')
      expect(operative?.label).toBe('पৰিচালিত')
    })

    it('never emits a falsy wire value, so no filter can be silently dropped', () => {
      ;(['workStatus', 'operatingStatus'] as const).forEach((dimension) => {
        getSchemeStatusOptions(mockT, dimension).forEach((option) => {
          expect(option.value).toBeTruthy()
        })
      })
    })
  })

  describe('getSchemeStatusCount', () => {
    const buckets: SchemeStatusCount[] = [
      { code: 0, label: 'Non-Operative', count: 3 },
      { code: 1, label: 'Operative', count: 12 },
      { code: null, label: 'Unknown', count: 2 },
    ]

    it('returns the count for a present code', () => {
      expect(getSchemeStatusCount(buckets, 1)).toBe(12)
    })

    it('resolves code 0 rather than treating it as falsy', () => {
      expect(getSchemeStatusCount(buckets, 0)).toBe(3)
    })

    it('returns the Unknown count for a null code', () => {
      expect(getSchemeStatusCount(buckets, null)).toBe(2)
    })

    it('returns 0 when the bucket is absent from the list', () => {
      expect(getSchemeStatusCount(buckets, 2)).toBe(0)
    })

    it.each([[undefined], [null], [[]]])('returns 0 for %p', (input) => {
      expect(getSchemeStatusCount(input, 1)).toBe(0)
    })

    it('sums duplicate codes so a malformed payload loses no data', () => {
      expect(
        getSchemeStatusCount(
          [
            { code: 1, label: 'Operative', count: 4 },
            { code: 1, label: 'Operative', count: 6 },
          ],
          1
        )
      ).toBe(10)
    })

    it('ignores buckets for other codes', () => {
      expect(getSchemeStatusCount([{ code: 99, label: 'Future', count: 7 }], 1)).toBe(0)
    })
  })

  describe('sortSchemeStatusCounts', () => {
    it('sorts ascending by code with an unrecorded status last', () => {
      const sorted = sortSchemeStatusCounts([
        { code: null, label: 'Unknown', count: 1 },
        { code: 2, label: 'Partially Operative', count: 2 },
        { code: 0, label: 'Non-Operative', count: 3 },
        { code: 1, label: 'Operative', count: 4 },
      ])

      expect(sorted.map((bucket) => bucket.code)).toEqual([0, 1, 2, null])
    })

    it('leaves an already sorted list unchanged', () => {
      const input: SchemeStatusCount[] = [
        { code: 1, label: 'Ongoing', count: 1 },
        { code: 2, label: 'Completed', count: 2 },
      ]

      expect(sortSchemeStatusCounts(input).map((b) => b.code)).toEqual([1, 2])
    })

    it('does not mutate the input array', () => {
      const input: SchemeStatusCount[] = [
        { code: 2, label: 'Completed', count: 2 },
        { code: 1, label: 'Ongoing', count: 1 },
      ]

      sortSchemeStatusCounts(input)

      expect(input.map((bucket) => bucket.code)).toEqual([2, 1])
    })

    it('preserves unrecognised codes in ascending position', () => {
      const sorted = sortSchemeStatusCounts([
        { code: 99, label: 'Future', count: 1 },
        { code: 1, label: 'Operative', count: 2 },
      ])

      expect(sorted.map((bucket) => bucket.code)).toEqual([1, 99])
    })

    it.each([[undefined], [null], [[]]])('returns an empty array for %p', (input) => {
      expect(sortSchemeStatusCounts(input)).toEqual([])
    })

    it('handles two unrecorded statuses without reordering them', () => {
      const sorted = sortSchemeStatusCounts([
        { code: null, label: 'Unknown A', count: 1 },
        { code: null, label: 'Unknown B', count: 2 },
      ])

      expect(sorted.map((bucket) => bucket.label)).toEqual(['Unknown A', 'Unknown B'])
    })

    // Two-element cases so the comparator is invoked in a known argument order in both directions.
    it('moves a leading unrecorded status to the end', () => {
      const sorted = sortSchemeStatusCounts([
        { code: null, label: 'Unknown', count: 1 },
        { code: 1, label: 'Operative', count: 2 },
      ])

      expect(sorted.map((bucket) => bucket.code)).toEqual([1, null])
    })

    it('keeps a trailing unrecorded status at the end', () => {
      const sorted = sortSchemeStatusCounts([
        { code: 1, label: 'Operative', count: 2 },
        { code: null, label: 'Unknown', count: 1 },
      ])

      expect(sorted.map((bucket) => bucket.code)).toEqual([1, null])
    })
  })

  describe('dimension coverage', () => {
    it('exposes descriptors for both dimensions', () => {
      const dimensions: SchemeStatusDimension[] = ['workStatus', 'operatingStatus']

      dimensions.forEach((dimension) => {
        expect(SCHEME_STATUS_DESCRIPTORS[dimension].length).toBeGreaterThan(0)
      })
    })
  })
})
