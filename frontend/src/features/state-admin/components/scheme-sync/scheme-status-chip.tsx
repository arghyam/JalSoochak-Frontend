import { useEffect, useState } from 'react'
import { Badge, Box, Flex, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { useTranslation } from 'react-i18next'
import { ToastContainer } from '@/shared/components/common'
import { useToast } from '@/shared/hooks/use-toast'
import { useUpdateSchemeStatusMutation } from '../../services/query/use-state-admin-queries'
import type { UpdateSchemeStatusPayload } from '../../types/scheme-sync'
import {
  WORK_STATUS_OPTIONS,
  OPERATING_STATUS_OPTIONS,
  getSchemeStatusColors,
} from './scheme-status-constants'

interface SchemeStatusChipProps {
  schemeId: number
  statusType: 'workStatus' | 'operatingStatus'
  currentValue: string
  tenantCode: string
}

const OPTIONS_MAP = {
  workStatus: WORK_STATUS_OPTIONS,
  operatingStatus: OPERATING_STATUS_OPTIONS,
} as const

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

  const options = OPTIONS_MAP[statusType]
  const { bg, color } = getSchemeStatusColors(optimisticValue)

  const handleSelect = (newValue: string) => {
    if (newValue === optimisticValue || isPending) return
    const prevValue = optimisticValue
    setOptimisticValue(newValue)
    const payload: UpdateSchemeStatusPayload =
      statusType === 'workStatus' ? { workStatus: newValue } : { operatingStatus: newValue }
    mutate(
      { schemeId, tenantCode, payload },
      {
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
          aria-label={t('schemeSync.aria.changeStatus', { statusType })}
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
            {optimisticValue}
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
            const { bg: optBg, color: optColor } = getSchemeStatusColors(option)
            const isSelected = option === optimisticValue
            return (
              <MenuItem
                key={option}
                onClick={() => handleSelect(option)}
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
                    {option}
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
