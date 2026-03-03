import type { ReactNode } from 'react'
import { Box, Flex, Icon, Text } from '@chakra-ui/react'
import { AiOutlineInfoCircle } from 'react-icons/ai'
import { MdArrowDownward, MdArrowUpward } from 'react-icons/md'

type KPITrend = {
  direction: 'up' | 'down'
  text: string
}

interface KPICardProps {
  title: string
  value: string | number
  icon?: ReactNode
  trend?: KPITrend
}

export function KPICard({ title, value, icon, trend }: KPICardProps) {
  const formattedValue = typeof value === 'number' ? value.toLocaleString('en-IN') : value
  const isPositive = trend?.direction === 'up'
  const trendColor = isPositive ? '#079455' : '#D92D20'
  const TrendIcon = isPositive ? MdArrowUpward : MdArrowDownward

  return (
    <Box
      bg="white"
      borderRadius="12px"
      borderWidth="0.5px"
      borderColor="neutral.200"
      w="full"
      minH="120px"
      px="16px"
      py="16px"
      boxShadow="sm"
      transition="box-shadow 0.2s"
    >
      <Flex align="center" gap="12px">
        {icon ? (
          <Flex align="center" justify="center">
            {icon}
          </Flex>
        ) : null}
        <Flex direction="column" flex="1" minW={0}>
          <Flex justify="space-between" align="flex-start" mb={1}>
            <Text
              textStyle="bodyText4"
              fontWeight="400"
              color="neutral.600"
              fontSize={{ base: '14px', md: '16px' }}
            >
              {title}
            </Text>
            <Icon as={AiOutlineInfoCircle} boxSize="16px" color="neutral.400" />
          </Flex>
          <Text textStyle="bodyText2" color="neutral.950" mb={1}>
            {formattedValue}
          </Text>
          {trend ? (
            <Flex align="center" gap={1}>
              <Icon as={TrendIcon} boxSize="16px" h="16px" w="12px" color={trendColor} />
              <Text textStyle="bodyText4" fontSize="12px" fontWeight="400" color={trendColor}>
                {trend.text}
              </Text>
            </Flex>
          ) : null}
        </Flex>
      </Flex>
    </Box>
  )
}
