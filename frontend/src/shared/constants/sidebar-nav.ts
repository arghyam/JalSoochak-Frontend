import { ROUTES } from '@/shared/constants/routes'
import { AUTH_ROLES } from '@/shared/constants/auth'
import type { SidebarNavItem } from './sidebar-types'

export const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  // Super Admin
  {
    type: 'simple',
    path: ROUTES.SUPER_ADMIN_OVERVIEW,
    labelKey: 'sidebar.overview',
    roles: [AUTH_ROLES.SUPER_ADMIN],
    icon: 'AiOutlineEye',
  },
  {
    type: 'simple',
    path: ROUTES.SUPER_ADMIN_CONFIGURATION,
    labelKey: 'sidebar.configuration',
    roles: [AUTH_ROLES.SUPER_ADMIN],
    icon: 'IoSettingsOutline',
  },
  {
    type: 'expandable',
    labelKey: 'sidebar.statesUts',
    roles: [AUTH_ROLES.SUPER_ADMIN],
    icon: 'MdOutlinePlace',
    children: [
      {
        path: ROUTES.SUPER_ADMIN_STATES_UTS,
        labelKey: 'sidebar.manageStatesUts',
        roles: [AUTH_ROLES.SUPER_ADMIN],
      },
      {
        path: ROUTES.SUPER_ADMIN_MANAGE_ADMINS,
        labelKey: 'sidebar.manageAdmins',
        roles: [AUTH_ROLES.SUPER_ADMIN],
      },
    ],
  },
  // State Admin
  {
    type: 'simple',
    path: ROUTES.SUPER_ADMIN_SUPER_USERS,
    labelKey: 'sidebar.superUsers',
    roles: [AUTH_ROLES.SUPER_ADMIN],
    icon: 'BsPeople',
  },
  {
    type: 'simple',
    path: ROUTES.STATE_ADMIN_OVERVIEW,
    labelKey: 'sidebar.overview',
    roles: [AUTH_ROLES.STATE_ADMIN],
    icon: 'AiOutlineEye',
  },
  {
    type: 'simple',
    path: ROUTES.STATE_ADMIN_CONFIGURATION,
    labelKey: 'sidebar.configuration',
    roles: [AUTH_ROLES.STATE_ADMIN],
    icon: 'IoSettingsOutline',
  },
  {
    type: 'simple',
    path: ROUTES.STATE_ADMIN_HIERARCHY,
    labelKey: 'sidebar.hierarchy',
    roles: [AUTH_ROLES.STATE_ADMIN],
    icon: 'PiTreeStructure',
  },
  {
    type: 'simple',
    path: ROUTES.STATE_ADMIN_LANGUAGE,
    labelKey: 'sidebar.language',
    roles: [AUTH_ROLES.STATE_ADMIN],
    icon: 'IoLanguageOutline',
  },
  {
    type: 'simple',
    path: ROUTES.STATE_ADMIN_WATER_NORMS,
    labelKey: 'sidebar.waterNorms',
    roles: [AUTH_ROLES.STATE_ADMIN],
    icon: 'IoWaterOutline',
  },
  {
    type: 'simple',
    path: ROUTES.STATE_ADMIN_INTEGRATION,
    labelKey: 'sidebar.integration',
    roles: [AUTH_ROLES.STATE_ADMIN],
    icon: 'AiOutlineMessage',
  },
  {
    type: 'simple',
    path: ROUTES.STATE_ADMIN_ESCALATIONS,
    labelKey: 'sidebar.escalations',
    roles: [AUTH_ROLES.STATE_ADMIN],
    icon: 'MdOutlineMoving',
  },
  {
    type: 'simple',
    path: ROUTES.STATE_ADMIN_TEMPLATES,
    labelKey: 'sidebar.templates',
    roles: [AUTH_ROLES.STATE_ADMIN],
    icon: 'HiOutlineTemplate',
  },
  {
    type: 'expandable',
    labelKey: 'sidebar.dataSync',
    roles: [AUTH_ROLES.STATE_ADMIN],
    icon: 'IoSyncOutline',
    children: [
      {
        path: ROUTES.STATE_ADMIN_STAFF_SYNC,
        labelKey: 'sidebar.staffSync',
        roles: [AUTH_ROLES.STATE_ADMIN],
      },
      {
        path: ROUTES.STATE_ADMIN_SCHEME_SYNC,
        labelKey: 'sidebar.schemeSync',
        roles: [AUTH_ROLES.STATE_ADMIN],
      },
      {
        path: ROUTES.STATE_ADMIN_SCHEME_MAPPINGS_SYNC,
        labelKey: 'sidebar.schemeMappingsSync',
        roles: [AUTH_ROLES.STATE_ADMIN],
      },
    ],
  },
  {
    type: 'simple',
    path: ROUTES.STATE_ADMIN_STATE_UT_ADMINS,
    labelKey: 'sidebar.stateUtAdmins',
    roles: [AUTH_ROLES.STATE_ADMIN],
    icon: 'BsPeople',
  },
]
