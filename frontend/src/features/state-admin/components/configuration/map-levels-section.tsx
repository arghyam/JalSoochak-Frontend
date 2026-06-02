import { Box, Flex, HStack, Radio, RadioGroup, SimpleGrid, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FieldInfoIcon } from './configuration-view-mode'

interface MapLevelsSectionProps {
  title: string
  infoTooltip: string
  levelCount: number
  levelLabelKey: string
  value: boolean[]
  onChange: (value: boolean[]) => void
}

function applyLevelCascade(levels: boolean[], changedIndex: number, newValue: boolean): boolean[] {
  const next = [...levels]
  next[changedIndex] = newValue
  if (!newValue) {
    for (let i = changedIndex + 1; i < next.length; i++) next[i] = false
  }
  return next
}

export function MapLevelsSection({
  title,
  infoTooltip,
  levelCount,
  levelLabelKey,
  value,
  onChange,
}: MapLevelsSectionProps) {
  const { t } = useTranslation(['state-admin', 'common'])

  return (
    <Box>
      <Flex align="center" gap={1} mb={3}>
        <Text fontSize="sm" fontWeight="600" color="neutral.950">
          {title}
        </Text>
        <FieldInfoIcon tooltip={infoTooltip} />
      </Flex>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {Array.from({ length: levelCount }).map((_, i) => (
          <Box key={`level-${i + 1}`}>
            <Flex align="center" gap={1} mb={2}>
              <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium" color="neutral.950">
                {t(levelLabelKey, { level: i + 1 })}
              </Text>
            </Flex>
            <RadioGroup
              value={value[i] ? 'yes' : 'no'}
              onChange={(val) => onChange(applyLevelCascade(value, i, val === 'yes'))}
              isDisabled={i > 0 && !value[i - 1]}
            >
              <HStack spacing={6}>
                <Radio value="yes">
                  <Text fontSize="sm" color="neutral.950">
                    {t('common:yes')}
                  </Text>
                </Radio>
                <Radio value="no">
                  <Text fontSize="sm" color="neutral.950">
                    {t('common:no')}
                  </Text>
                </Radio>
              </HStack>
            </RadioGroup>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  )
}
