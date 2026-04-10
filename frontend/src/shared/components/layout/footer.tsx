import { Box, Divider, Flex, HStack, Link, SimpleGrid, Stack, Text, VStack } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import { ROUTES } from '@/shared/constants/routes'
import logoWithText from '@/assets/media/logo-with-text.svg'
import { RiMailLine, RiTwitterXLine } from 'react-icons/ri'
import { BiLogoLinkedin } from 'react-icons/bi'

interface SocialLink {
  href: string
  ariaLabel: string
  icon: ReactNode
  isExternal?: boolean
}

const commonLinkProps = {
  display: 'flex' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  w: '40px',
  h: '40px',
  bg: 'neutral.100',
  borderRadius: '8px',
  _hover: { bg: 'neutral.200' },
  transition: 'background-color 0.2s',
}

export function Footer() {
  const { t } = useTranslation()

  const socialLinks: SocialLink[] = [
    {
      href: 'https://x.com/arghyamindia',
      ariaLabel: t('footer.social.x'),
      icon: <RiTwitterXLine size={20} color="#64748b" />,
      isExternal: true,
    },
    {
      href: 'https://www.linkedin.com/company/arghyam/',
      ariaLabel: t('footer.social.linkedin'),
      icon: <BiLogoLinkedin size={20} color="#64748b" />,
      isExternal: true,
    },
    {
      href: 'mailto:info@arghyam.org',
      ariaLabel: t('footer.social.email'),
      icon: <RiMailLine size={20} color="#64748b" />,
    },
  ]
  return (
    <VStack spacing={0} w="full" bg="primary.25" borderTopWidth="1px" borderColor="neutral.200">
      {/* Top Section: Content */}
      <Box w="full" px={{ base: '40px', md: '80px' }} py={{ base: '32px', md: '40px' }}>
        <Box w="full" maxW="1440px" mx="auto">
          <SimpleGrid
            columns={{ base: 1, md: 3 }}
            spacing={{ base: '32px', md: '48px', xl: '80px' }}
            templateColumns={{ base: '1fr', md: '14fr 10fr 10fr' }}
          >
            {/* Column 1: Logo & Description */}
            <Stack spacing="16px">
              <Box w="156px" h="80px">
                <img
                  src={logoWithText}
                  alt={t('footer.logoAlt')}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </Box>
              <Text
                fontSize="sm"
                color="neutral.500"
                lineHeight="1.6"
                width={{ base: '100%', md: '280px', lg: '400px' }}
                mb={1}
              >
                {t('footer.description')}
              </Text>
              {/* Social Media Icons */}
              <HStack spacing="12px">
                {socialLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    isExternal={link.isExternal}
                    aria-label={link.ariaLabel}
                    {...commonLinkProps}
                  >
                    {link.icon}
                  </Link>
                ))}
              </HStack>
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
                href="https://jalsoochak.in/"
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
              <Text fontSize="sm" color="neutral.500">
                {t('footer.email')}
              </Text>
              <Text fontSize="sm" color="neutral.500">
                {t('footer.phone')}
              </Text>
              <Text fontSize="sm" color="neutral.500" lineHeight="1.6">
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
