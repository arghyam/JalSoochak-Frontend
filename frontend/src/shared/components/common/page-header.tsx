import type { ReactNode } from 'react'
import { Flex, Box, Show } from '@chakra-ui/react'
import { LanguageSwitcher } from './language-switcher'

interface PageHeaderProps {
  readonly children: ReactNode
  readonly mb?: number | Record<string, number | string>
  readonly rightContent?: ReactNode
}

export function PageHeader({ children, mb = 5, rightContent }: PageHeaderProps) {
  return (
    <Flex justify="space-between" align="flex-start" mb={mb} w="full" maxW="100%">
      <Box flex="1 1 0%" minW={0}>
        {children}
      </Box>

      <Box flexShrink={0} maxW="100%">
        <Flex align="center" gap="8px">
          {rightContent ? <Box>{rightContent}</Box> : null}
          <Show above="lg">
            <LanguageSwitcher />
          </Show>
        </Flex>
      </Box>
    </Flex>
  )
}
