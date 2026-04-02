import { Box, Heading, Text, VStack } from '@chakra-ui/react'

interface ComingSoonShellProps {
  heading: string
  comingSoonText: string
  subtitle: string
}

export function ComingSoonShell({ heading, comingSoonText, subtitle }: ComingSoonShellProps) {
  return (
    <Box>
      <Heading size="md" mb={6} color="neutral.950">
        {heading}
      </Heading>
      <VStack
        align="center"
        justify="center"
        minH="400px"
        bg="white"
        borderRadius="lg"
        border="1px"
        borderColor="neutral.100"
        spacing={2}
      >
        <Text fontSize="2xl" fontWeight="semibold" color="neutral.700">
          {comingSoonText}
        </Text>
        <Text fontSize="sm" color="neutral.500">
          {subtitle}
        </Text>
      </VStack>
    </Box>
  )
}
