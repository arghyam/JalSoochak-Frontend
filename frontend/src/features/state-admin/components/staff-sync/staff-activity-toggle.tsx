import { useState } from 'react'
import { Box } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { ActionTooltip, Toggle } from '@/shared/components/common'
import type { StaffStatus } from '../../types/staff-sync'
import { useUpdateStaffStatusMutation } from '../../services/query/use-state-admin-queries'

interface StaffActivityToggleProps {
  staffId: number
  status: StaffStatus
  tenantCode: string
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export function StaffActivityToggle({
  staffId,
  status,
  tenantCode,
  onSuccess,
  onError,
}: StaffActivityToggleProps) {
  const { t } = useTranslation(['state-admin', 'common'])
  const statusMutation = useUpdateStaffStatusMutation()
  const [isToggling, setIsToggling] = useState(false)

  const isActive = status === 'ACTIVE'
  const tooltip = isActive ? t('staffSync.aria.deactivate') : t('staffSync.aria.activate')
  const isDisabled = isToggling || statusMutation.isPending || !tenantCode

  const handleToggle = async () => {
    if (isDisabled) return
    const newStatus: StaffStatus = isActive ? 'INACTIVE' : 'ACTIVE'
    setIsToggling(true)
    try {
      await statusMutation.mutateAsync({ id: staffId, status: newStatus, tenantCode })
      onSuccess(
        newStatus === 'ACTIVE'
          ? t('staffSync.messages.activatedSuccess')
          : t('staffSync.messages.deactivatedSuccess')
      )
    } catch {
      onError(t('staffSync.messages.failedToUpdateStatus'))
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <ActionTooltip label={tooltip}>
      <Box as="span" display="inline-flex">
        <Toggle
          isChecked={isActive}
          onChange={() => void handleToggle()}
          isDisabled={isDisabled}
          aria-label={tooltip}
        />
      </Box>
    </ActionTooltip>
  )
}
