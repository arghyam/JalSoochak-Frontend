import { createBrowserRouter } from 'react-router-dom'
import { ROUTES } from '@/shared/constants/routes'
import { MainLayout, DashboardLayout } from '@/shared/components/layout'
import { CentralDashboard } from '@/features/dashboard/components/central-dashboard'
import {
  OverviewPage as SuperAdminOverviewPage,
  SystemRulesPage,
  StatesUTsPage,
  AddStateUTPage,
  ViewStateUTPage,
  EditStateUTPage,
  ManageStateAdminsPage,
  ApiCredentialsPage,
  IngestionMonitorPage,
  SuperUsersPage,
  SuperUserFormPage,
  InviteSuperUserPage,
  ViewSuperUserPage,
  SystemConfigPage,
} from '@/features/super-admin'
import {
  OverviewPage,
  ConfigurationPage,
  ActivityPage,
  HierarchyPage,
  LanguagePage,
  IntegrationPage,
  WaterNormsPage,
  EscalationsFormPage,
  NudgesTemplatePage,
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
import { ProtectedRoute, RedirectIfAuthenticated } from '@/shared/components/routing/ProtectedRoute'
import { AUTH_ROLES } from '@/shared/constants/auth'
import { NotFoundPage } from '@/shared/components/common'

import { Box, Heading, Text } from '@chakra-ui/react'

export const router = createBrowserRouter([
  // Public dashboards
  {
    path: ROUTES.DASHBOARD,
    element: (
      <DashboardLayout>
        <CentralDashboard />
      </DashboardLayout>
    ),
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
    element: (
      <DashboardLayout>
        <CentralDashboard />
      </DashboardLayout>
    ),
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
      <ProtectedRoute allowedRoles={[AUTH_ROLES.SUPER_ADMIN]}>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <SuperAdminOverviewPage />,
      },
      {
        path: ROUTES.SUPER_ADMIN_SYSTEM_RULES,
        element: <SystemRulesPage />,
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
        path: ROUTES.SUPER_ADMIN_API_CREDENTIALS,
        element: <ApiCredentialsPage />,
      },
      {
        path: ROUTES.SUPER_ADMIN_INGESTION_MONITOR,
        element: <IngestionMonitorPage />,
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
      <ProtectedRoute allowedRoles={[AUTH_ROLES.STATE_ADMIN]}>
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
        path: ROUTES.STATE_ADMIN_NUDGES,
        element: <NudgesTemplatePage />,
      },
      {
        path: ROUTES.STATE_ADMIN_TEMPLATES,
        element: <MessageTemplatesPage />,
      },
      {
        path: ROUTES.STATE_ADMIN_API_INGESTION,
        element: (
          <Box p={6}>
            <Heading fontSize="2xl" fontWeight="bold">
              API Ingestion
            </Heading>
            <Text color="gray.600">Coming soon...</Text>
          </Box>
        ),
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
        path: ROUTES.STATE_ADMIN_ACTIVITY,
        element: <ActivityPage />,
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

  {
    path: '*',
    element: <NotFoundPage />,
  },
])
