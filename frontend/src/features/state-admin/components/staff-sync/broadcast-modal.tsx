import { useState } from 'react'
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  SimpleGrid,
  Text,
} from '@chakra-ui/react'
import { FiX } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import {
  DateRangePicker,
  MultiSelect,
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
    if (isPending) return
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
      <Modal isOpen={isOpen} onClose={handleClose} isCentered>
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent maxW="640px" borderRadius="12px" p={6}>
          <ModalBody p={0}>
            {/* Header */}
            <Flex justify="space-between" align="center" mb={5}>
              <Text textStyle="h6" fontWeight="600">
                {t('staffSync.broadcast.modal.title')}
              </Text>
              <Button
                variant="ghost"
                size="sm"
                p={1}
                minW="auto"
                h="auto"
                onClick={handleClose}
                aria-label={t('staffSync.broadcast.modal.close')}
                isDisabled={isPending}
              >
                <FiX size={18} />
              </Button>
            </Flex>

            {/* Fields — 2-column grid */}
            <SimpleGrid columns={2} spacing={4} mb={2}>
              {/* Select Role */}
              <FormControl>
                <FormLabel mb={1.5}>
                  <Text textStyle="h10" fontWeight="500" color="neutral.700">
                    {t('staffSync.broadcast.modal.selectRole')}
                  </Text>
                </FormLabel>
                <MultiSelect
                  options={ROLE_OPTIONS}
                  value={selectedRoles}
                  onChange={setSelectedRoles}
                  placeholder={t('staffSync.broadcast.modal.selectRole')}
                  width="100%"
                  height="40px"
                  borderRadius="6px"
                  fontSize="sm"
                  ariaLabel={t('staffSync.broadcast.modal.selectRole')}
                />
              </FormControl>

              {/* Select Duration */}
              <FormControl>
                <FormLabel mb={1.5}>
                  <Text textStyle="h10" fontWeight="500" color="neutral.700">
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
                  textColor="neutral.500"
                  borderColor="neutral.300"
                  isFilter={false}
                />
              </FormControl>

              {/* Select Message Template — spans full width */}
              <FormControl gridColumn="span 1">
                <FormLabel mb={1.5}>
                  <Text textStyle="h10" fontWeight="500" color="neutral.700">
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
                />
              </FormControl>
            </SimpleGrid>

            {/* Footer */}
            <Flex gap={3} mt={6} justify="flex-end">
              <Button variant="secondary" size="sm" onClick={handleClose} isDisabled={isPending}>
                {t('staffSync.broadcast.modal.cancel')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isPending}
                isDisabled={!isSendEnabled}
                onClick={handleSend}
              >
                {t('staffSync.broadcast.modal.send')}
              </Button>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </>
  )
}
