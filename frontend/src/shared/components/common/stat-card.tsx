import type { ElementType, ReactNode } from 'react'
import { Box, Flex, Icon, Text } from '@chakra-ui/react'
import { ChartInfoTooltip } from './chart-info-tooltip'

export interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: ElementType
  iconBg: string
  iconColor: string
  height?: string | number
  tooltip?: ReactNode
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconBg,
  iconColor,
  height,
  tooltip,
}: StatCardProps) {
  const StatIcon = icon
  return (
    <Box
      bg="white"
      borderWidth="1px"
      borderColor="neutral.100"
      height={{ base: 'auto', xl: height ?? 'auto' }}
      borderRadius="lg"
      boxShadow="default"
      p={4}
    >
      <Flex direction="column" gap={3}>
        <Flex
          h="48px"
          w="48px"
          align="center"
          justify="center"
          borderRadius="full"
          bg={iconBg}
          aria-hidden="true"
        >
          <Icon as={StatIcon} boxSize={7} color={iconColor} />
        </Flex>
        <Flex direction="column" gap={1}>
          <Flex align="center" gap="4px">
            <Text color="neutral.600" fontSize={{ base: 'sm', md: 'md' }}>
              {title}
            </Text>
            {tooltip !== undefined && <ChartInfoTooltip tooltipContent={tooltip} />}
          </Flex>
          <Text
            textStyle="h9"
            fontSize={{ base: 'xl', md: '2xl' }}
            aria-label={`${title}: ${value}`}
          >
            {value}
          </Text>
          {subtitle !== undefined && (
            <Text color="neutral.600" fontSize={{ base: 'sm', md: 'md' }}>
              {subtitle}
            </Text>
          )}
        </Flex>
      </Flex>
    </Box>
  )
}
