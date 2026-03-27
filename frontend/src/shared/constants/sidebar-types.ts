export interface SimpleNavItem {
  type: 'simple'
  path: string
  labelKey: string
  roles: string[]
  icon: string
}

export interface NavItemChild {
  path: string
  labelKey: string
  roles: string[]
}

export interface ExpandableNavItem {
  type: 'expandable'
  labelKey: string
  roles: string[]
  icon: string
  children: NavItemChild[]
}

export type SidebarNavItem = SimpleNavItem | ExpandableNavItem
