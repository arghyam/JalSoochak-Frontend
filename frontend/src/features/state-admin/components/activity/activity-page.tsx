import { useEffect } from 'react'
import { Box, Text, Heading } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { DataTable, type DataTableColumn, StatusChip } from '@/shared/components/common'
import type { ActivityLog } from '../../types/activity'
import { useStateAdminActivityQuery } from '../../services/query/use-state-admin-queries'

export function ActivityPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const { data: activities = [], isLoading, isError } = useStateAdminActivityQuery()

  useEffect(() => {
    document.title = `${t('activity.title')} | JalSoochak`
  }, [t])

  const formatTimestamp = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const year = date.getFullYear()

    let hours = date.getHours()
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'pm' : 'am'

    hours = hours % 12
    hours = hours ? hours : 12

    return `${day}-${month}-${year}, ${hours}:${minutes}${ampm}`
  }

  const columns: DataTableColumn<ActivityLog>[] = [
    {
      key: 'timestamp',
      header: t('activity.table.timestamp'),
      sortable: true,
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {formatTimestamp(row.timestamp)}
        </Text>
      ),
    },
    {
      key: 'action',
      header: t('activity.table.action'),
      sortable: false,
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.action}
        </Text>
      ),
    },
    {
      key: 'status',
      header: t('activity.table.status'),
      sortable: false,
      render: (row) => (
        <StatusChip
          status={row.status === 'Success' ? 'success' : 'failed'}
          label={row.status === 'Success' ? t('common:status.success') : t('common:status.failed')}
        />
      ),
    },
  ]

  if (isError) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={6}>
          {t('activity.title')}
        </Heading>
        <Text color="error.500">{t('activity.messages.failedToLoad')}</Text>
      </Box>
    )
  }

  return (
    <Box w="full">
      {/* Page Header */}
      <Box mb={5}>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
          {t('activity.title')}
        </Heading>
      </Box>

      {/* Activity Table */}
      <Box as="section" aria-label={t('activity.aria.tableSection')}>
        <DataTable
          columns={columns}
          data={activities}
          getRowKey={(row) => row.id}
          emptyMessage={t('activity.messages.noActivitiesFound')}
          isLoading={isLoading}
        />
      </Box>
    </Box>
  )
}
