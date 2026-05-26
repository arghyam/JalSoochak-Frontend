import { Box, Flex, Image, Text, VStack } from '@chakra-ui/react'
import { LanguageSwitcher } from '@/shared/components/common'
import sealOfAssam from '@/assets/media/Seal_of_Assam.svg'
import jjmLogo from '@/assets/media/jjm_new_logo.svg'

export function Header() {
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
      >
        {/* Left: Assam seal + 3-line department heading */}
        <Flex align="center" gap={{ base: '8px', md: '12px' }} flexShrink={0}>
          <Image
            src={sealOfAssam}
            alt="Government of Assam Seal"
            h={{ base: '44px', sm: '56px', md: '72px' }}
            w="auto"
            objectFit="contain"
            filter="brightness(0) invert(1)"
          />
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
