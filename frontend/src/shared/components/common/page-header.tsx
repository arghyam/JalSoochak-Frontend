import type { ReactNode } from 'react'
import { Flex, Box, Show } from '@chakra-ui/react'
import { LanguageSwitcher } from './language-switcher'

interface PageHeaderProps {
  children: ReactNode
  mb?: number | Record<string, number | string>
}

export function PageHeader({ children, mb = 5 }: PageHeaderProps) {
  return (
    <Flex justify="space-between" align="flex-start" mb={mb} w="full" maxW="100%" overflow="hidden">
      <Box flex="1 1 0%" minW={0}>
        {children}
      </Box>

      <Box flexShrink={0} maxW="100%">
        <Show above="lg">
          <LanguageSwitcher />
        </Show>
      </Box>
    </Flex>
  )
}
