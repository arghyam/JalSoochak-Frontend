import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  UserAdminListPage,
  type UserAdminRoutes,
  type UserAdminListLabels,
} from '@/shared/components/common'
import { ROUTES } from '@/shared/constants/routes'
import { useSuperUsersQuery } from '../../services/query/use-super-admin-queries'

export function SuperUsersPage() {
  const { t } = useTranslation(['super-admin', 'common'])
  const { data: users = [], isLoading, isError, refetch } = useSuperUsersQuery()

  useEffect(() => {
    document.title = `${t('superUsers.title')} | JalSoochak`
  }, [t])

  const routes: UserAdminRoutes = {
    list: ROUTES.SUPER_ADMIN_SUPER_USERS,
    add: ROUTES.SUPER_ADMIN_SUPER_USERS_ADD,
    view: (id) => ROUTES.SUPER_ADMIN_SUPER_USERS_VIEW.replace(':id', id),
    edit: (id) => ROUTES.SUPER_ADMIN_SUPER_USERS_EDIT.replace(':id', id),
  }

  const labels: UserAdminListLabels = {
    pageTitle: t('superUsers.title'),
    addButton: t('superUsers.addUser'),
    allStatuses: t('superUsers.filters.allStatuses'),
    noItemsFound: t('superUsers.messages.noUsersFound'),
    table: {
      name: t('superUsers.table.name'),
      mobileNumber: t('superUsers.table.mobileNumber'),
      emailAddress: t('superUsers.table.emailAddress'),
      status: t('superUsers.table.status'),
      actions: t('superUsers.table.actions'),
    },
    aria: {
      search: t('superUsers.aria.search'),
      view: t('superUsers.aria.view'),
      edit: t('superUsers.aria.edit'),
    },
  }

  return (
    <UserAdminListPage
      data={users}
      isLoading={isLoading}
      isError={isError}
      onRefetch={() => void refetch()}
      routes={routes}
      labels={labels}
    />
  )
}
