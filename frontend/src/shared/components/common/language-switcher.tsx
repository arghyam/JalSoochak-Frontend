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
import languageIcon from '@/assets/media/Language icon.svg'
import languageIconWhite from '@/assets/media/Language icon white.svg'

interface LanguageSwitcherProps {
  isMobileHeader?: boolean
  variant?: 'default' | 'white'
}

export function LanguageSwitcher({
  isMobileHeader = false,
  variant = 'default',
}: LanguageSwitcherProps) {
  const { currentLanguage, setLanguage, getSupportedLanguages } = useLanguageStore()
  const supportedLanguages = getSupportedLanguages()
  const iconWidth = { base: '18px', sm: '24px', md: '35px' }
  const iconHeight = { base: '18px', sm: '24px', md: '35px' }
  const buttonSize = { base: '18px', sm: '24px', md: '35px' }

  const handleLanguageChange = (langCode: LanguageCode) => {
    setLanguage(langCode)
  }

  return (
    <Box position="relative" zIndex={isMobileHeader ? 50 : undefined}>
      <Menu placement="bottom-end">
        <MenuButton
          as={Button}
          variant="ghost"
          size="sm"
          aria-label="Change language"
          px={0}
          py={0}
          minW={buttonSize}
          w={buttonSize}
          h={buttonSize}
          bg="transparent"
          borderWidth="0"
          borderRadius="0"
          boxShadow="none"
          _hover={{ bg: 'transparent' }}
          _active={{ bg: 'transparent' }}
        >
          <Flex w="full" h="full" align="center" justify="center">
            <Box w={iconWidth} h={iconHeight} aria-hidden="true">
              <Image
                src={variant === 'white' ? languageIconWhite : languageIcon}
                alt=""
                w={iconWidth}
                h={iconHeight}
              />
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
