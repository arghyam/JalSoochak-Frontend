import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  UserAdminListPage,
  type UserAdminRoutes,
  type UserAdminListLabels,
} from '@/shared/components/common'
import { ROUTES } from '@/shared/constants/routes'
import { useStateUTAdminsQuery } from '../../services/query/use-state-admin-queries'

export function StateUTAdminsPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const { data: admins = [], isLoading, isError, refetch } = useStateUTAdminsQuery()

  useEffect(() => {
    document.title = `${t('stateUtAdmins.title')} | JalSoochak`
  }, [t])

  const routes: UserAdminRoutes = {
    list: ROUTES.STATE_ADMIN_STATE_UT_ADMINS,
    add: ROUTES.STATE_ADMIN_STATE_UT_ADMINS_ADD,
    view: (id) => ROUTES.STATE_ADMIN_STATE_UT_ADMINS_VIEW.replace(':id', id),
    edit: (id) => ROUTES.STATE_ADMIN_STATE_UT_ADMINS_EDIT.replace(':id', id),
  }

  const labels: UserAdminListLabels = {
    pageTitle: t('stateUtAdmins.title'),
    addButton: t('stateUtAdmins.addAdmin'),
    allStatuses: t('stateUtAdmins.filters.allStatuses'),
    noItemsFound: t('stateUtAdmins.messages.noAdminsFound'),
    table: {
      name: t('stateUtAdmins.table.name'),
      mobileNumber: t('stateUtAdmins.table.mobileNumber'),
      emailAddress: t('stateUtAdmins.table.emailAddress'),
      status: t('stateUtAdmins.table.status'),
      actions: t('stateUtAdmins.table.actions'),
    },
    aria: {
      search: t('stateUtAdmins.aria.search'),
      view: t('stateUtAdmins.aria.view'),
      edit: t('stateUtAdmins.aria.edit'),
    },
  }

  return (
    <UserAdminListPage
      data={admins}
      isLoading={isLoading}
      isError={isError}
      onRefetch={() => void refetch()}
      routes={routes}
      labels={labels}
    />
  )
}
