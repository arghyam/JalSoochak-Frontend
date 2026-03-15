import { Box, Flex, Stack, Text, Input } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import type { HierarchyLevel } from '../../types/hierarchy'

interface HierarchySectionProps {
  sectionId: string
  title: string
  levels: HierarchyLevel[]
  onChange: (levels: HierarchyLevel[]) => void
  ariaLevelKey: string
}

export function HierarchySection({
  sectionId,
  title,
  levels,
  onChange,
  ariaLevelKey,
}: HierarchySectionProps) {
  const { t } = useTranslation(['state-admin'])

  const handleChange = (index: number, value: string) => {
    const updated = levels.map((l, i) => (i === index ? { ...l, name: value } : l))
    onChange(updated)
  }

  return (
    <Box as="fieldset" border="none" p={0} m={0}>
      <Text
        as="legend"
        fontSize={{ base: 'xs', md: 'sm' }}
        fontWeight="medium"
        color="neutral.950"
        mb={3}
      >
        {title}
      </Text>
      <Stack spacing={3}>
        {levels.map((level, index) => (
          <Flex key={`${sectionId}-level-${level.level}`} gap={3} align="center">
            <Text
              as="label"
              htmlFor={`${sectionId}-level-${level.level}`}
              fontSize={{ base: 'xs', md: 'sm' }}
              fontWeight="medium"
              color="neutral.950"
              whiteSpace="nowrap"
              flexShrink={0}
              w="56px"
            >
              {t('configuration.sections.lgdHierarchy.levelLabel', { level: level.level })}
              <Text as="span" color="error.500" ml={1}>
                *
              </Text>
            </Text>
            <Input
              id={`${sectionId}-level-${level.level}`}
              value={level.name}
              onChange={(e) => handleChange(index, e.target.value)}
              aria-label={t(ariaLevelKey, { level: level.level })}
              placeholder={t('configuration.sections.lgdHierarchy.levelLabel', {
                level: level.level,
              })}
              h="36px"
              w={{ base: 'full', xl: '418px' }}
              fontSize="sm"
              borderColor="neutral.300"
              borderRadius="6px"
              _hover={{ borderColor: 'neutral.400' }}
              _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
            />
          </Flex>
        ))}
      </Stack>
    </Box>
  )
}
