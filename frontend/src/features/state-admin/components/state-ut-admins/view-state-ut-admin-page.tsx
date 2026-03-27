import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  UserAdminViewPage,
  type UserAdminRoutes,
  type UserAdminViewLabels,
} from '@/shared/components/common'
import { ROUTES } from '@/shared/constants/routes'
import { useStateUTAdminByIdQuery } from '../../services/query/use-state-admin-queries'

export function ViewStateUTAdminPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const { id } = useParams<{ id: string }>()
  const adminQuery = useStateUTAdminByIdQuery(id)

  useEffect(() => {
    document.title = `${t('stateUtAdmins.viewTitle')} | JalSoochak`
  }, [t])

  const routes: UserAdminRoutes = {
    list: ROUTES.STATE_ADMIN_STATE_UT_ADMINS,
    add: ROUTES.STATE_ADMIN_STATE_UT_ADMINS_ADD,
    view: (userId) => ROUTES.STATE_ADMIN_STATE_UT_ADMINS_VIEW.replace(':id', userId),
    edit: (userId) => ROUTES.STATE_ADMIN_STATE_UT_ADMINS_EDIT.replace(':id', userId),
  }

  const labels: UserAdminViewLabels = {
    pageTitle: t('stateUtAdmins.title'),
    viewTitle: t('stateUtAdmins.viewTitle'),
    breadcrumb: {
      manage: t('stateUtAdmins.breadcrumb.manage'),
      view: t('stateUtAdmins.breadcrumb.view'),
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
    },
    aria: {
      edit: t('stateUtAdmins.aria.edit'),
    },
  }

  return (
    <UserAdminViewPage
      id={id}
      data={adminQuery.data ?? null}
      isLoading={adminQuery.isLoading}
      isError={adminQuery.isError}
      error={adminQuery.error instanceof Error ? adminQuery.error : null}
      onRefetch={() => adminQuery.refetch()}
      routes={routes}
      labels={labels}
    />
  )
}
