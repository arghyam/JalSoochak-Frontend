import { Box, Divider, Flex, Link, SimpleGrid, Stack, Text, VStack } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import logoWithText from '@/assets/media/logo-with-text.svg'

const description =
  "AI-enabled water supply monitoring for India's Rural Water Supply. Empowering frontline workers with reliable, auditable data — from field to governance."

export function Footer() {
  return (
    <VStack spacing={0} w="full" bg="primary.25" borderTopWidth="1px" borderColor="neutral.200">
      {/* Top Section: Content */}
      <Box w="full" px={{ base: '40px', md: '80px' }} py={{ base: '32px', md: '40px' }}>
        <Box w="full" maxW="1440px" mx="auto">
          <SimpleGrid
            columns={{ base: 1, md: 3 }}
            spacing={{ base: '32px', md: '48px', xl: '80px' }}
            templateColumns={{ base: '1fr', md: '5fr 2fr 4fr' }}
          >
            {/* Column 1: Logo & Description */}
            <Stack spacing="16px">
              <Box w="196px" h="100px">
                <img
                  src={logoWithText}
                  alt="JalSoochak logo with text"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </Box>
              <Text fontSize="sm" color="neutral.500" lineHeight="1.6">
                {description}
              </Text>
            </Stack>

            {/* Column 2: Quick Links */}
            <VStack align="flex-start" spacing="12px">
              <Text
                fontSize="xs"
                fontWeight="600"
                color="neutral.400"
                textTransform="uppercase"
                letterSpacing="0.5px"
              >
                Quick Links
              </Text>
              <Link
                as={RouterLink}
                to="/staff/login"
                color="primary.500"
                fontSize="sm"
                _hover={{ textDecoration: 'underline' }}
              >
                Field official login
              </Link>
              <Link
                href="#"
                isExternal
                color="primary.500"
                fontSize="sm"
                _hover={{ textDecoration: 'underline' }}
              >
                JalSoochak website
              </Link>
            </VStack>

            {/* Column 3: Contact Us */}
            <VStack align="flex-start" spacing="12px">
              <Text
                fontSize="xs"
                fontWeight="600"
                color="neutral.400"
                textTransform="uppercase"
                letterSpacing="0.5px"
              >
                Contact Us
              </Text>
              <Text fontSize="sm" color="neutral.950">
                info@arghyam.org
              </Text>
              <Text fontSize="sm" color="neutral.950">
                +91-80 4169 8941
              </Text>
              <Text fontSize="sm" color="neutral.950" lineHeight="1.6">
                #599, ROHINI, 12th Main Rd, 7th Cross, HAL 2nd Stage, Indiranagar, Bengaluru,
                Karnataka 560068
              </Text>
            </VStack>
          </SimpleGrid>
        </Box>
      </Box>

      {/* Divider */}
      <Divider borderColor="neutral.200" />

      {/* Bottom Section: Credits */}
      <Box w="full" px={{ base: '40px', md: '80px' }} py="16px">
        <Box w="full" maxW="1440px" mx="auto">
          <Flex justify="center">
            <Text fontSize="sm" color="neutral.500" textAlign="center">
              © 2026 JalSoochak · An initiative by{' '}
              <Link
                href="https://arghyam.org/"
                isExternal
                fontWeight="600"
                color="primary.500"
                _hover={{ textDecoration: 'underline' }}
              >
                Arghyam
              </Link>
            </Text>
          </Flex>
        </Box>
      </Box>
    </VStack>
  )
}
