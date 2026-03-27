import {
  Box,
  Flex,
  Stack,
  Text,
  Input,
  Button,
  IconButton,
  FormControl,
  FormErrorMessage,
} from '@chakra-ui/react'
import { AddIcon, DeleteIcon } from '@chakra-ui/icons'
import { useTranslation } from 'react-i18next'
import type { HierarchyLevel } from '../../types/hierarchy'

interface HierarchySectionProps {
  sectionId: string
  title: string
  levels: HierarchyLevel[]
  structuralChangesAllowed: boolean
  onChange: (levels: HierarchyLevel[]) => void
  errors?: Record<string, string>
  onClearError?: (field: string) => void
}

export function HierarchySection({
  sectionId,
  title,
  levels,
  structuralChangesAllowed,
  onChange,
  errors,
  onClearError,
}: Readonly<HierarchySectionProps>) {
  const { t } = useTranslation(['state-admin', 'common'])

  const handleNameChange = (index: number, value: string) => {
    const updated = levels.map((l, i) => (i === index ? { ...l, name: value } : l))
    onChange(updated)
    onClearError?.(`${sectionId}.${index}`)
  }

  const handleAddLevel = () => {
    const newLevel: HierarchyLevel = { level: levels.length + 1, name: '' }
    onChange([...levels, newLevel])
  }

  const handleDeleteLevel = (index: number) => {
    const updated = levels.filter((_, i) => i !== index).map((l, i) => ({ ...l, level: i + 1 }))
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
        {levels.map((level, index) => {
          const errorKey = `${sectionId}.${index}`
          const fieldError = errors?.[errorKey]
          return (
            <FormControl key={`${sectionId}-level-${level.level}`} isInvalid={!!fieldError}>
              <Flex gap={3} align="center">
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
                  {t('hierarchy.levelLabel', { level: level.level })}
                  <Text as="span" color="error.500" ml={1}>
                    *
                  </Text>
                </Text>
                <Input
                  id={`${sectionId}-level-${level.level}`}
                  value={level.name}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                  aria-label={t('hierarchy.aria.levelInput', { level: level.level })}
                  placeholder={t('hierarchy.levelLabel', { level: level.level })}
                  h="36px"
                  fontSize="sm"
                  borderColor="neutral.300"
                  borderRadius="6px"
                  _hover={{ borderColor: 'neutral.400' }}
                  _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
                />
                {structuralChangesAllowed && (
                  <IconButton
                    aria-label={t('hierarchy.aria.deleteLevel', { level: level.level })}
                    icon={<DeleteIcon />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    isDisabled={levels.length <= 1}
                    onClick={() => handleDeleteLevel(index)}
                  />
                )}
              </Flex>
              {fieldError && <FormErrorMessage ml="68px">{fieldError}</FormErrorMessage>}
            </FormControl>
          )
        })}
      </Stack>

      {structuralChangesAllowed && (
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<AddIcon boxSize={3} />}
          onClick={handleAddLevel}
          mt={3}
          color="primary.500"
          _hover={{ bg: 'primary.50' }}
          fontWeight="500"
        >
          {t('hierarchy.addLevel')}
        </Button>
      )}
    </Box>
  )
}
