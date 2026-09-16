import { Box, Divider, Flex, HStack, Link, SimpleGrid, Stack, Text, VStack } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import { ROUTES } from '@/shared/constants/routes'
import logoWithText from '@/assets/media/logo-with-text.svg'
import { RiMailLine, RiTwitterXLine } from 'react-icons/ri'
import { BiLogoLinkedin } from 'react-icons/bi'
import { isSingleTenantMode } from '@/config/server-config'
import { trackEvent } from '@/shared/lib/analytics'
import type { SocialNetwork, TenancyMode } from '@/shared/lib/analytics'
import { VisitorCounter } from '@/shared/components/common/visitor-counter'

interface SocialLink {
  network: SocialNetwork
  href: string
  ariaLabel: string
  icon: ReactNode
  isExternal?: boolean
}

interface QuickLinkItem {
  /**
   * Stable analytics key. Kept independent of the translated label, and of the route, since
   * two of these links share `STAFF_LOGIN`.
   */
  key: string
  label: string
  /** Internal route. Mutually exclusive with `href`. */
  to?: string
  /** External URL. Mutually exclusive with `to`. */
  href?: string
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

const quickLinkProps = {
  color: 'primary.500',
  fontSize: 'sm' as const,
  _hover: { textDecoration: 'underline' },
}

function FooterSocialLinks({ links, tenancy }: { links: SocialLink[]; tenancy: TenancyMode }) {
  return (
    <HStack spacing="12px">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          isExternal={link.isExternal}
          aria-label={link.ariaLabel}
          onClick={() => trackEvent('social_link_click', { network: link.network, tenancy })}
          {...commonLinkProps}
        >
          {link.icon}
        </Link>
      ))}
    </HStack>
  )
}

function FooterQuickLinks({ heading, items }: { heading: string; items: QuickLinkItem[] }) {
  return (
    <VStack align="flex-start" spacing="12px">
      <Text
        fontSize="xs"
        fontWeight="600"
        color="neutral.400"
        textTransform="uppercase"
        letterSpacing="0.5px"
      >
        {heading}
      </Text>
      {items.map((item) => {
        const isExternal = Boolean(item.href)
        const targetProps = isExternal
          ? { href: item.href, isExternal: true }
          : { as: RouterLink, to: item.to }

        return (
          <Link
            key={item.key}
            {...targetProps}
            {...quickLinkProps}
            onClick={() => trackEvent('quick_link_click', { link: item.key, external: isExternal })}
          >
            {item.label}
          </Link>
        )
      })}
    </VStack>
  )
}

/**
 * Credits row. Three slots keep the credits optically centred while pinning the visitor
 * counter to the right edge on the same line, stacking on narrow screens.
 */
function FooterBottomBar({ children }: { children: ReactNode }) {
  return (
    <>
      <Divider borderColor="neutral.200" />
      <Box w="full" px={{ base: '40px', md: '80px' }} py="16px">
        <Box w="full" maxW="1440px" mx="auto">
          <Flex align="center" gap="12px" direction={{ base: 'column', md: 'row' }}>
            <Box flex="1" display={{ base: 'none', md: 'block' }} />
            <Text flex="0 0 auto" fontSize="sm" color="neutral.500" textAlign="center">
              {children}
            </Text>
            <Flex
              flex={{ base: '0 0 auto', md: '1' }}
              w={{ base: 'full', md: 'auto' }}
              justify={{ base: 'center', md: 'flex-end' }}
            >
              <VisitorCounter />
            </Flex>
          </Flex>
        </Box>
      </Box>
    </>
  )
}

