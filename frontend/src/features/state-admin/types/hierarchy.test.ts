import { describe, expect, it } from '@jest/globals'
import {
  DEFAULT_DEPARTMENT_HIERARCHY,
  DEFAULT_LGD_HIERARCHY,
  mapApiHierarchyToLevels,
  mapLevelsToApiPayload,
  type ApiHierarchyLevel,
  type HierarchyLevel,
} from './hierarchy'

describe('default hierarchies', () => {
  it('exposes LGD and department defaults with ordered levels', () => {
    expect(DEFAULT_LGD_HIERARCHY[0]).toEqual({ level: 1, name: 'State' })
    expect(DEFAULT_DEPARTMENT_HIERARCHY[4]).toEqual({ level: 5, name: 'Sub-division' })
  })
})

describe('mapApiHierarchyToLevels', () => {
  const defaults: HierarchyLevel[] = [{ level: 1, name: 'D' }]

  it('returns a copy of defaults when API levels are empty', () => {
    const out = mapApiHierarchyToLevels([], defaults)
    expect(out).toEqual(defaults)
    expect(out).not.toBe(defaults)
  })

  it('maps API level names using first title entry', () => {
    const apiLevels: ApiHierarchyLevel[] = [
      { level: 2, levelName: [{ title: 'District' }, { title: 'Ignored' }] },
      { level: 3, levelName: [] },
    ]
    expect(mapApiHierarchyToLevels(apiLevels, defaults)).toEqual([
      { level: 2, name: 'District' },
      { level: 3, name: '' },
    ])
  })
})

describe('mapLevelsToApiPayload', () => {
  it('wraps each level name in API shape', () => {
    const levels: HierarchyLevel[] = [
      { level: 1, name: 'State' },
      { level: 2, name: 'Block' },
    ]
    expect(mapLevelsToApiPayload(levels)).toEqual([
      { level: 1, levelName: [{ title: 'State' }] },
      { level: 2, levelName: [{ title: 'Block' }] },
    ])
  })
})
