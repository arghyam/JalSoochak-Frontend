import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  UserAdminListPage,
  ToastContainer,
  type UserAdminRoutes,
  type UserAdminListLabels,
} from '@/shared/components/common'
import { useToast } from '@/shared/hooks/use-toast'
import { ROUTES } from '@/shared/constants/routes'
import {
  useSuperUsersQuery,
  useReinviteSuperUserMutation,
} from '../../services/query/use-super-admin-queries'

export function SuperUsersPage() {
  const { t } = useTranslation(['super-admin', 'common'])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { data, isLoading, isError, refetch } = useSuperUsersQuery(page, pageSize)
  const reinviteMutation = useReinviteSuperUserMutation()
  const toast = useToast()

  useEffect(() => {
    document.title = `${t('superUsers.title')} | JalSoochak`
  }, [t])

  const handleReinvite = (id: string) => {
    if (reinviteMutation.isPending) return
    reinviteMutation.mutate(id, {
      onSuccess: () => toast.success(t('common:toast.reinviteSent')),
      onError: () => toast.error(t('common:toast.reinviteFailed')),
    })
  }

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
      resendInvite: t('superUsers.aria.resendInvite'),
    },
  }

  return (
    <>
      <UserAdminListPage
        data={data?.items ?? []}
        isLoading={isLoading}
        isError={isError}
        onRefetch={() => void refetch()}
        routes={routes}
        labels={labels}
        onReinvite={handleReinvite}
        page={page}
        pageSize={pageSize}
        totalItems={data?.total}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
      />
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </>
  )
}
