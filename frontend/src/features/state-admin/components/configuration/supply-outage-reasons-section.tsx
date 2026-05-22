import {
  Box,
  Text,
  Input,
  SimpleGrid,
  Flex,
  IconButton,
  Button,
  FormControl,
  FormErrorMessage,
} from '@chakra-ui/react'
import { MdDeleteOutline } from 'react-icons/md'
import { AiOutlineInfoCircle } from 'react-icons/ai'
import { useTranslation } from 'react-i18next'
import type { SupplyOutageReason } from '../../types/configuration'
import { isEmptyOrWhitespace } from '@/shared/utils/validation'
import { ActionTooltip, RequiredIndicator, Toggle } from '@/shared/components/common'

interface SupplyOutageReasonsSectionProps {
  title: string
  infoTooltip?: string
  required?: boolean
  reasons: SupplyOutageReason[]
  onChange: (reasons: SupplyOutageReason[]) => void
  errors?: Record<string, string>
  onClearError?: (field: string) => void
}

export function SupplyOutageReasonsSection({
  title,
  infoTooltip,
  required,
  reasons,
  onChange,
  errors,
  onClearError,
}: Readonly<SupplyOutageReasonsSectionProps>) {
  const { t } = useTranslation(['state-admin', 'common'])

  const othersEnabled = reasons.some((r) => r.id === 'OTHERS')

  const handleChange = (id: string, value: string) => {
    const reason = reasons.find((r) => r.id === id)
    if (!reason?.editable) return
    onChange(reasons.map((r) => (r.id === id ? { ...r, name: value } : r)))
    onClearError?.(`supplyOutageReason.${id}`)
  }

  const handleDelete = (id: string) => {
    const reason = reasons.find((r) => r.id === id)
    if (!reason?.editable) return
    const nonOthersCount = reasons.filter((r) => r.id !== 'OTHERS').length
    if (required && nonOthersCount === 1) return
    onChange(reasons.filter((r) => r.id !== id))
    onClearError?.(`supplyOutageReason.${id}`)
  }

  const handleAdd = () => {
    const nonOthersReasons = reasons.filter((r) => r.id !== 'OTHERS')
    if (nonOthersReasons.length > 0) {
      const lastNonOthers = nonOthersReasons.at(-1)
      if (lastNonOthers && isEmptyOrWhitespace(lastNonOthers.name)) return
    }
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const newReason: SupplyOutageReason = { id, name: '', isDefault: false, editable: true }
    const othersReason = reasons.find((r) => r.id === 'OTHERS')
    if (othersReason) {
      onChange([...nonOthersReasons, newReason, othersReason])
    } else {
      onChange([...reasons, newReason])
    }
  }

  const handleOthersToggle = () => {
    if (othersEnabled) {
      onChange(reasons.filter((r) => r.id !== 'OTHERS'))
    } else {
      const nonOthersReasons = reasons.filter((r) => r.id !== 'OTHERS')
      onChange([
        ...nonOthersReasons,
        { id: 'OTHERS', name: 'Others', isDefault: true, editable: false },
      ])
    }
  }

  return (
    <Box id="config-section-supply-outage-reasons">
      <Flex align="center" gap={1} mb={3}>
        <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium" color="neutral.950">
          {title}
          <RequiredIndicator required={required} />
        </Text>
        {infoTooltip && (
          <ActionTooltip label={infoTooltip}>
            <Flex
              as="span"
              align="center"
              color="neutral.400"
              cursor="default"
              _hover={{ color: 'primary.500' }}
            >
              <AiOutlineInfoCircle size={16} aria-label={infoTooltip} />
            </Flex>
          </ActionTooltip>
        )}
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mb={reasons.length > 0 ? 3 : 0}>
        {reasons.map((reason) => {
          const fieldError = errors?.[`supplyOutageReason.${reason.id}`]
          return (
            <FormControl key={reason.id} isInvalid={!!fieldError}>
              <Flex gap={2} align="center">
                <Input
                  id={`config-field-supply-outage-${reason.id}`}
                  value={reason.name}
                  onChange={(e) =>
                    reason.editable ? handleChange(reason.id, e.target.value) : undefined
                  }
                  isReadOnly={!reason.editable}
                  placeholder={t('configuration.sections.supplyOutageReasons.placeholder')}
                  h="36px"
                  w={{ base: 'full', xl: '486px' }}
                  fontSize="sm"
                  borderColor="neutral.300"
                  borderRadius="6px"
                  _hover={{ borderColor: reason.editable ? 'neutral.400' : 'neutral.300' }}
                  _focus={{
                    borderColor: reason.editable ? 'primary.500' : 'neutral.300',
                    boxShadow: 'none',
                  }}
                  aria-label={t('configuration.sections.supplyOutageReasons.editAriaLabel', {
                    name:
                      reason.name || t('configuration.sections.supplyOutageReasons.placeholder'),
                  })}
                />
                {reason.editable && (
                  <IconButton
                    aria-label={t('configuration.sections.supplyOutageReasons.deleteAriaLabel', {
                      name: reason.name || '',
                    })}
                    icon={<MdDeleteOutline size={20} aria-hidden="true" />}
                    variant="ghost"
                    size="sm"
                    color="neutral.400"
                    onClick={() => handleDelete(reason.id)}
                    isDisabled={required && reasons.filter((r) => r.id !== 'OTHERS').length === 1}
                    h="36px"
                    minW="36px"
                    _hover={{ bg: 'error.50', color: 'error.500' }}
                    _disabled={{ opacity: 0.4, cursor: 'not-allowed' }}
                  />
                )}
              </Flex>
              {fieldError && <FormErrorMessage>{fieldError}</FormErrorMessage>}
            </FormControl>
          )
        })}
      </SimpleGrid>

      <Flex align="center" gap={4} flexWrap="wrap">
        <Button variant="secondary" size="sm" onClick={handleAdd} w={{ base: 'full', sm: 'auto' }}>
          {t('configuration.sections.supplyOutageReasons.addNewButton')}
        </Button>
        <Flex align="center" gap={2}>
          <Text fontSize="sm" color="neutral.950">
            {t('configuration.sections.supplyOutageReasons.othersToggleLabel')}
          </Text>
          <Toggle
            isChecked={othersEnabled}
            onChange={handleOthersToggle}
            aria-label={t('configuration.sections.supplyOutageReasons.othersToggleLabel')}
          />
        </Flex>
      </Flex>
    </Box>
  )
}
