import { Box, Flex, Image, Link, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/shared/components/common'
import { ROUTES } from '@/shared/constants/routes'
import logoWithText from '@/assets/media/JalSoochak Logo with Text.svg'

export function Header() {
  const { t } = useTranslation(['dashboard', 'common'])
  const headerSubtitle = t('header.subtitle', {
    ns: 'dashboard',
    defaultValue: 'Operational Status of Water Supply Schemes',
  })

  return (
    <Flex
      as="header"
      bg="primary.800"
      boxShadow="0 6px 14px rgba(0, 0, 0, 0.24)"
      mb="28px"
      minH={{ base: 'auto', md: '90px' }}
      px={{ base: '12px', sm: '40px', md: '80px' }}
    >
      <Flex
        w="full"
        maxW="1440px"
        mx="auto"
        align="center"
        py={{ base: '12px', md: '0' }}
        direction="row"
        gap={{ base: 2, md: 0 }}
      >
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
            fontSize={{ base: '12px', sm: '14px', md: '24px' }}
            fontStyle="normal"
            fontWeight="500"
            lineHeight={{ base: '18px', sm: '20px', md: '36px' }}
            maxW={{ base: '210px', sm: 'unset' }}
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
