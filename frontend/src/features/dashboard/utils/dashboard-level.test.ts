import { describe, expect, it } from '@jest/globals'
import {
  ADMINISTRATIVE_LEVEL_PARAMS,
  DEPARTMENTAL_LEVEL_PARAMS,
  resolveDashboardLevel,
} from './dashboard-level'

const resolve = (search: string, stateSlug = '', isSingleTenant = false) =>
  resolveDashboardLevel({
    searchParams: new URLSearchParams(search),
    stateSlug,
    isSingleTenant,
  })

describe('resolveDashboardLevel — base levels', () => {
  it('resolves the national landing view when multi-tenant with no state', () => {
    const view = resolve('')

    expect(view).toEqual({
      level: 'national',
      hierarchy: 'administrative',
      depth: 0,
      names: {},
    })
  })

  it('resolves the state view when a state slug is present', () => {
    const view = resolve('', 'assam')

    expect(view.level).toBe('state')
    expect(view.depth).toBe(1)
    expect(view.state).toBe('assam')
  })

  it('starts at the state level in single-tenant mode even with no state in the path', () => {
    const view = resolve('', '', true)

    expect(view.level).toBe('state')
    expect(view.depth).toBe(1)
    // Nothing in the path, so no state param is reported.
    expect(view.state).toBeUndefined()
  })

  it('treats a whitespace-only state slug as absent', () => {
    expect(resolve('', '   ').level).toBe('national')
  })
})

describe('resolveDashboardLevel — administrative hierarchy', () => {
  const cases = [
    { search: '?district=2:2:bajali', level: 'district', depth: 2 },
    { search: '?district=2:2:bajali&block=39:39:bhabanipur', level: 'block', depth: 3 },
    {
      search: '?district=2:2:bajali&block=39:39:bhabanipur&gramPanchayat=294:294:chauliabari',
      level: 'gramPanchayat',
      depth: 4,
    },
    {
      search:
        '?district=2:2:bajali&block=39:39:bhabanipur&gramPanchayat=294:294:chauliabari&village=3049:3049:bangti',
      level: 'village',
      depth: 5,
    },
  ] as const

  it.each(cases)('resolves $level at depth $depth', ({ search, level, depth }) => {
    const view = resolve(search, 'assam')

    expect(view.level).toBe(level)
    expect(view.depth).toBe(depth)
    expect(view.hierarchy).toBe('administrative')
  })

  it('reports the slug of every selected level and drops the numeric ids', () => {
    const view = resolve(
      '?district=2:2:bajali&block=39:39:bhabanipur&gramPanchayat=294:294:chauliabari&village=3049:3049:bangti',
      'assam'
    )

    expect(view.names).toEqual({
      district_name: 'bajali',
      block_name: 'bhabanipur',
      gram_panchayat_name: 'chauliabari',
      village_name: 'bangti',
    })
  })

  it('is independent of param order in the URL', () => {
    // URLSearchParams.set() preserves a key's original position, so a deeper level can
    // appear before a shallower one after drilling down and back up. Reading the last key
    // in the URL would report `block` here; walking the ordered list reports `village`.
    const view = resolve(
      '?village=3049:3049:bangti&gramPanchayat=294:294:chauliabari&district=2:2:bajali&block=39:39:bhabanipur',
      'assam'
    )

    expect(view.level).toBe('village')
    expect(view.depth).toBe(5)
  })
})

describe('resolveDashboardLevel — administrative cascade guard', () => {
  it('ignores a block with no district, matching how the dashboard reads the URL', () => {
    const view = resolve('?block=39:39:bhabanipur', 'assam')

    expect(view.level).toBe('state')
    expect(view.names).toEqual({})
  })

  it('stops at the last unbroken level when a middle level is missing', () => {
    const view = resolve('?district=2:2:bajali&village=3049:3049:bangti', 'assam')

    expect(view.level).toBe('district')
    expect(view.depth).toBe(2)
    expect(view.names).toEqual({ district_name: 'bajali' })
  })

  it('treats an empty param value as absent', () => {
    expect(resolve('?district=2:2:bajali&block=', 'assam').level).toBe('district')
  })

  it('treats a whitespace-only param value as absent', () => {
    expect(resolve('?district=2:2:bajali&block=%20%20', 'assam').level).toBe('district')
  })
})