function SingleTenantFooter() {
  const { t } = useTranslation()

  const socialLinks: SocialLink[] = [
    {
      network: 'x',
      href: 'https://x.com/JJM_Assam',
      ariaLabel: t('footer.social.x'),
      icon: <RiTwitterXLine size={20} color="#64748b" />,
      isExternal: true,
    },
    {
      network: 'linkedin',
      href: 'https://www.linkedin.com/company/jjmassam/',
      ariaLabel: t('footer.social.linkedin'),
      icon: <BiLogoLinkedin size={20} color="#64748b" />,
      isExternal: true,
    },
    {
      network: 'email',
      href: 'mailto:md@jjmassam.in',
      ariaLabel: t('footer.social.email'),
      icon: <RiMailLine size={20} color="#64748b" />,
    },
  ]

  const quickLinks: QuickLinkItem[] = [
    {
      key: 'sub-divisional-officer-login',
      label: t('footer.subDivisionalOfficerLogin'),
      to: ROUTES.STAFF_LOGIN,
    },
    {
      key: 'section-officer-login',
      label: t('footer.sectionOfficerLogin'),
      to: ROUTES.STAFF_LOGIN,
    },
    { key: 'system-users-login', label: t('footer.systemUsersLogin'), to: ROUTES.LOGIN },
    {
      key: 'jalsoochak-website',
      label: t('footer.jalsoochakWebsite'),
      href: 'https://jalsoochak.in/',
    },
    {
      key: 'phed-assam-website',
      label: t('footer.phedAssamWebsite'),
      href: 'https://jjmassam.in/',
    },
    { key: 'jjm-assam-website', label: t('footer.jjmAssamWebsite'), href: 'https://jjmbrain.in/' },
    { key: 'glossary', label: t('footer.glossary'), to: ROUTES.GLOSSARY },
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
              <FooterSocialLinks links={socialLinks} tenancy="single" />
            </Stack>

            {/* Column 2: Quick Links */}
            <FooterQuickLinks heading={t('footer.quickLinks')} items={quickLinks} />

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
              <Text fontSize="sm" color="neutral.500" lineHeight="1.6" whiteSpace="pre-line">
                {t('footer.address')}
              </Text>
            </VStack>
          </SimpleGrid>
        </Box>
      </Box>

      <FooterBottomBar>
        {t('footer.copyright', { year: new Date().getFullYear() })}
        <Link
          href="https://jjmassam.in/"
          isExternal
          fontWeight="600"
          color="primary.500"
          _hover={{ textDecoration: 'underline' }}
        >
          {t('footer.phedAssam')}
        </Link>
        {t('footer.developedBy')}
        <Link
          href="https://arghyam.org/"
          isExternal
          fontWeight="600"
          color="primary.500"
          _hover={{ textDecoration: 'underline' }}
        >
          {t('footer.arghyam')}
        </Link>
      </FooterBottomBar>
    </VStack>
  )
}

function MultiTenantFooter() {
  const { t } = useTranslation()

  const socialLinks: SocialLink[] = [
    {
      network: 'x',
      href: 'https://x.com/arghyamindia',
      ariaLabel: t('footer.social.x'),
      icon: <RiTwitterXLine size={20} color="#64748b" />,
      isExternal: true,
    },
    {
      network: 'linkedin',
      href: 'https://www.linkedin.com/company/arghyam/',
      ariaLabel: t('footer.social.linkedin'),
      icon: <BiLogoLinkedin size={20} color="#64748b" />,
      isExternal: true,
    },
    {
      network: 'email',
      href: 'mailto:info@arghyam.org',
      ariaLabel: t('footer.social.email'),
      icon: <RiMailLine size={20} color="#64748b" />,
    },
  ]

  const quickLinks: QuickLinkItem[] = [
    {
      key: 'sub-divisional-officer-login',
      label: t('footer.subDivisionalOfficerLogin'),
      to: ROUTES.STAFF_LOGIN,
    },
    {
      key: 'section-officer-login',
      label: t('footer.sectionOfficerLogin'),
      to: ROUTES.STAFF_LOGIN,
    },
    { key: 'system-users-login', label: t('footer.systemUsersLogin'), to: ROUTES.LOGIN },
    {
      key: 'jalsoochak-website',
      label: t('footer.jalsoochakWebsite'),
      href: 'https://jalsoochak.in/',
    },
    { key: 'glossary', label: t('footer.glossary'), to: ROUTES.GLOSSARY },
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
              <FooterSocialLinks links={socialLinks} tenancy="multi" />
            </Stack>

            {/* Column 2: Quick Links */}
            <FooterQuickLinks heading={t('footer.quickLinks')} items={quickLinks} />

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
                {t('footer.multiTenantEmail')}
              </Text>
              <Text fontSize="sm" color="neutral.500">
                {t('footer.multiTenantPhone')}
              </Text>
              <Text fontSize="sm" color="neutral.500" lineHeight="1.6">
                {t('footer.multiTenantAddress')}
              </Text>
            </VStack>
          </SimpleGrid>
        </Box>
      </Box>

      <FooterBottomBar>
        {t('footer.multiTenantCopyright', { year: new Date().getFullYear() })}{' '}
        <Link
          href="https://arghyam.org/"
          isExternal
          fontWeight="600"
          color="primary.500"
          _hover={{ textDecoration: 'underline' }}
        >
          {t('footer.arghyam')}
        </Link>
      </FooterBottomBar>
    </VStack>
  )
}

export function Footer() {
  return isSingleTenantMode() ? <SingleTenantFooter /> : <MultiTenantFooter />
}
