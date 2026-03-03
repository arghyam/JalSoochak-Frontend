import { Box, Flex, Text, Image } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import jalsoochakLogo from '@/assets/media/jalsoochak-logo.svg'
import { LanguageSwitcher } from '@/shared/components/common'

export function Header() {
  const { t } = useTranslation(['dashboard', 'common'])

  return (
    <Flex as="header" borderBottomWidth="1px" bg="white" boxShadow="sm" mb="28px">
      <Flex
        w="full"
        maxW="100%"
        align="center"
        px={{ base: '16px', md: '40px', lg: '80px' }}
        py={{ base: '12px', md: '12px' }}
        direction="row"
        gap={{ base: 3, md: 0 }}
      >
        <Flex align="center" flexShrink={0}>
          <Image
            src={jalsoochakLogo}
            alt={t('sidebar.logoAlt', 'JalSoochak logo')}
            w={{ base: '70px', md: '117.61px' }}
            h={{ base: '40px', md: '68.55px' }}
          />
        </Flex>

        <Flex flex="1" justify="center" w="full">
          <Text
            textStyle="h6"
            color="primary.500"
            textAlign="center"
            fontSize={{ base: '16px', md: '24px' }}
            lineHeight={{ base: 'short', md: 'normal' }}
            whiteSpace={{ base: 'nowrap', md: 'normal' }}
          >
            {t('headerTitle', { ns: 'dashboard', defaultValue: 'JalSoochak Dashboard' })}
          </Text>
        </Flex>

        <Box display="flex" w={{ base: '70px', md: '117.61px' }} justifyContent="flex-end">
          <LanguageSwitcher isMobileHeader />
        </Box>
      </Flex>
    </Flex>
  )
}
