import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  UserAdminListPage,
  ToastContainer,
  type UserAdminRoutes,
  type UserAdminListLabels,
} from '@/shared/components/common'
import { useToast } from '@/shared/hooks/use-toast'
import { useDebounce } from '@/shared/hooks/use-debounce'
import { ROUTES } from '@/shared/constants/routes'
import {
  useStateUTAdminsQuery,
  useReinviteStateUTAdminMutation,
} from '../../services/query/use-state-admin-queries'

type StatusFilter = 'all' | 'active' | 'inactive' | 'pending'

const STATUS_TO_API: Record<StatusFilter, string> = {
  all: 'all',
  active: 'ACTIVE',
  inactive: 'INACTIVE',
  pending: 'PENDING',
}

export function StateUTAdminsPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const debouncedSearch = useDebounce(searchQuery, 400)

  const apiStatus = STATUS_TO_API[statusFilter]
  const { data, isLoading, isError, refetch } = useStateUTAdminsQuery(
    page,
    pageSize,
    debouncedSearch,
    apiStatus
  )
  const reinviteMutation = useReinviteStateUTAdminMutation()
  const toast = useToast()

  useEffect(() => {
    document.title = `${t('stateUtAdmins.title')} | JalSoochak`
  }, [t])

  const handleReinvite = (id: string) => {
    reinviteMutation.mutate(id, {
      onSuccess: () => toast.success(t('common:toast.reinviteSent')),
      onError: () => toast.error(t('common:toast.reinviteFailed')),
    })
  }

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
      resendInvite: t('stateUtAdmins.aria.resendInvite'),
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
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val)
          setPage(1)
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => {
          setStatusFilter(val)
          setPage(1)
        }}
      />
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </>
  )
}
