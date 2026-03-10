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
    path: ROUTES.SUPER_ADMIN_SYSTEM_RULES,
    labelKey: 'sidebar.systemRules',
    roles: [AUTH_ROLES.SUPER_ADMIN],
    icon: 'AiOutlineSetting',
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
  // {
  //   type: 'simple',
  //   path: ROUTES.SUPER_ADMIN_API_CREDENTIALS,
  //   labelKey: 'sidebar.apiCredentials',
  //   roles: [AUTH_ROLES.SUPER_ADMIN],
  //   icon: 'BiKey',
  // },
  // {
  //   type: 'simple',
  //   path: ROUTES.SUPER_ADMIN_INGESTION_MONITOR,
  //   labelKey: 'sidebar.ingestionMonitor',
  //   roles: [AUTH_ROLES.SUPER_ADMIN],
  //   icon: 'AiOutlineApi',
  // },
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
    path: ROUTES.STATE_ADMIN_NUDGES,
    labelKey: 'sidebar.nudgesTemplate',
    roles: [AUTH_ROLES.STATE_ADMIN],
    icon: 'HiOutlineTemplate',
  },
  {
    type: 'simple',
    path: ROUTES.STATE_ADMIN_STAFF_SYNC,
    labelKey: 'sidebar.staffSync',
    roles: [AUTH_ROLES.STATE_ADMIN],
    icon: 'BsPerson',
  },
  {
    type: 'simple',
    path: ROUTES.STATE_ADMIN_STATE_UT_ADMINS,
    labelKey: 'sidebar.stateUtAdmins',
    roles: [AUTH_ROLES.STATE_ADMIN],
    icon: 'BsPeople',
  },
  {
    type: 'simple',
    path: ROUTES.STATE_ADMIN_ACTIVITY,
    labelKey: 'sidebar.activity',
    roles: [AUTH_ROLES.STATE_ADMIN],
    icon: 'BsListUl',
  },
]
