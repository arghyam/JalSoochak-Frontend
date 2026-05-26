import { Box, Flex, Image, Link, Text, VStack } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/shared/components/common'
import { ROUTES } from '@/shared/constants/routes'
import logoWithText from '@/assets/media/JalSoochak Logo with Text.svg'
import { useTenantInfo } from '@/app/context/tenant-context'
import { isSingleTenantMode } from '@/config/server-config'
import sealOfAssam from '@/assets/media/Seal_of_Assam.svg'
import jjmLogo from '@/assets/media/jjm_new_logo.svg'

const HEADER_SHELL_PROPS = {
  as: 'header' as const,
  bg: 'primary.800',
  boxShadow: '0 6px 14px rgba(0, 0, 0, 0.24)',
  mb: '28px',
  minH: { base: 'auto', md: '90px' },
  px: { base: '12px', sm: '40px', md: '80px' },
}

const INNER_FLEX_PROPS = {
  w: 'full',
  maxW: '1440px',
  mx: 'auto',
  align: 'center' as const,
  py: { base: '12px', md: '0' },
  direction: 'row' as const,
}

export function Header() {
  const { t } = useTranslation(['dashboard', 'common'])
  const { tenantName } = useTenantInfo()
  const inSingleTenantMode = isSingleTenantMode()

  if (inSingleTenantMode) {
    return (
      <Flex {...HEADER_SHELL_PROPS}>
        <Flex {...INNER_FLEX_PROPS}>
          {/* Left: Assam seal + 3-line department heading */}
          <Flex align="center" gap={{ base: '8px', md: '12px' }} flexShrink={0}>
            <Link
              as={RouterLink}
              to={ROUTES.DASHBOARD}
              display="inline-block"
              aria-label="Go to dashboard"
              _hover={{ textDecoration: 'none' }}
            >
              <Image
                src={sealOfAssam}
                alt="Government of Assam Seal"
                h={{ base: '44px', sm: '56px', md: '72px' }}
                w="auto"
                objectFit="contain"
                filter="brightness(0) invert(1)"
              />
            </Link>
            <VStack align="flex-start" spacing={0}>
              <Text
                color="white"
                fontFamily="Geist, sans-serif"
                fontSize={{ base: '9px', sm: '11px', md: '13px', lg: '14px' }}
                fontWeight="700"
                lineHeight={{ base: '14px', sm: '16px', md: '18px' }}
                letterSpacing="0.06em"
                textTransform="uppercase"
              >
                Government of Assam
              </Text>
              <Text
                color="white"
                fontFamily="Geist, sans-serif"
                fontSize={{ base: '8px', sm: '10px', md: '11px', lg: '12px' }}
                fontWeight="400"
                lineHeight={{ base: '12px', sm: '14px', md: '16px' }}
                letterSpacing="0.03em"
              >
                Public Health Engineering Department
              </Text>
              <Text
                color="white"
                fontFamily="Geist, sans-serif"
                fontSize={{ base: '11px', sm: '13px', md: '16px', lg: '18px' }}
                fontWeight="700"
                lineHeight={{ base: '16px', sm: '19px', md: '24px' }}
              >
                জল জীৱন মিছন (Jal Jeevan Mission)
              </Text>
            </VStack>
          </Flex>

          {/* Center: intentionally empty */}
          <Box flex="1" />

          {/* Right: language switcher + JJM logo */}
          <Flex align="center" gap={{ base: '8px', md: '16px' }} flexShrink={0}>
            <LanguageSwitcher isMobileHeader variant="white" />
            <Image
              src={jjmLogo}
              alt="Jal Jeevan Mission logo"
              h={{ base: '44px', sm: '56px', md: '72px' }}
              w="auto"
              objectFit="contain"
            />
          </Flex>
        </Flex>
      </Flex>
    )
  }

  const headerSubtitle = tenantName
    ? t('header.subtitleSingleTenant', {
        ns: 'dashboard',
        defaultValue: '{{tenantName}} Rural Drinking Water Supply Dashboard',
        tenantName,
      })
    : t('header.subtitle', {
        ns: 'dashboard',
        defaultValue: 'Operational Status of Water Supply Schemes',
      })

  return (
    <Flex {...HEADER_SHELL_PROPS}>
      <Flex {...INNER_FLEX_PROPS} gap={{ base: 2, md: 0 }}>
        <Flex align="center" flexShrink={0}>
          <Link
            as={RouterLink}
            to={ROUTES.DASHBOARD}
            display="inline-block"
            aria-label={t('footer.logoAlt', {
              ns: 'common',
              defaultValue: 'JalSoochak logo with text',
            })}
            _hover={{ textDecoration: 'none' }}
          >
            <Image
              src={logoWithText}
              alt={t('footer.logoAlt', { ns: 'common', defaultValue: 'JalSoochak logo with text' })}
              display="block"
              w={{ base: '70px', sm: '90.5px', md: '181px' }}
              h={{ base: '32px', sm: '40px', md: '65px' }}
              objectFit="contain"
              objectPosition="left center"
            />
          </Link>
        </Flex>

        <Flex flex="1" justify="center" w="full" px={{ base: '6px', sm: '15px' }} minW={0}>
          <Text
            textAlign="center"
            color="#FFF"
            fontFamily="Geist, sans-serif"
            fontSize={{ base: '12px', sm: '14px', md: '18px', lg: '24px' }}
            fontStyle="normal"
            fontWeight="500"
            lineHeight={{ base: '18px', sm: '20px', md: '26px', lg: '36px' }}
            maxW={{ base: '210px', sm: '280px', md: '460px', lg: 'unset' }}
            noOfLines={2}
          >
            {headerSubtitle}
          </Text>
        </Flex>

        <Box
          display="flex"
          w={{ base: '70px', sm: '90.5px', md: '181px' }}
          justifyContent="flex-end"
          flexShrink={0}
        >
          <LanguageSwitcher isMobileHeader variant="white" />
        </Box>
      </Flex>
    </Flex>
  )
}
