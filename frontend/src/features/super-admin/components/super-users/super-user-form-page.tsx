import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  UserAdminFormPage,
  type UserAdminRoutes,
  type UserAdminFormPageLabels,
  type UserAdminCreateMutation,
  type UserAdminUpdateMutation,
} from '@/shared/components/common'
import { ROUTES } from '@/shared/constants/routes'
import {
  useSuperUserByIdQuery,
  useUpdateUserMutation,
  useUpdateUserStatusMutation,
} from '../../services/query/use-super-admin-queries'

// Stub — add mode is handled by InviteSuperUserPage; this page is edit-only.
const neverCreate: UserAdminCreateMutation = {
  isPending: false,
  mutateAsync: () => Promise.reject(new Error('Use InviteSuperUserPage for add')),
}

export function SuperUserFormPage() {
  const { t } = useTranslation(['super-admin', 'common'])
  const { id } = useParams<{ id?: string }>()
  const isEditMode = Boolean(id)

  const userQuery = useSuperUserByIdQuery(id)
  const rawUpdateMutation = useUpdateUserMutation()
  const statusMutation = useUpdateUserStatusMutation()

  // Adapter: UserAdminFormPage calls { id, input: { firstName, lastName, phone } }
  // but useUpdateUserMutation takes { id, payload: { firstName?, lastName?, phoneNumber? } }
  const updateMutation: UserAdminUpdateMutation = {
    isPending: rawUpdateMutation.isPending,
    mutateAsync: ({ id: userId, input }) =>
      rawUpdateMutation.mutateAsync({
        id: userId,
        payload: {
          firstName: input.firstName,
          lastName: input.lastName,
          phoneNumber: input.phone,
        },
      }),
  }

  useEffect(() => {
    document.title = `${isEditMode ? t('superUsers.editTitle') : t('superUsers.addTitle')} | JalSoochak`
  }, [t, isEditMode])

  const routes: UserAdminRoutes = {
    list: ROUTES.SUPER_ADMIN_SUPER_USERS,
    add: ROUTES.SUPER_ADMIN_SUPER_USERS_ADD,
    view: (userId) => ROUTES.SUPER_ADMIN_SUPER_USERS_VIEW.replace(':id', userId),
    edit: (userId) => ROUTES.SUPER_ADMIN_SUPER_USERS_EDIT.replace(':id', userId),
  }

  const labels: UserAdminFormPageLabels = {
    addTitle: t('superUsers.addTitle'),
    editTitle: t('superUsers.editTitle'),
    breadcrumb: {
      manage: t('superUsers.breadcrumb.manage'),
      addNew: t('superUsers.breadcrumb.addNew'),
      edit: t('superUsers.breadcrumb.edit'),
    },
    form: {
      userDetails: t('superUsers.form.userDetails'),
      firstName: t('superUsers.form.firstName'),
      lastName: t('superUsers.form.lastName'),
      emailAddress: t('superUsers.form.emailAddress'),
      phoneNumber: t('superUsers.form.phoneNumber'),
      statusSection: t('superUsers.form.statusSection'),
      activated: t('superUsers.form.activated'),
    },
    messages: {
      notFound: t('superUsers.messages.notFound'),
      itemAdded: t('superUsers.messages.userAdded'),
      failedToAdd: t('superUsers.messages.failedToAdd'),
      activatedSuccess: t('superUsers.messages.activatedSuccess'),
      deactivatedSuccess: t('superUsers.messages.deactivatedSuccess'),
      failedToUpdateStatus: t('superUsers.messages.failedToUpdateStatus'),
    },
    buttons: {
      addAndSendLink: t('superUsers.buttons.addAndSendLink'),
    },
  }

  return (
    <UserAdminFormPage
      id={id}
      isEditMode={isEditMode}
      original={userQuery.data ?? null}
      isLoadingOriginal={userQuery.isLoading}
      routes={routes}
      labels={labels}
      createMutation={neverCreate}
      updateMutation={updateMutation}
      statusMutation={statusMutation}
    />
  )
}
