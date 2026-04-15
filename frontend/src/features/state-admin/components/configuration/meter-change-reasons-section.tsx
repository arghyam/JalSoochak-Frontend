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
import type { MeterChangeReason } from '../../types/configuration'
import { isEmptyOrWhitespace } from '@/shared/utils/validation'
import { ActionTooltip, RequiredIndicator } from '@/shared/components/common'

interface MeterChangeReasonsSectionProps {
  title: string
  infoTooltip?: string
  required?: boolean
  reasons: MeterChangeReason[]
  onChange: (reasons: MeterChangeReason[]) => void
  errors?: Record<string, string>
  onClearError?: (field: string) => void
}

export function MeterChangeReasonsSection({
  title,
  infoTooltip,
  required,
  reasons,
  onChange,
  errors,
  onClearError,
}: MeterChangeReasonsSectionProps) {
  const { t } = useTranslation(['state-admin', 'common'])

  const handleChange = (id: string, value: string) => {
    onChange(reasons.map((r) => (r.id === id ? { ...r, name: value } : r)))
    onClearError?.(`meterReason.${id}`)
  }

  const handleDelete = (id: string) => {
    // Prevent deletion of the last item if the field is required
    if (required && reasons.length === 1) {
      return
    }
    onChange(reasons.filter((r) => r.id !== id))
    onClearError?.(`meterReason.${id}`)
  }

  const handleAdd = () => {
    // Block adding if the last reason is empty
    if (reasons.length > 0) {
      const lastReason = reasons[reasons.length - 1]
      if (isEmptyOrWhitespace(lastReason.name)) {
        return
      }
    }
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    onChange([...reasons, { id, name: '' }])
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
          const fieldError = errors?.[`meterReason.${reason.id}`]
          return (
            <FormControl key={reason.id} isInvalid={!!fieldError}>
              <Flex gap={2} align="center">
                <Input
                  value={reason.name}
                  onChange={(e) => handleChange(reason.id, e.target.value)}
                  placeholder={t('configuration.sections.meterChangeReasons.placeholder')}
                  h="36px"
                  w={{ base: 'full', xl: '486px' }}
                  fontSize="sm"
                  borderColor="neutral.300"
                  borderRadius="6px"
                  _hover={{ borderColor: 'neutral.400' }}
                  _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
                  aria-label={t('configuration.sections.meterChangeReasons.editAriaLabel', {
                    name: reason.name || t('configuration.sections.meterChangeReasons.placeholder'),
                  })}
                />
                <IconButton
                  aria-label={t('configuration.sections.meterChangeReasons.deleteAriaLabel', {
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
              </Flex>
              {fieldError && <FormErrorMessage>{fieldError}</FormErrorMessage>}
            </FormControl>
          )
        })}
      </SimpleGrid>

      <Button variant="secondary" size="sm" onClick={handleAdd} w={{ base: 'full', sm: 'auto' }}>
        {t('configuration.sections.meterChangeReasons.addNewButton')}
      </Button>
    </Box>
  )
}
