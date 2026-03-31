import { Box, Flex, Image, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/shared/components/common'
import logoIcon from '@/assets/media/logo.svg'

export function Header() {
  const { t } = useTranslation(['dashboard', 'common'])
  const headerTitle = t('header.title', {
    ns: 'dashboard',
    defaultValue: 'JalSoochak',
  })
  const headerSubtitle = t('header.subtitle', {
    ns: 'dashboard',
    defaultValue: 'Operational Status of Water Supply Schemes',
  })

  return (
    <Flex
      as="header"
      borderBottomWidth="1px"
      bg="primary.25"
      boxShadow="sm"
      mb="28px"
      minH={{ base: 'auto', md: '124px' }}
      px={{ base: '40px', md: '80px' }}
    >
      <Flex
        w="full"
        maxW="1440px"
        mx="auto"
        align="center"
        py={{ base: '12px', md: '0' }}
        direction="row"
        gap={{ base: 3, md: 0 }}
      >
        <Flex align="center" flexShrink={0}>
          <Image
            src={logoIcon}
            alt={t('sidebar.logoAlt', 'JalSoochak logo')}
            display="block"
            w={{ base: '70px', md: '117.61px' }}
            h={{ base: '40px', md: '100px' }}
            objectFit="contain"
            objectPosition="left center"
          />
        </Flex>

        <Flex flex="1" justify="center" w="full">
          <Flex direction="column" align="center" textAlign="center">
            <Text
              color="primary.500"
              fontFamily="Geist, sans-serif"
              fontSize={{ base: '18px', md: '24px' }}
              fontStyle="normal"
              fontWeight="600"
              lineHeight={{ base: '28px', md: '36px' }}
            >
              {headerTitle}
            </Text>
            <Text
              color="primary.500"
              fontFamily="Geist, sans-serif"
              fontSize={{ base: '16px', md: '20px' }}
              fontStyle="normal"
              fontWeight="500"
              lineHeight={{ base: '24px', md: '36px' }}
            >
              {headerSubtitle}
            </Text>
          </Flex>
        </Flex>

        <Box display="flex" w={{ base: '70px', md: '117.61px' }} justifyContent="flex-end">
          <LanguageSwitcher isMobileHeader />
        </Box>
      </Flex>
    </Flex>
  )
}
