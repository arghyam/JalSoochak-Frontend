import { Box, Heading, SimpleGrid } from '@chakra-ui/react'
import { FormInput } from '@/shared/components/common'

const MAX_FIELD_WIDTH = { base: '100%' as const, lg: '486px' as const }

export interface StateAdminFormValue {
  firstName: string
  lastName: string
  email: string
  phone: string
  secondaryEmail: string
  contactNumber: string
}

export interface StateAdminLabels {
  firstName: string
  lastName: string
  email: string
  phone: string
  secondaryEmail: string
  contactNumber: string
}

export interface StateAdminDetailsSectionProps {
  /** Section heading */
  title: string
  value: StateAdminFormValue
  onChange: (field: keyof StateAdminFormValue, value: string) => void
  labels: StateAdminLabels
  /** When true, email field is read-only (e.g. on edit page) */
  emailReadOnly?: boolean
  /** Placeholder for text inputs (e.g. t('common:enter')) */
  enterPlaceholder?: string
  /** Placeholder for phone (e.g. '+91') */
  phonePlaceholder?: string
}

export function StateAdminDetailsSection({
  title,
  value,
  onChange,
  labels,
  emailReadOnly = false,
  enterPlaceholder,
  phonePlaceholder = '+91',
}: StateAdminDetailsSectionProps) {
  return (
    <Box aria-labelledby="state-admin-details-heading" mb={7}>
      <Heading as="h2" size="h3" fontWeight="400" mb={4} id="state-admin-details-heading">
        {title}
      </Heading>
      <SimpleGrid
        columns={{ base: 1, lg: 2 }}
        spacing={3}
        aria-labelledby="state-admin-details-heading"
      >
        <FormInput
          label={labels.firstName}
          value={value.firstName}
          onChange={(e) => onChange('firstName', e.target.value)}
          placeholder={enterPlaceholder}
          isRequired
          maxW={MAX_FIELD_WIDTH}
        />
        <FormInput
          label={labels.lastName}
          value={value.lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
          placeholder={enterPlaceholder}
          isRequired
          maxW={MAX_FIELD_WIDTH}
        />
        <FormInput
          label={labels.email}
          type="email"
          value={value.email}
          onChange={(e) => onChange('email', e.target.value)}
          placeholder={enterPlaceholder}
          isRequired={!emailReadOnly}
          isDisabled={emailReadOnly}
          isReadOnly={emailReadOnly}
          maxW={MAX_FIELD_WIDTH}
        />
        <FormInput
          label={labels.phone}
          type="tel"
          value={value.phone}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '')
            if (v.length <= 10) onChange('phone', v)
          }}
          placeholder={phonePlaceholder}
          isRequired
          maxW={MAX_FIELD_WIDTH}
          inputProps={{ inputMode: 'numeric' }}
        />
        <FormInput
          label={labels.secondaryEmail}
          type="email"
          value={value.secondaryEmail}
          onChange={(e) => onChange('secondaryEmail', e.target.value)}
          placeholder={enterPlaceholder}
          maxW={MAX_FIELD_WIDTH}
        />
        <FormInput
          label={labels.contactNumber}
          type="tel"
          value={value.contactNumber}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '')
            if (v.length <= 10) onChange('contactNumber', v)
          }}
          placeholder={enterPlaceholder}
          maxW={MAX_FIELD_WIDTH}
          inputProps={{ inputMode: 'numeric' }}
        />
      </SimpleGrid>
    </Box>
  )
}
