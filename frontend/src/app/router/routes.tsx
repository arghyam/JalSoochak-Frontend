import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { ROUTES } from '@/shared/constants/routes'
import { MainLayout } from '@/shared/components/layout'
import { SingleTenantLayout } from './single-tenant-layout'
import { ProtectedRoute, RedirectIfAuthenticated } from '@/shared/components/routing/ProtectedRoute'
import { AUTH_ROLES } from '@/shared/constants/auth'
import { NotFoundPage, LoadingSpinner, ErrorBoundary } from '@/shared/components/common'
import { PageErrorState } from '@/shared/components/common/page-error-state'

// — super-admin pages —
const SuperAdminOverviewPage = lazy(() =>
  import('@/features/super-admin/components/overview/overview-page').then((m) => ({
    default: m.OverviewPage,
  }))
)
const StatesUTsPage = lazy(() =>
  import('@/features/super-admin/components/states-uts/states-uts-page').then((m) => ({
    default: m.StatesUTsPage,
  }))
)
const AddStateUTPage = lazy(() =>
  import('@/features/super-admin/components/states-uts/add-state-ut-page').then((m) => ({
    default: m.AddStateUTPage,
  }))
)
const ViewStateUTPage = lazy(() =>
  import('@/features/super-admin/components/states-uts/view-state-ut-page').then((m) => ({
    default: m.ViewStateUTPage,
  }))
)
const EditStateUTPage = lazy(() =>
  import('@/features/super-admin/components/states-uts/edit-state-ut-page').then((m) => ({
    default: m.EditStateUTPage,
  }))
)
const ManageStateAdminsPage = lazy(() =>
  import('@/features/super-admin/components/state-admins/manage-state-admins-page').then((m) => ({
    default: m.ManageStateAdminsPage,
  }))
)
const SuperUsersPage = lazy(() =>
  import('@/features/super-admin/components/super-users/super-users-page').then((m) => ({
    default: m.SuperUsersPage,
  }))
)
const SuperUserFormPage = lazy(() =>
  import('@/features/super-admin/components/super-users/super-user-form-page').then((m) => ({
    default: m.SuperUserFormPage,
  }))
)
const InviteSuperUserPage = lazy(() =>
  import('@/features/super-admin/components/super-users/invite-super-user-page').then((m) => ({
    default: m.InviteSuperUserPage,
  }))
)
const ViewSuperUserPage = lazy(() =>
  import('@/features/super-admin/components/super-users/view-super-user-page').then((m) => ({
    default: m.ViewSuperUserPage,
  }))
)
const SystemConfigPage = lazy(() =>
  import('@/features/super-admin/components/configuration/system-config-page').then((m) => ({
    default: m.SystemConfigPage,
  }))
)

// — state-admin pages —
const OverviewPage = lazy(() =>
  import('@/features/state-admin/components/overview/overview-page').then((m) => ({
    default: m.OverviewPage,
  }))
)
const ConfigurationPage = lazy(() =>
  import('@/features/state-admin/components/configuration/configuration-page').then((m) => ({
    default: m.ConfigurationPage,
  }))
)
const HierarchyPage = lazy(() =>
  import('@/features/state-admin/components/hierarchy/hierarchy-page').then((m) => ({
    default: m.HierarchyPage,
  }))
)
const LanguagePage = lazy(() =>
  import('@/features/state-admin/components/language/language-page').then((m) => ({
    default: m.LanguagePage,
  }))
)
const IntegrationPage = lazy(() =>
  import('@/features/state-admin/components/integration/integration-page').then((m) => ({
    default: m.IntegrationPage,
  }))
)
const WaterNormsPage = lazy(() =>
  import('@/features/state-admin/components/water-norms/water-norms-page').then((m) => ({
    default: m.WaterNormsPage,
  }))
)
const EscalationsFormPage = lazy(() =>
  import('@/features/state-admin/components/escalations/escalations-form-page').then((m) => ({
    default: m.EscalationsFormPage,
  }))
)
const MessageTemplatesPage = lazy(() =>
  import('@/features/state-admin/components/nudges-template/message-templates-page').then((m) => ({
    default: m.MessageTemplatesPage,
  }))
)
const StaffSyncPage = lazy(() =>
  import('@/features/state-admin/components/staff-sync/staff-sync-page').then((m) => ({
    default: m.StaffSyncPage,
  }))
)
const SchemeSyncPage = lazy(() =>
  import('@/features/state-admin/components/scheme-sync/scheme-sync-page').then((m) => ({
    default: m.SchemeSyncPage,
  }))
)
const SchemeMappingsSyncPage = lazy(() =>
  import('@/features/state-admin/components/scheme-mappings-sync/scheme-mappings-sync-page').then(
    (m) => ({ default: m.SchemeMappingsSyncPage })
  )
)
const StateUTAdminsPage = lazy(() =>
  import('@/features/state-admin/components/state-ut-admins/state-ut-admins-page').then((m) => ({
    default: m.StateUTAdminsPage,
  }))
)
const StateUTAdminFormPage = lazy(() =>
  import('@/features/state-admin/components/state-ut-admins/state-ut-admin-form-page').then(
    (m) => ({
      default: m.StateUTAdminFormPage,
    })
  )
)
const InviteStateUTAdminPage = lazy(() =>
  import('@/features/state-admin/components/state-ut-admins/invite-state-ut-admin-page').then(
    (m) => ({ default: m.InviteStateUTAdminPage })
  )
)
const ViewStateUTAdminPage = lazy(() =>
  import('@/features/state-admin/components/state-ut-admins/view-state-ut-admin-page').then(
    (m) => ({
      default: m.ViewStateUTAdminPage,
    })
  )
)

