import { Box, Divider, Flex, Link, SimpleGrid, Stack, Text, VStack } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/shared/constants/routes'
import logoWithText from '@/assets/media/logo-with-text.svg'

export function Footer() {
  const { t } = useTranslation()
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
                {t('footer.description')}
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
                {t('footer.quickLinks')}
              </Text>
              <Link
                as={RouterLink}
                to={ROUTES.STAFF_LOGIN}
                color="primary.500"
                fontSize="sm"
                _hover={{ textDecoration: 'underline' }}
              >
                {t('footer.fieldOfficialLogin')}
              </Link>
              <Link
                href="#"
                isExternal
                color="primary.500"
                fontSize="sm"
                _hover={{ textDecoration: 'underline' }}
              >
                {t('footer.jalsoochakWebsite')}
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
                {t('footer.contactUs')}
              </Text>
              <Text fontSize="sm" color="neutral.950">
                {t('footer.email')}
              </Text>
              <Text fontSize="sm" color="neutral.950">
                {t('footer.phone')}
              </Text>
              <Text fontSize="sm" color="neutral.950" lineHeight="1.6">
                {t('footer.address')}
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
              {t('footer.copyright', { year: new Date().getFullYear() })}{' '}
              <Link
                href="https://arghyam.org/"
                isExternal
                fontWeight="600"
                color="primary.500"
                _hover={{ textDecoration: 'underline' }}
              >
                {t('footer.arghyam')}
              </Link>
            </Text>
          </Flex>
        </Box>
      </Box>
    </VStack>
  )
}
