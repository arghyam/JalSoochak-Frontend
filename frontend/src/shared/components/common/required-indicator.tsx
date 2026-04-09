import { Text, VisuallyHidden } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'

interface RequiredIndicatorProps {
  required?: boolean
}

export function RequiredIndicator({ required }: RequiredIndicatorProps) {
  const { t } = useTranslation('common')

  if (required === true) {
    return (
      <Text as="span" color="error.500" ml={1} aria-hidden="true">
        *<VisuallyHidden>{t('required')}</VisuallyHidden>
      </Text>
    )
  }

  if (required === false) {
    return (
      <Text as="span" color="neutral.400" ml={1} fontSize="xs">
        {t('optional')}
      </Text>
    )
  }

  return null
}
