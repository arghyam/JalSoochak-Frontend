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
import { useTranslation } from 'react-i18next'
import type { SupplyOutageReason } from '../../types/configuration'
import { isEmptyOrWhitespace } from '@/shared/utils/validation'

interface SupplyOutageReasonsSectionProps {
  title: string
  reasons: SupplyOutageReason[]
  onChange: (reasons: SupplyOutageReason[]) => void
  errors?: Record<string, string>
  onClearError?: (field: string) => void
}

export function SupplyOutageReasonsSection({
  title,
  reasons,
  onChange,
  errors,
  onClearError,
}: SupplyOutageReasonsSectionProps) {
  const { t } = useTranslation(['state-admin', 'common'])

  const handleChange = (id: string, value: string) => {
    onChange(reasons.map((r) => (r.id === id ? { ...r, name: value } : r)))
    onClearError?.(`supplyOutageReason.${id}`)
  }

  const handleDelete = (id: string) => {
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
      <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium" color="neutral.950" mb={3}>
        {title}
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mb={reasons.length > 0 ? 3 : 0}>
        {reasons.map((reason) => {
          const fieldError = errors?.[`supplyOutageReason.${reason.id}`]
          return (
            <FormControl key={reason.id} isInvalid={!!fieldError}>
              <Flex gap={2} align="center">
                <Input
                  value={reason.name}
                  onChange={(e) => handleChange(reason.id, e.target.value)}
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
                    h="36px"
                    minW="36px"
                    _hover={{ bg: 'error.50', color: 'error.500' }}
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
