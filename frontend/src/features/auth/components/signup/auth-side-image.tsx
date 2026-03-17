import { Box, Image } from '@chakra-ui/react'
import jalImage from '@/assets/media/jalmain.jpg'

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
      borderTopLeftRadius="60px"
      borderBottomLeftRadius="60px"
    >
      <Image
        src={jalImage}
        alt="Water tap"
        w="100%"
        h="100%"
        objectFit="cover"
        objectPosition="center right"
      />
    </Box>
  )
}
