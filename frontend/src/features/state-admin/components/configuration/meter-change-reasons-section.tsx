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
import { ActionTooltip, RequiredIndicator, Toggle } from '@/shared/components/common'

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
}: Readonly<MeterChangeReasonsSectionProps>) {
  const { t } = useTranslation(['state-admin', 'common'])

  const othersEnabled = reasons.some((r) => r.id === 'OTHERS')

  const handleChange = (id: string, value: string) => {
    onChange(reasons.map((r) => (r.id === id ? { ...r, name: value } : r)))
    onClearError?.(`meterReason.${id}`)
  }

  const handleDelete = (id: string) => {
    const nonOthersCount = reasons.filter((r) => r.id !== 'OTHERS').length
    if (required && nonOthersCount === 1) return
    onChange(reasons.filter((r) => r.id !== id))
    onClearError?.(`meterReason.${id}`)
  }

  const handleAdd = () => {
    const nonOthersReasons = reasons.filter((r) => r.id !== 'OTHERS')
    if (nonOthersReasons.length > 0) {
      const lastNonOthers = nonOthersReasons.at(-1)
      if (lastNonOthers && isEmptyOrWhitespace(lastNonOthers.name)) return
    }
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const newReason: MeterChangeReason = { id, name: '' }
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
      onChange([...nonOthersReasons, { id: 'OTHERS', name: 'Others' }])
    }
  }

  return (
    <Box id="config-section-meter-change-reasons">
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
          const isOthers = reason.id === 'OTHERS'
          const fieldError = errors?.[`meterReason.${reason.id}`]
          return (
            <FormControl key={reason.id} isInvalid={!!fieldError}>
              <Flex gap={2} align="center">
                <Input
                  id={`config-field-meter-reason-${reason.id}`}
                  value={
                    isOthers
                      ? t('configuration.sections.meterChangeReasons.othersToggleLabel')
                      : reason.name
                  }
                  onChange={(e) => (isOthers ? undefined : handleChange(reason.id, e.target.value))}
                  isReadOnly={isOthers}
                  placeholder={t('configuration.sections.meterChangeReasons.placeholder')}
                  h="36px"
                  w={{ base: 'full', xl: '486px' }}
                  fontSize="sm"
                  borderColor="neutral.300"
                  borderRadius="6px"
                  _hover={{ borderColor: isOthers ? 'neutral.300' : 'neutral.400' }}
                  _focus={{
                    borderColor: isOthers ? 'neutral.300' : 'primary.500',
                    boxShadow: 'none',
                  }}
                  aria-label={t('configuration.sections.meterChangeReasons.editAriaLabel', {
                    name: reason.name || t('configuration.sections.meterChangeReasons.placeholder'),
                  })}
                />
                {!isOthers && (
                  <IconButton
                    aria-label={t('configuration.sections.meterChangeReasons.deleteAriaLabel', {
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
          {t('configuration.sections.meterChangeReasons.addNewButton')}
        </Button>
        <Flex align="center" gap={2}>
          <Text fontSize="sm" color="neutral.950">
            {t('configuration.sections.meterChangeReasons.othersToggleLabel')}
          </Text>
          <Toggle
            isChecked={othersEnabled}
            onChange={handleOthersToggle}
            aria-label={t('configuration.sections.meterChangeReasons.othersToggleLabel')}
          />
        </Flex>
      </Flex>
    </Box>
  )
}
