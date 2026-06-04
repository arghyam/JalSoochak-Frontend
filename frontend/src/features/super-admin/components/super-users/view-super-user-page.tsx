import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  UserAdminViewPage,
  type UserAdminRoutes,
  type UserAdminViewLabels,
} from '@/shared/components/common'
import { ROUTES } from '@/shared/constants/routes'
import { useSuperUserByIdQuery } from '../../services/query/use-super-admin-queries'

export function ViewSuperUserPage() {
  const { t } = useTranslation(['super-admin', 'common'])
  const { id } = useParams<{ id: string }>()
  const userQuery = useSuperUserByIdQuery(id)

  useEffect(() => {
    document.title = `${t('superUsers.viewTitle')} | JalSoochak`
  }, [t])

  const routes: UserAdminRoutes = {
    list: ROUTES.SUPER_ADMIN_SUPER_USERS,
    add: ROUTES.SUPER_ADMIN_SUPER_USERS_ADD,
    view: (userId) => ROUTES.SUPER_ADMIN_SUPER_USERS_VIEW.replace(':id', userId),
    edit: (userId) => ROUTES.SUPER_ADMIN_SUPER_USERS_EDIT.replace(':id', userId),
  }

  const labels: UserAdminViewLabels = {
    pageTitle: t('superUsers.title'),
    viewTitle: t('superUsers.viewTitle'),
    breadcrumb: {
      manage: t('superUsers.breadcrumb.manage'),
      view: t('superUsers.breadcrumb.view'),
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
    },
    aria: {
      edit: t('superUsers.aria.edit'),
    },
  }

  return (
    <UserAdminViewPage
      id={id}
      data={userQuery.data ?? null}
      isLoading={userQuery.isLoading}
      isError={userQuery.isError}
      error={userQuery.error instanceof Error ? userQuery.error : null}
      onRefetch={() => userQuery.refetch()}
      routes={routes}
      labels={labels}
    />
  )
}
