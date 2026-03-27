import type { ElementType } from 'react'
import { Box, Flex, Icon, Text } from '@chakra-ui/react'

export interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: ElementType
  iconBg: string
  iconColor: string
  height?: string | number
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconBg,
  iconColor,
  height,
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
          h="40px"
          w="40px"
          align="center"
          justify="center"
          borderRadius="full"
          bg={iconBg}
          aria-hidden="true"
        >
          <Icon as={StatIcon} boxSize={5} color={iconColor} />
        </Flex>
        <Flex direction="column" gap={1}>
          <Text color="neutral.600" fontSize={{ base: 'sm', md: 'md' }}>
            {title}
          </Text>
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
