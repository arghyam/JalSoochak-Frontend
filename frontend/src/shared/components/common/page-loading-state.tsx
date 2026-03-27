import { Flex, Spinner, Text } from '@chakra-ui/react'

export interface PageLoadingStateProps {
  message: string
}

export function PageLoadingState({ message }: PageLoadingStateProps) {
  return (
    <Flex align="center" role="status" aria-live="polite" aria-busy="true">
      <Spinner size="md" color="primary.500" mr={3} />
      <Text color="neutral.600">{message}</Text>
    </Flex>
  )
}
