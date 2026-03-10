import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  UserAdminFormPage,
  type UserAdminRoutes,
  type UserAdminFormPageLabels,
} from '@/shared/components/common'
import { ROUTES } from '@/shared/constants/routes'
import {
  useSuperUserByIdQuery,
  useCreateSuperUserMutation,
  useUpdateSuperUserMutation,
  useUpdateSuperUserStatusMutation,
} from '../../services/query/use-super-admin-queries'

export function SuperUserFormPage() {
  const { t } = useTranslation(['super-admin', 'common'])
  const { id } = useParams<{ id?: string }>()
  const isEditMode = Boolean(id)

  const userQuery = useSuperUserByIdQuery(id)
  const createMutation = useCreateSuperUserMutation()
  const updateMutation = useUpdateSuperUserMutation()
  const statusMutation = useUpdateSuperUserStatusMutation()

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
      createMutation={createMutation}
      updateMutation={updateMutation}
      statusMutation={statusMutation}
    />
  )
}
