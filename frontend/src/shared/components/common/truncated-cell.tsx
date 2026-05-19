import { Text } from '@chakra-ui/react'
import { ActionTooltip } from './action-tooltip'

interface TruncatedCellProps {
  value: string | null | undefined
}

export function TruncatedCell({ value }: TruncatedCellProps) {
  const text = value ?? ''

  if (!text) {
    return (
      <Text textStyle="h10" fontWeight="400" color="neutral.400">
        —
      </Text>
    )
  }

  return (
    <ActionTooltip label={text} openDelay={300}>
      <Text
        textStyle="h10"
        fontWeight="400"
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
      >
        {text}
      </Text>
    </ActionTooltip>
  )
}
