import { Box, Image } from '@chakra-ui/react'
import bannerImage from '@/assets/media/banner.png'

export function AuthSideImage() {
  return (
    <Box
      w={{ base: '100%', md: '50%' }}
      h={{ base: '260px', md: '100vh' }}
      position="relative"
      overflow="hidden"
      display={{ base: 'none', md: 'block' }}
      bg="white"
      borderTopLeftRadius="60px"
      borderBottomLeftRadius="60px"
    >
      <Image
        src={bannerImage}
        alt="JalSoochak banner"
        w="100%"
        h="100%"
        objectFit="cover"
        objectPosition="center"
      />
    </Box>
  )
}
