import { Box, Image } from '@chakra-ui/react'
import bannerImage from '@/assets/media/banner.png'

type AuthSideImageProps = {
  isVisible?: boolean
}

export function AuthSideImage({ isVisible = true }: AuthSideImageProps) {
  if (!isVisible) {
    return null
  }

  return (
    <Box
      w="50%"
      h="100vh"
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
