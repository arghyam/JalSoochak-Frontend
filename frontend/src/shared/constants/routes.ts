export const ROUTES = {
  DASHBOARD: '/',
  // Super Admin routes
  SUPER_ADMIN: '/super-admin',
  SUPER_ADMIN_OVERVIEW: '/super-admin',
  SUPER_ADMIN_SYSTEM_RULES: '/super-admin/system-rules',
  SUPER_ADMIN_STATES_UTS: '/super-admin/states-uts',
  SUPER_ADMIN_STATES_UTS_ADD: '/super-admin/states-uts/add',
  SUPER_ADMIN_STATES_UTS_VIEW: '/super-admin/states-uts/:id',
  SUPER_ADMIN_STATES_UTS_EDIT: '/super-admin/states-uts/:id/edit',
  SUPER_ADMIN_MANAGE_ADMINS: '/super-admin/manage-admins',
  SUPER_ADMIN_API_CREDENTIALS: '/super-admin/api-credentials',
  SUPER_ADMIN_INGESTION_MONITOR: '/super-admin/ingestion-monitor',
  // State Admin routes
  STATE_ADMIN: '/state-admin',
  STATE_ADMIN_OVERVIEW: '/state-admin',
  STATE_ADMIN_CONFIGURATION: '/state-admin/configuration',
  STATE_ADMIN_LANGUAGE: '/state-admin/language',
  STATE_ADMIN_WATER_NORMS: '/state-admin/water-norms',
  STATE_ADMIN_INTEGRATION: '/state-admin/integration',
  STATE_ADMIN_ESCALATIONS: '/state-admin/escalations',
  STATE_ADMIN_THRESHOLDS: '/state-admin/thresholds',
  STATE_ADMIN_NUDGES: '/state-admin/nudges-template',
  STATE_ADMIN_API_INGESTION: '/state-admin/api-ingestion',
  STATE_ADMIN_OPERATOR_SYNC: '/state-admin/operator-sync',
  STATE_ADMIN_STAFF_SYNC: '/state-admin/staff-sync',
  STATE_ADMIN_ACTIVITY: '/state-admin/activity',
  STATE_ADMIN_STATE_UT_ADMINS: '/state-admin/state-ut-admins',
  STATE_ADMIN_STATE_UT_ADMINS_ADD: '/state-admin/state-ut-admins/add',
  STATE_ADMIN_STATE_UT_ADMINS_VIEW: '/state-admin/state-ut-admins/:id',
  STATE_ADMIN_STATE_UT_ADMINS_EDIT: '/state-admin/state-ut-admins/:id/edit',
  // Auth routes
  LOGIN: '/login',
  LOGOUT: '/logout',
  SIGNUP: '/signup',
  CREATE_PASSWORD: '/createpassword/:id',
  CREDENTIALS: '/credentials',
  RESET_PASSWORD: '/resetpassword',
} as const

export function createPasswordUrl(id: string): string {
  return `/createpassword/${id}`
}
