import { Box, Text, Input, SimpleGrid, Flex, IconButton, Button } from '@chakra-ui/react'
import { MdDeleteOutline } from 'react-icons/md'
import { useTranslation } from 'react-i18next'
import type { MeterChangeReason } from '../../types/configuration'

interface MeterChangeReasonsSectionProps {
  title: string
  reasons: MeterChangeReason[]
  onChange: (reasons: MeterChangeReason[]) => void
}

export function MeterChangeReasonsSection({
  title,
  reasons,
  onChange,
}: MeterChangeReasonsSectionProps) {
  const { t } = useTranslation(['state-admin', 'common'])

  const handleChange = (id: string, value: string) => {
    onChange(reasons.map((r) => (r.id === id ? { ...r, name: value } : r)))
  }

  const handleDelete = (id: string) => {
    onChange(reasons.filter((r) => r.id !== id))
  }

  const handleAdd = () => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    onChange([...reasons, { id, name: '' }])
  }

  return (
    <Box>
      <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium" color="neutral.950" mb={3}>
        {title}
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mb={reasons.length > 0 ? 3 : 0}>
        {reasons.map((reason) => (
          <Flex key={reason.id} gap={2} align="center">
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
              h="36px"
              minW="36px"
              _hover={{ bg: 'error.50', color: 'error.500' }}
            />
          </Flex>
        ))}
      </SimpleGrid>

      <Button variant="secondary" size="sm" onClick={handleAdd} w={{ base: 'full', sm: 'auto' }}>
        {t('configuration.sections.meterChangeReasons.addNewButton')}
      </Button>
    </Box>
  )
}
