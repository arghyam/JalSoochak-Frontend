import { Box, Flex, Image, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/shared/components/common'
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
      borderBottomWidth="1px"
      bg="primary.800"
      boxShadow="0 6px 14px rgba(0, 0, 0, 0.24)"
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
            src={logoWithText}
            alt={t('footer.logoAlt', { ns: 'common', defaultValue: 'JalSoochak logo with text' })}
            display="block"
            w={{ base: '90.5px', md: '181px' }}
            h={{ base: '40px', md: '80px' }}
            objectFit="contain"
            objectPosition="left center"
          />
        </Flex>

        <Flex flex="1" justify="center" w="full" px="15px">
          <Text
            textAlign="center"
            color="#FFF"
            fontFamily="Geist, sans-serif"
            fontSize={{ base: '14px', md: '24px' }}
            fontStyle="normal"
            fontWeight="500"
            lineHeight={{ base: '20px', md: '36px' }}
          >
            {headerSubtitle}
          </Text>
        </Flex>

        <Box display="flex" w={{ base: '90.5px', md: '181px' }} justifyContent="flex-end">
          <LanguageSwitcher isMobileHeader variant="white" />
        </Box>
      </Flex>
    </Flex>
  )
}
