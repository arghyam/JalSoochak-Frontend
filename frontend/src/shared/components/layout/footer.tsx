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
import { ARGHYAM_SOCIAL_LINKS, getBrandingProfile } from '@/shared/lib/branding'
import type { BrandingContact, BrandingSocialLink } from '@/shared/lib/branding'

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

/** Branding profiles hold data only, so the footer maps each network to its icon. */
const SOCIAL_ICONS: Record<SocialNetwork, ReactNode> = {
  x: <RiTwitterXLine size={20} color="#64748b" />,
  linkedin: <BiLogoLinkedin size={20} color="#64748b" />,
  email: <RiMailLine size={20} color="#64748b" />,
}

/** Single-tenant footer grid: brand, quick links and contact columns. */
const GRID_WITH_CONTACT = {
  columns: { base: 1, md: 3 },
  templateColumns: { base: '1fr', md: '14fr 10fr 10fr' },
}

/**
 * Without a contact column, both columns size to their content and sit centred as a pair
 * instead of leaving the right side empty. From `xl`, a fixed inset replaces `space-around`,
 * whose outer margins grow with the spare width and get too wide on large screens.
 */
const GRID_WITHOUT_CONTACT = {
  columns: { base: 1, md: 2 },
  templateColumns: { base: '1fr', md: 'auto auto' },
  justifyContent: { md: 'space-around', xl: 'space-between' },
  px: { xl: '11.5%' },
}

const quickLinkProps = {
  color: 'primary.500',
  fontSize: 'sm' as const,
  _hover: { textDecoration: 'underline' },
}

function FooterSocialLinks({
  links,
  tenancy,
}: {
  links: readonly BrandingSocialLink[]
  tenancy: TenancyMode
}) {
  const { t } = useTranslation()

  return (
    <HStack spacing="12px">
      {links.map(({ network, href }) => (
        <Link
          key={href}
          href={href}
          isExternal={!href.startsWith('mailto:')}
          aria-label={t(`footer.social.${network}`)}
          onClick={() => trackEvent('social_link_click', { network, tenancy })}
          {...commonLinkProps}
        >
          {SOCIAL_ICONS[network]}
        </Link>
      ))}
    </HStack>
  )
}

function FooterQuickLinks({ heading, items }: { heading: string; items: QuickLinkItem[] }) {
  return (
    <VStack as="nav" aria-label={heading} align="flex-start" spacing="12px">
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

function FooterContact({ contact }: { contact: BrandingContact }) {
  const { t } = useTranslation()

  return (
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
        {contact.email}
      </Text>
      <Text fontSize="sm" color="neutral.500">
        {t(contact.phoneKey)}
      </Text>
      <Text fontSize="sm" color="neutral.500" lineHeight="1.6" whiteSpace="pre-line">
        {t(contact.addressKey)}
      </Text>
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
  const { footer: branding } = getBrandingProfile()
  const hasContact = branding.contact !== null

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
    ...branding.quickLinks.map(({ key, labelKey, href }) => ({ key, label: t(labelKey), href })),
    { key: 'glossary', label: t('footer.glossary'), to: ROUTES.GLOSSARY },
  ]

  return (
    <VStack spacing={0} w="full" bg="primary.25" borderTopWidth="1px" borderColor="neutral.200">
      {/* Top Section: Content */}
      <Box w="full" px={{ base: '40px', md: '80px' }} py={{ base: '32px', md: '40px' }}>
        <Box w="full" maxW="1440px" mx="auto">
          <SimpleGrid
            spacing={{ base: '32px', md: '48px', xl: '80px' }}
            {...(hasContact ? GRID_WITH_CONTACT : GRID_WITHOUT_CONTACT)}
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
              <FooterSocialLinks links={branding.socialLinks} tenancy="single" />
            </Stack>

            {/* Column 2: Quick Links */}
            <FooterQuickLinks heading={t('footer.quickLinks')} items={quickLinks} />

            {/* Column 3: Contact Us, only for profiles that have one */}
            {branding.contact && <FooterContact contact={branding.contact} />}
          </SimpleGrid>
        </Box>
      </Box>

      <FooterBottomBar>
        {t('footer.copyright', { year: new Date().getFullYear() })}
        <Link
          href={branding.copyrightOrg.href}
          isExternal
          fontWeight="600"
          color="primary.500"
          _hover={{ textDecoration: 'underline' }}
        >
          {t(branding.copyrightOrg.labelKey)}
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
              <FooterSocialLinks links={ARGHYAM_SOCIAL_LINKS} tenancy="multi" />
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
