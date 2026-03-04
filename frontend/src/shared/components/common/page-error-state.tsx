import { Text } from '@chakra-ui/react'

export interface PageErrorStateProps {
  message: string
}

export function PageErrorState({ message }: PageErrorStateProps) {
  return (
    <Text role="alert" color="error.500">
      {message}
    </Text>
  )
}
