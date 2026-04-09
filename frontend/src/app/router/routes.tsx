import { createBrowserRouter } from 'react-router-dom'
import { ROUTES } from '@/shared/constants/routes'
import { MainLayout } from '@/shared/components/layout'
import { SingleTenantGate } from './single-tenant-gate'
import {
  OverviewPage as SuperAdminOverviewPage,
  StatesUTsPage,
  AddStateUTPage,
  ViewStateUTPage,
  EditStateUTPage,
  ManageStateAdminsPage,
  SuperUsersPage,
  SuperUserFormPage,
  InviteSuperUserPage,
  ViewSuperUserPage,
  SystemConfigPage,
} from '@/features/super-admin'
import {
  OverviewPage,
  ConfigurationPage,
  HierarchyPage,
  LanguagePage,
  IntegrationPage,
  WaterNormsPage,
  EscalationsFormPage,
  MessageTemplatesPage,
  StaffSyncPage,
  SchemeSyncPage,
  SchemeMappingsSyncPage,
  StateUTAdminsPage,
  StateUTAdminFormPage,
  InviteStateUTAdminPage,
  ViewStateUTAdminPage,
} from '@/features/state-admin'
import { LoginPage, ResetPasswordPage, ProfilePage, ChangePasswordPage } from '@/features/auth'
import { AccountActivationPage } from '@/features/auth/components/activate-account/activate-account-page'
import {
  StaffLoginPage,
  StaffOverviewPage,
  SchemesPage,
  SchemeViewPage,
  PumpOperatorsPage,
  PumpOperatorViewPage,
  AnomaliesPage,
  StaffEscalationsPage,
} from '@/features/section-officer'
import { ProtectedRoute, RedirectIfAuthenticated } from '@/shared/components/routing/ProtectedRoute'
import { AUTH_ROLES } from '@/shared/constants/auth'
import { NotFoundPage } from '@/shared/components/common'

