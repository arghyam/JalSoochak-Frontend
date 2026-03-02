import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Flex,
  Image,
  Text,
  Button,
  FormControl,
  FormErrorMessage,
  Checkbox,
  Link,
  useDisclosure,
  VStack,
} from '@chakra-ui/react'
import { FormInput } from '@/shared/components/common'
import { AuthSideImage } from '@/features/auth/components/signup/auth-side-image'
import jalsoochakLogo from '@/assets/media/jalsoochak-logo.svg'
import { useAuthStore } from '@/app/store'
import { ForgotPasswordModal } from '@/features/auth/components/login/forgot-password-modal'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, loading, error } = useAuthStore()
  const { isOpen: isForgotPasswordOpen, onOpen, onClose } = useDisclosure()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const isEmailError =
    localError === 'Email is required.' || localError === 'Enter a valid email address.'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setLocalError('Email is required.')
      return
    }
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
    if (!isEmailValid) {
      setLocalError('Enter a valid email address.')
      return
    }

    try {
      const redirectPath = await login({ email: trimmedEmail, password })
      navigate(redirectPath, { replace: true })
    } catch (err) {
      console.error(err)
      setLocalError('Unable to login. Please try again.')
    }
  }

  return (
    <Flex minH="100vh" w="full" direction={{ base: 'column', md: 'row' }}>
      <Flex
        w={{ base: '100%', md: '50%' }}
        align="stretch"
        justify="flex-start"
        bg="white"
        px={{ base: 10, md: 8 }}
        py={{ base: 10, md: 8 }}
      >
        <Flex w="full" direction="column">
          <Box w="full" maxW="420px">
            <Image
              src={jalsoochakLogo}
              alt="JalSoochak logo"
              w="117.61px"
              h="68.55px"
              mb={{ base: 10, md: 12 }}
            />
          </Box>

          <Flex flex="1" align="center" justify="center">
            <Box w="360px" h="360px">
              <Text textStyle="h5" fontWeight="600" mb="0.25rem">
                Welcome
              </Text>
              <Text textStyle="bodyText5" fontWeight="400" mb="1.25rem">
                Welcome ! Please enter your details.
              </Text>

              <Box as="form" onSubmit={handleSubmit}>
                <VStack align="stretch" spacing="1rem">
                  <FormInput
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    isRequired
                    isInvalid={isEmailError}
                    errorMessage={isEmailError ? (localError ?? undefined) : undefined}
                    labelTextStyle="bodyText6"
                    inputProps={{ autoComplete: 'email' }}
                  />

                  <FormInput
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    isRequired
                    labelTextStyle="bodyText6"
                    inputProps={{ autoComplete: 'current-password' }}
                  />

                  <FormControl isInvalid={!!(error || (localError && !isEmailError))}>
                    <FormErrorMessage>{localError || error}</FormErrorMessage>
                  </FormControl>

                  <Flex align="center" justify="space-between">
                    <Checkbox
                      fontSize="14px"
                      sx={{
                        '.chakra-checkbox__control': {
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: 'neutral.400',
                          borderRadius: '4px',
                          overflow: 'hidden',
                        },
                      }}
                    >
                      <Text textStyle="bodyText5" fontWeight="400" color="neutral.950">
                        Remember me
                      </Text>
                    </Checkbox>

                    <Link
                      as="button"
                      type="button"
                      fontSize="14px"
                      fontWeight="600"
                      color="primary.500"
                      onClick={onOpen}
                    >
                      Forgot password
                    </Link>
                  </Flex>

                  <Button
                    type="submit"
                    w="full"
                    fontSize="16px"
                    fontWeight="600"
                    isLoading={loading}
                    loadingText="Signing in..."
                    _loading={{ bg: 'primary.500', color: 'white' }}
                  >
                    Log in
                  </Button>
                </VStack>
              </Box>
            </Box>
          </Flex>
        </Flex>
      </Flex>

      <AuthSideImage />
      <ForgotPasswordModal isOpen={isForgotPasswordOpen} onClose={onClose} />
    </Flex>
  )
}
