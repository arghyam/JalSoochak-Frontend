import {
  Box,
  Heading,
  Text,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react'

export interface MetricNumberCardProps {
  title: string
  description: string
  value: string
  onChange: (valueString: string) => void
  placeholder?: string
  min?: number
  /** When set, description Text gets this id and input gets aria-describedby (for fieldset flow) */
  descriptionId?: string
  /** When set, NumberInputField gets aria-label (for article flow) */
  inputAriaLabel?: string
  /** Wrapper element: fieldset (default) or article */
  as?: 'fieldset' | 'article'
  /** When as="article", optional aria-label for the card */
  cardAriaLabel?: string
}

export function MetricNumberCard({
  title,
  description,
  value,
  onChange,
  placeholder,
  min = 0,
  descriptionId,
  inputAriaLabel,
  as = 'fieldset',
  cardAriaLabel,
}: MetricNumberCardProps) {
  return (
    <Box
      as={as}
      {...(as === 'article' && cardAriaLabel ? { 'aria-label': cardAriaLabel } : {})}
      borderWidth="0.5px"
      borderColor="neutral.200"
      borderRadius="12px"
      bg="neutral.50"
      py={6}
      px={4}
      height={{ base: 'auto', xl: '174px' }}
    >
      <Heading as="h2" size="h3" fontWeight="400" mb={1}>
        {title}
      </Heading>
      <Text
        fontSize="14px"
        lineHeight="20px"
        mb={4}
        {...(descriptionId ? { id: descriptionId } : {})}
      >
        {description}
      </Text>
      <NumberInput value={value} onChange={onChange} min={min} w={{ base: 'full', xl: '490px' }}>
        <NumberInputField
          placeholder={placeholder}
          h="36px"
          borderRadius="6px"
          borderWidth="1px"
          borderColor="neutral.200"
          pr="32px"
          pl="16px"
          {...(descriptionId ? { 'aria-describedby': descriptionId } : {})}
          {...(inputAriaLabel ? { 'aria-label': inputAriaLabel } : {})}
        />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>
    </Box>
  )
}
