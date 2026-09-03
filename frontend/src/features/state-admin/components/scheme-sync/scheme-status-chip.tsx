import { useEffect, useMemo, useState } from 'react'
import { Badge, Box, Flex, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { useTranslation } from 'react-i18next'
import { ToastContainer } from '@/shared/components/common'
import { useToast } from '@/shared/hooks/use-toast'
import { useUpdateSchemeStatusMutation } from '../../services/query/use-state-admin-queries'
import type { UpdateSchemeStatusPayload } from '../../types/scheme-sync'
import {
  findSchemeStatusByLabel,
  getSchemeStatusColors,
  getSchemeStatusOptions,
  resolveSchemeStatusLabel,
} from '@/shared/constants/scheme-status'
import type { SchemeStatusDimension } from '@/shared/constants/scheme-status'

interface SchemeStatusChipProps {
  schemeId: number
  statusType: SchemeStatusDimension
  currentValue: string
  tenantCode: string
}

export function SchemeStatusChip({
  schemeId,
  statusType,
  currentValue,
  tenantCode,
}: SchemeStatusChipProps) {
  const { t } = useTranslation('state-admin')
  const toast = useToast()
  const { mutate, isPending } = useUpdateSchemeStatusMutation()
  const [optimisticValue, setOptimisticValue] = useState(currentValue)

  useEffect(() => {
    setOptimisticValue(currentValue)
  }, [currentValue])

  const options = useMemo(() => getSchemeStatusOptions(t, statusType), [t, statusType])
  const statusLabel = t(`schemeSync.table.${statusType}`)
  // Rows carry only a label string, so the code — which drives colour and translation — comes from
  // the reverse map. An unrecognised label resolves to undefined and degrades to neutral + raw text.
  const currentDescriptor = findSchemeStatusByLabel(statusType, optimisticValue)
  const { bg, color } = getSchemeStatusColors(statusType, currentDescriptor?.code)
  const chipLabel = resolveSchemeStatusLabel(t, statusType, {
    code: currentDescriptor?.code,
    label: optimisticValue,
  })

  /** `newValue` is always a canonical English label — see the menu's onClick. */
  const handleSelect = (newValue: string, newCode: number) => {
    // Compare by code, so a casing or spacing variant from the server is not mistaken for a change.
    if (isPending || currentDescriptor?.code === newCode) return
    const prevValue = optimisticValue
    setOptimisticValue(newValue)
    const payload: UpdateSchemeStatusPayload =
      statusType === 'workStatus' ? { workStatus: newValue } : { operatingStatus: newValue }
    mutate(
      { schemeId, tenantCode, payload },
      {
        onSuccess: () => {
          toast.success(t('schemeSync.messages.statusUpdateSuccess'))
        },
        onError: () => {
          setOptimisticValue(prevValue)
          toast.error(t('schemeSync.messages.statusUpdateFailed'))
        },
      }
    )
  }

  return (
    <>
      <Menu isLazy placement="bottom-start">
        <MenuButton
          as={Box}
          display="inline-flex"
          cursor={isPending ? 'wait' : 'pointer'}
          opacity={isPending ? 0.6 : 1}
          aria-label={t('schemeSync.aria.changeStatus', { status: statusLabel })}
          data-testid={`status-chip-${statusType}-${schemeId}`}
          _focusVisible={{
            outline: '2px solid',
            outlineColor: 'primary.500',
            borderRadius: '16px',
          }}
        >
          <Badge
            bg={bg}
            color={color}
            px={2}
            py={0.5}
            borderRadius="16px"
            fontSize="12px"
            fontWeight="500"
            textTransform="none"
            h={6}
            display="inline-flex"
            alignItems="center"
            gap={1}
            _hover={{ opacity: 0.85 }}
            transition="opacity 0.15s"
          >
            {chipLabel}
            <ChevronDownIcon boxSize={3} flexShrink={0} />
          </Badge>
        </MenuButton>

        <MenuList
          minW="160px"
          py={1}
          borderColor="neutral.100"
          boxShadow="0px 4px 6px -2px rgba(10, 13, 18, 0.06), 0px 2px 4px -2px rgba(10, 13, 18, 0.04)"
          borderRadius="8px"
          zIndex={10}
        >
          {options.map((option) => {
            const { bg: optBg, color: optColor } = getSchemeStatusColors(statusType, option.code)
            // Compare by code so casing or spacing variants from the server still highlight.
            const isSelected = currentDescriptor?.code === option.code
            return (
              <MenuItem
                key={option.code}
                // Always PATCH the canonical English label, never the translated one.
                onClick={() => handleSelect(option.value, option.code)}
                bg={isSelected ? 'primary.50' : 'white'}
                _hover={{ bg: 'neutral.50' }}
                _focus={{ bg: 'neutral.50' }}
                px={3}
                py={2}
              >
                <Flex align="center" gap={2}>
                  <Badge
                    bg={optBg}
                    color={optColor}
                    px={2}
                    py={0.5}
                    borderRadius="16px"
                    fontSize="12px"
                    fontWeight="500"
                    textTransform="none"
                    h={6}
                    display="inline-flex"
                    alignItems="center"
                  >
                    {option.label}
                  </Badge>
                </Flex>
              </MenuItem>
            )
          })}
        </MenuList>
      </Menu>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </>
  )
}