export const router = createBrowserRouter([
  // Public dashboards (single-tenant aware)
  {
    path: ROUTES.DASHBOARD,
    element: <SingleTenantGate />,
  },

  // Shared routes — all authenticated roles
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: ROUTES.PROFILE,
        element: <ProfilePage />,
      },
      {
        path: ROUTES.CHANGE_PASSWORD,
        element: <ChangePasswordPage />,
      },
    ],
  },

  {
    path: '/:stateSlug',
    element: <SingleTenantGate />,
  },

  // Auth
  {
    path: ROUTES.LOGIN,
    element: (
      <RedirectIfAuthenticated>
        <LoginPage />
      </RedirectIfAuthenticated>
    ),
  },

  {
    path: ROUTES.CREATE_PASSWORD,
    element: <AccountActivationPage />,
  },
  {
    path: ROUTES.RESET_PASSWORD,
    element: (
      <RedirectIfAuthenticated>
        <ResetPasswordPage />
      </RedirectIfAuthenticated>
    ),
  },
  // Super Admin routes
  {
    path: ROUTES.SUPER_ADMIN,
    element: (
      <ProtectedRoute allowedRoles={[AUTH_ROLES.SUPER_ADMIN, AUTH_ROLES.SUPER_STATE_ADMIN]}>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <SuperAdminOverviewPage />,
      },
      {
        path: ROUTES.SUPER_ADMIN_CONFIGURATION,
        element: <SystemConfigPage />,
      },
      {
        path: ROUTES.SUPER_ADMIN_STATES_UTS,
        element: <StatesUTsPage />,
      },
      {
        path: ROUTES.SUPER_ADMIN_STATES_UTS_ADD,
        element: <AddStateUTPage />,
      },
      {
        path: ROUTES.SUPER_ADMIN_STATES_UTS_VIEW,
        element: <ViewStateUTPage />,
      },
      {
        path: ROUTES.SUPER_ADMIN_STATES_UTS_EDIT,
        element: <EditStateUTPage />,
      },
      {
        path: ROUTES.SUPER_ADMIN_MANAGE_ADMINS,
        element: <ManageStateAdminsPage />,
      },
      {
        path: ROUTES.SUPER_ADMIN_SUPER_USERS,
        element: <SuperUsersPage />,
      },
      {
        path: ROUTES.SUPER_ADMIN_SUPER_USERS_ADD,
        element: <InviteSuperUserPage />,
      },
      {
        path: ROUTES.SUPER_ADMIN_SUPER_USERS_VIEW,
        element: <ViewSuperUserPage />,
      },
      {
        path: ROUTES.SUPER_ADMIN_SUPER_USERS_EDIT,
        element: <SuperUserFormPage />,
      },
    ],
  },

  // State Admin routes
  {
    path: ROUTES.STATE_ADMIN,
    element: (
      <ProtectedRoute allowedRoles={[AUTH_ROLES.STATE_ADMIN, AUTH_ROLES.SUPER_STATE_ADMIN]}>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <OverviewPage />,
      },
      {
        path: ROUTES.STATE_ADMIN_CONFIGURATION,
        element: <ConfigurationPage />,
      },
      {
        path: ROUTES.STATE_ADMIN_HIERARCHY,
        element: <HierarchyPage />,
      },
      {
        path: ROUTES.STATE_ADMIN_LANGUAGE,
        element: <LanguagePage />,
      },
      {
        path: ROUTES.STATE_ADMIN_WATER_NORMS,
        element: <WaterNormsPage />,
      },
      {
        path: ROUTES.STATE_ADMIN_INTEGRATION,
        element: <IntegrationPage />,
      },
      {
        path: ROUTES.STATE_ADMIN_ESCALATIONS,
        element: <EscalationsFormPage />,
      },
      {
        path: ROUTES.STATE_ADMIN_TEMPLATES,
        element: <MessageTemplatesPage />,
      },
      {
        path: ROUTES.STATE_ADMIN_STAFF_SYNC,
        element: <StaffSyncPage />,
      },
      {
        path: ROUTES.STATE_ADMIN_SCHEME_SYNC,
        element: <SchemeSyncPage />,
      },
      {
        path: ROUTES.STATE_ADMIN_SCHEME_MAPPINGS_SYNC,
        element: <SchemeMappingsSyncPage />,
      },
      {
        path: ROUTES.STATE_ADMIN_STATE_UT_ADMINS,
        element: <StateUTAdminsPage />,
      },
      {
        path: ROUTES.STATE_ADMIN_STATE_UT_ADMINS_ADD,
        element: <InviteStateUTAdminPage />,
      },
      {
        path: ROUTES.STATE_ADMIN_STATE_UT_ADMINS_VIEW,
        element: <ViewStateUTAdminPage />,
      },
      {
        path: ROUTES.STATE_ADMIN_STATE_UT_ADMINS_EDIT,
        element: <StateUTAdminFormPage />,
      },
    ],
  },

  // Staff login (public, redirects if already authenticated)
  {
    path: ROUTES.STAFF_LOGIN,
    element: (
      <RedirectIfAuthenticated>
        <StaffLoginPage />
      </RedirectIfAuthenticated>
    ),
  },

  // Staff panel — SECTION_OFFICER and SUB_DIVISIONAL_OFFICER
  {
    path: ROUTES.STAFF,
    element: (
      <ProtectedRoute
        allowedRoles={[AUTH_ROLES.SECTION_OFFICER, AUTH_ROLES.SUB_DIVISIONAL_OFFICER]}
      >
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <StaffOverviewPage />,
      },
      {
        path: ROUTES.STAFF_SCHEMES,
        element: <SchemesPage />,
      },
      {
        path: ROUTES.STAFF_SCHEMES_VIEW,
        element: <SchemeViewPage />,
      },
      {
        path: ROUTES.STAFF_PUMP_OPERATORS,
        element: <PumpOperatorsPage />,
      },
      {
        path: ROUTES.STAFF_PUMP_OPERATORS_VIEW,
        element: <PumpOperatorViewPage />,
      },
      {
        path: ROUTES.STAFF_ANOMALIES,
        element: <AnomaliesPage />,
      },
      {
        path: ROUTES.STAFF_ESCALATIONS,
        element: <StaffEscalationsPage />,
      },
    ],
  },

  {
    path: '*',
    element: <NotFoundPage />,
  },
])
