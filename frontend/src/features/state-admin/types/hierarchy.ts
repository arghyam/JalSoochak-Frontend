export type HierarchyType = 'LGD' | 'DEPARTMENT'

export interface HierarchyLevel {
  level: number
  name: string
}

export interface HierarchyData {
  hierarchyType: HierarchyType
  levels: HierarchyLevel[]
}

export interface HierarchyEditConstraints {
  hierarchyType: HierarchyType
  structuralChangesAllowed: boolean
  seededRecordCount: number
}

// ─── API shapes ───────────────────────────────────────────────────────────────

export interface ApiHierarchyLevel {
  level: number
  levelName: { title: string }[]
}

export interface ApiHierarchyResponse {
  hierarchyType: HierarchyType
  levels: ApiHierarchyLevel[]
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_LGD_HIERARCHY: HierarchyLevel[] = [
  { level: 1, name: 'State' },
  { level: 2, name: 'District' },
  { level: 3, name: 'Block' },
  { level: 4, name: 'Panchayat' },
  { level: 5, name: 'Village' },
]

export const DEFAULT_DEPARTMENT_HIERARCHY: HierarchyLevel[] = [
  { level: 1, name: 'State' },
  { level: 2, name: 'Zone' },
  { level: 3, name: 'Circle' },
  { level: 4, name: 'Division' },
  { level: 5, name: 'Sub-division' },
]

// ─── Mappers ──────────────────────────────────────────────────────────────────

export function mapApiHierarchyToLevels(
  apiLevels: ApiHierarchyLevel[],
  defaults: HierarchyLevel[]
): HierarchyLevel[] {
  if (!apiLevels?.length) return defaults
  return apiLevels.map((l) => ({
    level: l.level,
    name: l.levelName?.[0]?.title ?? '',
  }))
}

export function mapLevelsToApiPayload(levels: HierarchyLevel[]): ApiHierarchyLevel[] {
  return levels.map((l) => ({
    level: l.level,
    levelName: [{ title: l.name }],
  }))
}