describe('resolveDashboardLevel — departmental hierarchy', () => {
  const cases = [
    { search: '?departmentZone=1:1:lower-assam', level: 'departmentZone', depth: 2 },
    {
      search: '?departmentZone=1:1:lower-assam&departmentCircle=5:5:barpeta',
      level: 'departmentCircle',
      depth: 3,
    },
    {
      search:
        '?departmentZone=1:1:lower-assam&departmentCircle=5:5:barpeta&departmentDivision=9:9:bajali-div',
      level: 'departmentDivision',
      depth: 4,
    },
    {
      search:
        '?departmentZone=1:1:lower-assam&departmentCircle=5:5:barpeta&departmentDivision=9:9:bajali-div&departmentSubdivision=17:17:pathsala',
      level: 'departmentSubdivision',
      depth: 5,
    },
    {
      search:
        '?departmentZone=1:1:lower-assam&departmentCircle=5:5:barpeta&departmentDivision=9:9:bajali-div&departmentSubdivision=17:17:pathsala&departmentVillage=88:88:bangti',
      level: 'departmentVillage',
      depth: 6,
    },
  ] as const

  it.each(cases)('resolves $level at depth $depth', ({ search, level, depth }) => {
    const view = resolve(search, 'assam')

    expect(view.level).toBe(level)
    expect(view.depth).toBe(depth)
    expect(view.hierarchy).toBe('departmental')
  })

  it('reports the departmental level names under their own params', () => {
    const view = resolve(
      '?departmentZone=1:1:lower-assam&departmentCircle=5:5:barpeta&departmentDivision=9:9:bajali-div&departmentSubdivision=17:17:pathsala&departmentVillage=88:88:bangti',
      'assam'
    )

    expect(view.names).toEqual({
      zone_name: 'lower-assam',
      circle_name: 'barpeta',
      division_name: 'bajali-div',
      subdivision_name: 'pathsala',
      department_village_name: 'bangti',
    })
  })

  it('does not cascade-guard departmental levels, since the dashboard does not either', () => {
    const view = resolve('?departmentSubdivision=17:17:pathsala', 'assam')

    expect(view.level).toBe('departmentSubdivision')
    expect(view.depth).toBe(5)
    expect(view.names).toEqual({ subdivision_name: 'pathsala' })
  })
})

describe('resolveDashboardLevel — hierarchy inference', () => {
  it('infers departmental from the presence of a department param, not from the tab', () => {
    // The URL never carries tab=departmental; the departmental hierarchy is the absence
    // of the tab param.
    const view = resolve('?departmentZone=1:1:lower-assam', 'assam')

    expect(view.hierarchy).toBe('departmental')
  })

  it('infers administrative when tab=administrative is present', () => {
    expect(resolve('?tab=administrative&district=2:2:bajali', 'assam').hierarchy).toBe(
      'administrative'
    )
  })

  it('infers administrative for a bare state view with no tab param', () => {
    expect(resolve('', 'assam').hierarchy).toBe('administrative')
  })

  it('lets a stale department param win over administrative params', () => {
    // Departmental params are checked first, so a leftover department param decides the
    // hierarchy. This mirrors the dashboard, where any department param forces tab 1.
    const view = resolve('?district=2:2:bajali&departmentZone=1:1:lower-assam', 'assam')

    expect(view.hierarchy).toBe('departmental')
    expect(view.level).toBe('departmentZone')
  })

  it('ignores an empty department param when inferring the hierarchy', () => {
    const view = resolve('?district=2:2:bajali&departmentZone=', 'assam')

    expect(view.hierarchy).toBe('administrative')
    expect(view.level).toBe('district')
  })
})

describe('resolveDashboardLevel — legacy value encodings', () => {
  it('reads the slug from a two-segment value', () => {
    expect(resolve('?district=3:baksa', 'assam').names).toEqual({ district_name: 'baksa' })
  })

  it('reads a bare slug with no ids', () => {
    expect(resolve('?district=sangareddy', 'assam').names).toEqual({
      district_name: 'sangareddy',
    })
  })

  it('still resolves the level when a value carries no readable slug', () => {
    // A numeric-only value has no slug segment to report, but the level still counts.
    const view = resolve('?district=2', 'assam')

    expect(view.level).toBe('district')
    expect(view.names).toEqual({ district_name: '2' })
  })
})

describe('level param ordering', () => {
  it('lists administrative params shallowest first', () => {
    expect(ADMINISTRATIVE_LEVEL_PARAMS).toEqual(['district', 'block', 'gramPanchayat', 'village'])
  })

  it('lists departmental params shallowest first', () => {
    expect(DEPARTMENTAL_LEVEL_PARAMS).toEqual([
      'departmentZone',
      'departmentCircle',
      'departmentDivision',
      'departmentSubdivision',
      'departmentVillage',
    ])
  })
})
