import type { ReactNode } from 'react'
import { Flex, Box } from '@chakra-ui/react'
import { Header } from './header'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <Flex minH="100vh" direction="column" bg="neutral.50" overflowX="hidden">
      <Header />

      <Box as="main" flex="1" overflowX="hidden" px={{ base: '40px', md: '80px' }} pb="24px">
        <Box w="full" maxW="1440px" mx="auto" minW={0}>
          {children}
        </Box>
      </Box>
    </Flex>
  )
}
