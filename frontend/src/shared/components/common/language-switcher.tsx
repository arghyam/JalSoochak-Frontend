import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  Flex,
  Image,
} from '@chakra-ui/react'
import { useLanguageStore } from '@/app/store'
import type { LanguageCode } from '@/app/i18n'
import localLogo from '@/assets/media/locallogo.svg'

interface LanguageSwitcherProps {
  isMobileHeader?: boolean
}

export function LanguageSwitcher({ isMobileHeader = false }: LanguageSwitcherProps) {
  const { currentLanguage, setLanguage, getSupportedLanguages } = useLanguageStore()
  const supportedLanguages = getSupportedLanguages()

  const handleLanguageChange = (langCode: LanguageCode) => {
    setLanguage(langCode)
  }

  return (
    <Box
      position={isMobileHeader ? 'relative' : 'fixed'}
      top={isMobileHeader ? 'auto' : 2}
      right={isMobileHeader ? 'auto' : { base: 4, lg: 12 }}
      zIndex={50}
    >
      <Menu placement="bottom-end">
        <MenuButton
          as={Button}
          variant="ghost"
          size="sm"
          aria-label="Change language"
          px={0}
          py={0}
          minW="40px"
          w="40px"
          h="40px"
          bg="transparent"
          borderWidth="0"
          borderRadius="0"
          boxShadow="none"
          _hover={{ bg: 'transparent' }}
          _active={{ bg: 'transparent' }}
        >
          <Flex w="full" h="full" align="center" justify="center">
            <Box position="relative" w="28px" h="29px" aria-hidden="true">
              <Image src={localLogo} alt="" w="48px" h="48px" />
              <Text
                position="absolute"
                top="70%"
                left="25%"
                fontSize="11px"
                fontWeight="700"
                lineHeight="1"
                color="primary.500"
                transform="translate(-50%, -50%)"
              >
                E
              </Text>
              <Text
                position="absolute"
                top="95%"
                left="75%"
                fontSize="10px"
                fontWeight="700"
                lineHeight="1"
                color="primary.500"
                transform="translate(-50%, -50%)"
              >
                हि
              </Text>
            </Box>
          </Flex>
        </MenuButton>
        <MenuList minW="140px" py={1} borderRadius="8px" boxShadow="md" borderColor="neutral.200">
          {supportedLanguages.map((lang) => (
            <MenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              bg={currentLanguage === lang.code ? 'primary.25' : 'transparent'}
              color={currentLanguage === lang.code ? 'primary.600' : 'neutral.700'}
              _hover={{ bg: currentLanguage === lang.code ? 'primary.50' : 'neutral.50' }}
              fontSize="14px"
              py={2}
            >
              <Flex justify="space-between" align="center" w="full">
                <Text>{lang.name}</Text>
                <Text fontSize="12px" color="neutral.500">
                  {lang.nativeName}
                </Text>
              </Flex>
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </Box>
  )
}
