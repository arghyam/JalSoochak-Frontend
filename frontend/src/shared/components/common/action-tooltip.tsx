import { Tooltip, type TooltipProps } from '@chakra-ui/react'

type ActionTooltipProps = Omit<TooltipProps, 'h' | 'borderRadius' | 'py' | 'px' | 'bg' | 'color'>

export function ActionTooltip(props: ActionTooltipProps) {
  return (
    <Tooltip
      hasArrow
      placement="top"
      minH="24px"
      maxH="144px"
      borderRadius="4px"
      py="2px"
      px="8px"
      bg="primary.50"
      color="primary.950"
      {...props}
    />
  )
}
