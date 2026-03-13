import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  UserAdminFormPage,
  type UserAdminRoutes,
  type UserAdminFormPageLabels,
  type UserAdminCreateMutation,
} from '@/shared/components/common'
import { ROUTES } from '@/shared/constants/routes'
import {
  useStateUTAdminByIdQuery,
  useUpdateStateUTAdminMutation,
  useUpdateStateUTAdminStatusMutation,
} from '../../services/query/use-state-admin-queries'

// Stub — add mode is handled by InviteStateUTAdminPage; this page is edit-only.
const neverCreate: UserAdminCreateMutation = {
  isPending: false,
  mutateAsync: () => Promise.reject(new Error('Use InviteStateUTAdminPage for add')),
}

export function StateUTAdminFormPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const { id } = useParams<{ id?: string }>()
  const isEditMode = Boolean(id)

  const adminQuery = useStateUTAdminByIdQuery(id)
  const updateMutation = useUpdateStateUTAdminMutation()
  const statusMutation = useUpdateStateUTAdminStatusMutation()

  useEffect(() => {
    document.title = `${isEditMode ? t('stateUtAdmins.editTitle') : t('stateUtAdmins.addTitle')} | JalSoochak`
  }, [t, isEditMode])

  const routes: UserAdminRoutes = {
    list: ROUTES.STATE_ADMIN_STATE_UT_ADMINS,
    add: ROUTES.STATE_ADMIN_STATE_UT_ADMINS_ADD,
    view: (userId) => ROUTES.STATE_ADMIN_STATE_UT_ADMINS_VIEW.replace(':id', userId),
    edit: (userId) => ROUTES.STATE_ADMIN_STATE_UT_ADMINS_EDIT.replace(':id', userId),
  }

  const labels: UserAdminFormPageLabels = {
    addTitle: t('stateUtAdmins.addTitle'),
    editTitle: t('stateUtAdmins.editTitle'),
    breadcrumb: {
      manage: t('stateUtAdmins.breadcrumb.manage'),
      addNew: t('stateUtAdmins.breadcrumb.addNew'),
      edit: t('stateUtAdmins.breadcrumb.edit'),
    },
    form: {
      userDetails: t('stateUtAdmins.form.userDetails'),
      firstName: t('stateUtAdmins.form.firstName'),
      lastName: t('stateUtAdmins.form.lastName'),
      emailAddress: t('stateUtAdmins.form.emailAddress'),
      phoneNumber: t('stateUtAdmins.form.phoneNumber'),
      statusSection: t('stateUtAdmins.form.statusSection'),
      activated: t('stateUtAdmins.form.activated'),
    },
    messages: {
      notFound: t('stateUtAdmins.messages.notFound'),
      itemAdded: t('stateUtAdmins.messages.adminAdded'),
      failedToAdd: t('stateUtAdmins.messages.failedToAdd'),
      activatedSuccess: t('stateUtAdmins.messages.activatedSuccess'),
      deactivatedSuccess: t('stateUtAdmins.messages.deactivatedSuccess'),
      failedToUpdateStatus: t('stateUtAdmins.messages.failedToUpdateStatus'),
    },
    buttons: {
      addAndSendLink: t('stateUtAdmins.buttons.addAndSendLink'),
    },
  }

  return (
    <UserAdminFormPage
      id={id}
      isEditMode={isEditMode}
      original={adminQuery.data ?? null}
      isLoadingOriginal={adminQuery.isLoading}
      routes={routes}
      labels={labels}
      createMutation={neverCreate}
      updateMutation={updateMutation}
      statusMutation={statusMutation}
    />
  )
}
