import type { ReactNode } from 'react'
import { IconButton, Tooltip } from '@chakra-ui/react'
import { AiOutlineInfoCircle } from 'react-icons/ai'

interface ChartInfoTooltipProps {
  tooltipContent: ReactNode
  ariaLabel?: string
}

export function ChartInfoTooltip({
  tooltipContent,
  ariaLabel = 'More info',
}: ChartInfoTooltipProps) {
  return (
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
      maxW="340px"
    >
      <IconButton
        aria-label={ariaLabel}
        icon={<AiOutlineInfoCircle />}
        variant="ghost"
        color="neutral.400"
        minW="auto"
        h="20px"
        w="20px"
        p="0"
        flexShrink={0}
        _hover={{ bg: 'transparent', color: 'neutral.600' }}
        _active={{ bg: 'transparent' }}
      />
    </Tooltip>
  )
}