// — auth pages —
const LoginPage = lazy(() =>
  import('@/features/auth/components/login/login-page').then((m) => ({ default: m.LoginPage }))
)
const ResetPasswordPage = lazy(() =>
  import('@/features/auth/components/login/reset-password-page').then((m) => ({
    default: m.ResetPasswordPage,
  }))
)
const ProfilePage = lazy(() =>
  import('@/features/auth/components/profile/profile-page').then((m) => ({
    default: m.ProfilePage,
  }))
)
const ChangePasswordPage = lazy(() =>
  import('@/features/auth/components/change-password/change-password-page').then((m) => ({
    default: m.ChangePasswordPage,
  }))
)
const AccountActivationPage = lazy(() =>
  import('@/features/auth/components/activate-account/activate-account-page').then((m) => ({
    default: m.AccountActivationPage,
  }))
)

// — section-officer pages —
const StaffLoginPage = lazy(() =>
  import('@/features/section-officer/components/login/staff-login-page').then((m) => ({
    default: m.StaffLoginPage,
  }))
)
const StaffOverviewPage = lazy(() =>
  import('@/features/section-officer/components/overview/staff-overview-page').then((m) => ({
    default: m.StaffOverviewPage,
  }))
)
const SchemesPage = lazy(() =>
  import('@/features/section-officer/components/schemes/schemes-page').then((m) => ({
    default: m.SchemesPage,
  }))
)
const SchemeViewPage = lazy(() =>
  import('@/features/section-officer/components/schemes/scheme-view-page').then((m) => ({
    default: m.SchemeViewPage,
  }))
)
const PumpOperatorsPage = lazy(() =>
  import('@/features/section-officer/components/pump-operators/pump-operators-page').then((m) => ({
    default: m.PumpOperatorsPage,
  }))
)
const PumpOperatorViewPage = lazy(() =>
  import('@/features/section-officer/components/pump-operators/pump-operator-view-page').then(
    (m) => ({ default: m.PumpOperatorViewPage })
  )
)
const AnomaliesPage = lazy(() =>
  import('@/features/section-officer/components/anomalies/anomalies-page').then((m) => ({
    default: m.AnomaliesPage,
  }))
)
const StaffEscalationsPage = lazy(() =>
  import('@/features/section-officer/components/escalations/staff-escalations-page').then((m) => ({
    default: m.StaffEscalationsPage,
  }))
)
const FixReadingsPage = lazy(() =>
  import('@/features/section-officer/components/fix-readings/fix-readings-page').then((m) => ({
    default: m.FixReadingsPage,
  }))
)

export const router = createBrowserRouter([
  // Public dashboards (single-tenant aware)
  {
    path: ROUTES.DASHBOARD,
    element: (
      <ErrorBoundary fallback={<PageErrorState message="Something went wrong" />}>
        <SingleTenantLayout />
      </ErrorBoundary>
    ),
  },

  // Shared routes — all authenticated roles
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<LoadingSpinner />}>
          <MainLayout />
        </Suspense>
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
    element: <SingleTenantLayout />,
  },

  // Auth
  {
    path: ROUTES.LOGIN,
    element: (
      <RedirectIfAuthenticated>
        <Suspense fallback={<LoadingSpinner />}>
          <LoginPage />
        </Suspense>
      </RedirectIfAuthenticated>
    ),
  },

  {
    path: ROUTES.CREATE_PASSWORD,
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <AccountActivationPage />
      </Suspense>
    ),
  },
  {
    path: ROUTES.RESET_PASSWORD,
    element: (
      <RedirectIfAuthenticated>
        <Suspense fallback={<LoadingSpinner />}>
          <ResetPasswordPage />
        </Suspense>
      </RedirectIfAuthenticated>
    ),
  },

  // Super Admin routes
  {
    path: ROUTES.SUPER_ADMIN,
    element: (
      <ErrorBoundary fallback={<PageErrorState message="Something went wrong" />}>
        <ProtectedRoute allowedRoles={[AUTH_ROLES.SUPER_ADMIN, AUTH_ROLES.SUPER_STATE_ADMIN]}>
          <Suspense fallback={<LoadingSpinner />}>
            <MainLayout />
          </Suspense>
        </ProtectedRoute>
      </ErrorBoundary>
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
      <ErrorBoundary fallback={<PageErrorState message="Something went wrong" />}>
        <ProtectedRoute allowedRoles={[AUTH_ROLES.STATE_ADMIN, AUTH_ROLES.SUPER_STATE_ADMIN]}>
          <Suspense fallback={<LoadingSpinner />}>
            <MainLayout />
          </Suspense>
        </ProtectedRoute>
      </ErrorBoundary>
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
        <Suspense fallback={<LoadingSpinner />}>
          <StaffLoginPage />
        </Suspense>
      </RedirectIfAuthenticated>
    ),
  },

  // Staff panel — SECTION_OFFICER and SUB_DIVISIONAL_OFFICER
  {
    path: ROUTES.STAFF,
    element: (
      <ErrorBoundary fallback={<PageErrorState message="Something went wrong" />}>
        <ProtectedRoute
          allowedRoles={[AUTH_ROLES.SECTION_OFFICER, AUTH_ROLES.SUB_DIVISIONAL_OFFICER]}
        >
          <Suspense fallback={<LoadingSpinner />}>
            <MainLayout />
          </Suspense>
        </ProtectedRoute>
      </ErrorBoundary>
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
      {
        path: ROUTES.STAFF_FIX_READINGS,
        element: <FixReadingsPage />,
      },
    ],
  },

  {
    path: '*',
    element: <NotFoundPage />,
  },
])
