import { describe, expect, it, jest, beforeAll } from '@jest/globals'
import type { ReactElement } from 'react'
import type { RouteObject } from 'react-router-dom'
import { ROUTES } from '@/shared/constants/routes'

function stub(id: string) {
  return function StubPage(): ReactElement {
    return <div data-testid={id} />
  }
}

jest.mock('@/app/router/single-tenant-gate', () => ({
  SingleTenantGate: stub('single-tenant-gate'),
}))

jest.mock('@/shared/components/layout', () => ({
  MainLayout: stub('main-layout'),
}))

jest.mock('@/features/super-admin', () => ({
  OverviewPage: stub('super-overview'),
  StatesUTsPage: stub('states-uts'),
  AddStateUTPage: stub('add-state-ut'),
  ViewStateUTPage: stub('view-state-ut'),
  EditStateUTPage: stub('edit-state-ut'),
  ManageStateAdminsPage: stub('manage-state-admins'),
  SuperUsersPage: stub('super-users'),
  SuperUserFormPage: stub('super-user-form'),
  InviteSuperUserPage: stub('invite-super-user'),
  ViewSuperUserPage: stub('view-super-user'),
  SystemConfigPage: stub('system-config'),
}))

jest.mock('@/features/state-admin', () => ({
  OverviewPage: stub('state-overview'),
  ConfigurationPage: stub('state-configuration'),
  HierarchyPage: stub('hierarchy'),
  LanguagePage: stub('language'),
  IntegrationPage: stub('integration'),
  WaterNormsPage: stub('water-norms'),
  EscalationsFormPage: stub('escalations'),
  MessageTemplatesPage: stub('templates'),
  StaffSyncPage: stub('staff-sync'),
  SchemeSyncPage: stub('scheme-sync'),
  SchemeMappingsSyncPage: stub('scheme-mappings-sync'),
  StateUTAdminsPage: stub('state-ut-admins'),
  StateUTAdminFormPage: stub('state-ut-admin-form'),
  InviteStateUTAdminPage: stub('invite-state-ut-admin'),
  ViewStateUTAdminPage: stub('view-state-ut-admin'),
}))

jest.mock('@/features/auth', () => ({
  LoginPage: stub('login'),
  ResetPasswordPage: stub('reset-password'),
  ProfilePage: stub('profile'),
  ChangePasswordPage: stub('change-password'),
}))

jest.mock('@/features/auth/components/activate-account/activate-account-page', () => ({
  AccountActivationPage: stub('activate-account'),
}))

jest.mock('@/features/section-officer', () => ({
  StaffLoginPage: stub('staff-login'),
  StaffOverviewPage: stub('staff-overview'),
  SchemesPage: stub('schemes'),
  SchemeViewPage: stub('scheme-view'),
  PumpOperatorsPage: stub('pump-operators'),
  PumpOperatorViewPage: stub('pump-operator-view'),
  AnomaliesPage: stub('anomalies'),
  StaffEscalationsPage: stub('staff-escalations'),
}))

jest.mock('@/shared/components/common', () => {
  const actual = jest.requireActual<typeof import('@/shared/components/common')>(
    '@/shared/components/common'
  )
  return {
    ...actual,
    NotFoundPage: stub('not-found'),
  }
})

function listDeclaredPaths(routes: RouteObject[]): string[] {
  const out: string[] = []
  const walk = (items: RouteObject[]) => {
    for (const route of items) {
      if (typeof route.path === 'string') {
        out.push(route.path)
      }
      if (route.children) {
        walk(route.children)
      }
    }
  }
  walk(routes)
  return out
}

describe('app router', () => {
  let routerRoutes: RouteObject[]

  beforeAll(async () => {
    const { router } = await import('./routes')
    routerRoutes = router.routes
  })

  it('defines core auth and panel paths', () => {
    const paths = listDeclaredPaths(routerRoutes)
    expect(paths).toEqual(expect.arrayContaining([ROUTES.LOGIN, ROUTES.STAFF_LOGIN, ROUTES.STAFF]))
    expect(paths).toEqual(
      expect.arrayContaining([ROUTES.SUPER_ADMIN, ROUTES.STATE_ADMIN, ROUTES.PROFILE])
    )
  })

  it('includes wildcard not-found route', () => {
    const hasCatchAll = routerRoutes.some((r) => r.path === '*')
    expect(hasCatchAll).toBe(true)
  })

  it('registers dashboard and tenant slug entry routes', () => {
    const paths = listDeclaredPaths(routerRoutes)
    expect(paths).toContain(ROUTES.DASHBOARD)
    expect(paths.some((p) => p.includes(':'))).toBe(true)
  })
})
