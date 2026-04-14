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
import { ActionTooltip, RequiredIndicator } from '@/shared/components/common'

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
}: SupplyOutageReasonsSectionProps) {
  const { t } = useTranslation(['state-admin', 'common'])

  const handleChange = (id: string, value: string) => {
    const reason = reasons.find((r) => r.id === id)
    if (!reason?.editable) return
    onChange(reasons.map((r) => (r.id === id ? { ...r, name: value } : r)))
    onClearError?.(`supplyOutageReason.${id}`)
  }

  const handleDelete = (id: string) => {
    const reason = reasons.find((r) => r.id === id)
    if (!reason?.editable) return
    // Prevent deletion of the last item if the field is required
    if (required && reasons.length === 1) {
      return
    }
    onChange(reasons.filter((r) => r.id !== id))
    onClearError?.(`supplyOutageReason.${id}`)
  }

  const handleAdd = () => {
    if (reasons.length > 0) {
      const lastReason = reasons[reasons.length - 1]
      if (isEmptyOrWhitespace(lastReason.name)) {
        return
      }
    }
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    onChange([...reasons, { id, name: '', isDefault: false, editable: true }])
  }

  return (
    <Box>
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
                  _hover={{ borderColor: 'neutral.400' }}
                  _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
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
                    isDisabled={required && reasons.length === 1}
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

      <Button variant="secondary" size="sm" onClick={handleAdd} w={{ base: 'full', sm: 'auto' }}>
        {t('configuration.sections.supplyOutageReasons.addNewButton')}
      </Button>
    </Box>
  )
}
