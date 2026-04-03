import type { ReactNode } from 'react'
import { Flex, Box, Show } from '@chakra-ui/react'
import { LanguageSwitcher } from './language-switcher'

interface PageHeaderProps {
  children: ReactNode
  mb?: number | Record<string, number | string>
}

export function PageHeader({ children, mb = 5 }: PageHeaderProps) {
  return (
    <Flex justify="space-between" align="flex-start" mb={mb}>
      <Box flex={1} minW={0}>
        {children}
      </Box>
      <Show above="lg">
        <LanguageSwitcher />
      </Show>
    </Flex>
  )
}
