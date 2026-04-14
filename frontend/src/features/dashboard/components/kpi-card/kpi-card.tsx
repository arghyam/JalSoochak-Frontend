import type { ReactNode } from 'react'
import { Box, Flex, Icon, IconButton, Text, Tooltip } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { AiOutlineInfoCircle } from 'react-icons/ai'
import { MdArrowDownward, MdArrowUpward } from 'react-icons/md'

type KPITrend = {
  direction: 'up' | 'down' | 'neutral'
  text: string
}

interface KPICardProps {
  title: string
  value: string | number
  icon?: ReactNode
  trend?: KPITrend
  tooltipContent?: ReactNode
}

export function KPICard({ title, value, icon, trend, tooltipContent }: KPICardProps) {
  const { i18n } = useTranslation()
  const numberLocale = i18n.resolvedLanguage === 'hi' ? 'hi-IN' : 'en-IN'
  const formattedValue = typeof value === 'number' ? value.toLocaleString(numberLocale) : value
  const trendColor =
    trend?.direction === 'up' ? '#079455' : trend?.direction === 'down' ? '#D92D20' : 'neutral.500'
  const TrendIcon =
    trend?.direction === 'up' ? MdArrowUpward : trend?.direction === 'down' ? MdArrowDownward : null

  return (
    <Box
      bg="white"
      borderRadius="12px"
      borderTopWidth="3px"
      borderTopStyle="solid"
      borderTopColor="primary.500"
      borderBottomWidth="0.5px"
      borderBottomStyle="solid"
      borderBottomColor="neutral.200"
      borderLeftWidth="0.1px"
      borderLeftStyle="solid"
      borderLeftColor="neutral.200"
      borderRightWidth="0.1px"
      borderRightStyle="solid"
      borderRightColor="neutral.200"
      w="full"
      minH="140px"
      px="16px"
      py="24px"
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
            {tooltipContent ? (
              <Tooltip
                label={tooltipContent}
                hasArrow
                placement="top-end"
                bg="white"
                color="neutral.700"
                borderWidth="1px"
                borderColor="neutral.200"
                borderRadius="8px"
                boxShadow="md"
                p="12px"
                maxW="320px"
              >
                <IconButton
                  aria-label="More info"
                  icon={<AiOutlineInfoCircle />}
                  variant="ghost"
                  color="neutral.400"
                  minW="auto"
                  h="16px"
                  w="16px"
                  p="0"
                  _hover={{ bg: 'transparent' }}
                  _active={{ bg: 'transparent' }}
                />
              </Tooltip>
            ) : (
              <Icon as={AiOutlineInfoCircle} boxSize="16px" color="neutral.400" />
            )}
          </Flex>
          <Text textStyle="bodyText2" color="neutral.950" mb={1}>
            {formattedValue}
          </Text>
          {trend ? (
            <Flex align="center" gap={1}>
              {TrendIcon ? (
                <Icon as={TrendIcon} boxSize="16px" h="16px" w="12px" color={trendColor} />
              ) : null}
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
