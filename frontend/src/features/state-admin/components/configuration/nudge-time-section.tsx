import { Flex, FormControl, FormErrorMessage, Text } from '@chakra-ui/react'
import { TimePicker, RequiredIndicator } from '@/shared/components/common'
import { FieldInfoIcon } from './configuration-view-mode'

interface NudgeTimeSectionProps {
  title: string
  infoTooltip: string
  required: boolean
  value: string
  fieldId: string
  errorKey: string
  error: string | undefined
  onChange: (value: string) => void
  onClearError: (key: string) => void
}

export function NudgeTimeSection({
  title,
  infoTooltip,
  required,
  value,
  fieldId,
  errorKey,
  error,
  onChange,
  onClearError,
}: NudgeTimeSectionProps) {
  return (
    <FormControl isInvalid={!!error}>
      <Flex align="center" gap={1} mb={1}>
        <Text
          as="label"
          htmlFor={fieldId}
          fontSize={{ base: 'xs', md: 'sm' }}
          fontWeight="medium"
          color="neutral.950"
          display="block"
        >
          {title}
          <RequiredIndicator required={required} />
        </Text>
        <FieldInfoIcon tooltip={infoTooltip} />
      </Flex>
      <TimePicker
        id={fieldId}
        value={value}
        onChange={(val) => {
          onChange(val)
          onClearError(errorKey)
        }}
        isInvalid={!!error}
        w={{ base: 'full', xl: '486px' }}
      />
      <FormErrorMessage>{error}</FormErrorMessage>
    </FormControl>
  )
}
