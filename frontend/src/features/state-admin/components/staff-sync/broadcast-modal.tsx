import { useState } from 'react'
import { Button, Flex, FormControl, FormLabel, Text, VStack } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import {
  DateRangePicker,
  Dialog,
  MultiSearchableSelect,
  SearchableSelect,
  ToastContainer,
} from '@/shared/components/common'
import type { DateRange } from '@/shared/components/common'
import { useToast } from '@/shared/hooks/use-toast'
import { useBroadcastWelcomeMessageMutation } from '../../services/query/use-state-admin-queries'

interface BroadcastModalProps {
  isOpen: boolean
  onClose: () => void
}

const ROLE_OPTIONS = [
  { value: 'PUMP_OPERATOR', label: 'Pump Operator' },
  { value: 'SECTION_OFFICER', label: 'Section Officer' },
  { value: 'SUB_DIVISIONAL_OFFICER', label: 'Sub Divisional Officer' },
]

const TEMPLATE_OPTIONS = [{ value: 'welcome_template', label: 'Welcome Template' }]

export function BroadcastModal({ isOpen, onClose }: BroadcastModalProps) {
  const { t } = useTranslation('state-admin')
  const toast = useToast()
  const { mutate: broadcast, isPending } = useBroadcastWelcomeMessageMutation()

  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedDuration, setSelectedDuration] = useState<DateRange | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState('')

  const isSendEnabled =
    selectedRoles.length > 0 && selectedDuration !== null && selectedTemplate !== ''

  const handleClose = () => {
    setSelectedRoles([])
    setSelectedDuration(null)
    setSelectedTemplate('')
    onClose()
  }

  const handleSend = () => {
    if (!isSendEnabled || !selectedDuration) return

    broadcast(
      {
        roles: selectedRoles,
        type: selectedTemplate,
        onboardedAfter: selectedDuration.startDate,
        onboardedBefore: selectedDuration.endDate,
      },
      {
        onSuccess: () => {
          toast.success(t('staffSync.broadcast.messages.success'))
          handleClose()
        },
        onError: () => {
          toast.error(t('staffSync.broadcast.messages.error'))
        },
      }
    )
  }

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={handleClose}
        title={t('staffSync.broadcast.modal.title')}
        maxWidth="md"
      >
        <VStack spacing={5} align="stretch">
          {/* Select Role */}
          <FormControl>
            <FormLabel mb={1}>
              <Text fontSize="sm" fontWeight="500" color="neutral.700">
                {t('staffSync.broadcast.modal.selectRole')}
              </Text>
            </FormLabel>
            <MultiSearchableSelect
              options={ROLE_OPTIONS}
              value={selectedRoles}
              onChange={setSelectedRoles}
              placeholder={t('staffSync.broadcast.modal.selectRole')}
              width="100%"
              height="40px"
              borderRadius="6px"
              fontSize="sm"
              ariaLabel={t('staffSync.broadcast.modal.selectRole')}
              required
            />
          </FormControl>

          {/* Select Duration */}
          <FormControl>
            <FormLabel mb={1}>
              <Text fontSize="sm" fontWeight="500" color="neutral.700">
                {t('staffSync.broadcast.modal.selectDuration')}
              </Text>
            </FormLabel>
            <DateRangePicker
              value={selectedDuration}
              onChange={setSelectedDuration}
              placeholder={t('staffSync.broadcast.modal.selectDuration')}
              width="100%"
              height="40px"
              borderRadius="6px"
              fontSize="sm"
              textColor="neutral.700"
              borderColor="neutral.300"
              isFilter={false}
            />
          </FormControl>

          {/* Select Message Template */}
          <FormControl>
            <FormLabel mb={1}>
              <Text fontSize="sm" fontWeight="500" color="neutral.700">
                {t('staffSync.broadcast.modal.selectTemplate')}
              </Text>
            </FormLabel>
            <SearchableSelect
              options={TEMPLATE_OPTIONS}
              value={selectedTemplate}
              onChange={setSelectedTemplate}
              placeholder={t('staffSync.broadcast.modal.selectTemplate')}
              width="100%"
              height="40px"
              borderRadius="6px"
              fontSize="sm"
              ariaLabel={t('staffSync.broadcast.modal.selectTemplate')}
              required
            />
          </FormControl>

          {/* Actions */}
          <Flex justify="flex-end" gap={3} pt={2}>
            <Button variant="ghost" size="sm" onClick={handleClose} isDisabled={isPending}>
              {t('staffSync.broadcast.modal.cancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              isDisabled={!isSendEnabled}
              isLoading={isPending}
              onClick={handleSend}
            >
              {t('staffSync.broadcast.modal.send')}
            </Button>
          </Flex>
        </VStack>
      </Dialog>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </>
  )
}
