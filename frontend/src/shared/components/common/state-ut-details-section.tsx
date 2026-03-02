import type { ReactNode } from 'react'
import { Box, Flex, FormControl, FormLabel, Heading, SimpleGrid, Text } from '@chakra-ui/react'
import {
  FormInput,
  SearchableSelect,
  type SearchableSelectOption,
} from '@/shared/components/common'

export interface StateUTDetailsSectionProps {
  /** Section heading */
  title: string
  /** Optional element to show on the right of the heading (e.g. edit icon) */
  headerRightElement?: ReactNode
  /** Label for name field */
  nameLabel: string
  /** Label for code field */
  codeLabel: string
  /** Current name value (display or select value) */
  name: string
  /** Current code value */
  code: string
  /**
   * When provided with onNameChange, the name field is a SearchableSelect.
   * When omitted, name and code are both read-only inputs.
   */
  nameOptions?: SearchableSelectOption[]
  onNameChange?: (name: string) => void
  /** Disable the state/name select (e.g. while loading options) */
  nameSelectDisabled?: boolean
  /** Placeholder for the name select */
  nameSelectPlaceholder?: string
}

export function StateUTDetailsSection({
  title,
  headerRightElement,
  nameLabel,
  codeLabel,
  name,
  code,
  nameOptions,
  onNameChange,
  nameSelectDisabled,
  nameSelectPlaceholder,
}: StateUTDetailsSectionProps) {
  const isEditable = Boolean(nameOptions && onNameChange)

  return (
    <Box aria-labelledby="state-ut-details-heading" mb={7}>
      {headerRightElement ? (
        <Flex justify="space-between" align="flex-start" mb={4}>
          <Heading as="h2" size="h3" fontWeight="400" id="state-ut-details-heading">
            {title}
          </Heading>
          {headerRightElement}
        </Flex>
      ) : (
        <Heading as="h2" size="h3" fontWeight="400" mb={4} id="state-ut-details-heading">
          {title}
        </Heading>
      )}
      <SimpleGrid
        columns={{ base: 1, lg: 2 }}
        spacing={6}
        aria-labelledby="state-ut-details-heading"
      >
        {isEditable ? (
          <FormControl isRequired>
            <FormLabel htmlFor="state-ut-name-select" requiredIndicator={<></>} mb={1}>
              <Text textStyle="h10">
                {nameLabel}
                <Text as="span" color="error.500">
                  {' '}
                  *
                </Text>
              </Text>
            </FormLabel>
            <SearchableSelect
              id="state-ut-name-select"
              options={nameOptions ?? []}
              value={name}
              onChange={onNameChange!}
              placeholder={nameSelectPlaceholder}
              placeholderColor="neutral.300"
              width={{ base: '100%', xl: '486px' }}
              disabled={nameSelectDisabled}
            />
          </FormControl>
        ) : (
          <FormInput
            label={nameLabel}
            value={name}
            onChange={() => {}}
            isReadOnly
            maxW={{ base: '100%', lg: '486px' }}
          />
        )}
        <FormInput
          label={codeLabel}
          value={code}
          onChange={() => {}}
          isReadOnly
          maxW={{ base: '100%', lg: '486px' }}
        />
      </SimpleGrid>
    </Box>
  )
}
