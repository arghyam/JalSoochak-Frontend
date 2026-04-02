import { useState, type FormEvent } from 'react'
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  useMediaQuery,
} from '@chakra-ui/react'
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'
import { useSearchParams, useNavigate } from 'react-router-dom'
import jalsoochakLogo from '@/assets/media/logo.svg'
import { AuthSideImage } from '@/features/auth/components/signup/auth-side-image'
import { useResetPasswordMutation } from '@/features/auth/services/query/use-auth-queries'
import { ROUTES } from '@/shared/constants/routes'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [showBannerImage] = useMediaQuery('(min-width: 992px)')
  const token = searchParams.get('token') ?? ''

  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [apiError, setApiError] = useState('')

  const resetPasswordMutation = useResetPasswordMutation()

  const isPasswordMatch = newPassword === confirmPassword
  const canSubmit =
    newPassword.trim().length > 0 && confirmPassword.trim().length > 0 && isPasswordMatch

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!isPasswordMatch) {
      setConfirmError('Passwords do not match.')
      return
    }
    setApiError('')

    resetPasswordMutation.mutate(
      { token, newPassword: newPassword.trim() },
      {
        onSuccess: () => {
          void navigate(ROUTES.LOGIN, { state: { passwordReset: true } })
        },
        onError: (err) => {
          const message = err instanceof Error ? err.message : 'Failed to reset password.'
          setApiError(message)
        },
      }
    )
  }

  if (!token) {
    return (
      <Flex minH="100vh" w="full" direction={showBannerImage ? 'row' : 'column'}>
        <Flex
          w={showBannerImage ? '50%' : '100%'}
          align="center"
          justify="center"
          bg="white"
          px={{ base: 10, md: 8 }}
          py={{ base: 10, md: 8 }}
        >
          <Box w="360px" textAlign="center">
            <Image
              src={jalsoochakLogo}
              alt="JalSoochak logo"
              h="72px"
              w="117.61px"
              mb={8}
              mx="auto"
            />
            <Text textStyle="h5" mb={3} color="error.500">
              Invalid Reset Link
            </Text>
            <Text textStyle="bodyText5" color="neutral.600" mb={6}>
              This reset link is invalid or has expired. Please request a new one.
            </Text>
            <Button variant="primary" w="full" onClick={() => void navigate(ROUTES.LOGIN)}>
              Back to Login
            </Button>
          </Box>
        </Flex>
        <AuthSideImage isVisible={showBannerImage} />
      </Flex>
    )
  }

  return (
    <Flex minH="100vh" w="full" direction={{ base: 'column', md: 'row' }} bg="white">
      <Flex
        w={showBannerImage ? '50%' : '100%'}
        minH="100vh"
        align="stretch"
        justify="flex-start"
        bg="white"
        px={{ base: 10, md: 8 }}
        py={{ base: 10, md: 8 }}
      >
        <Flex w="full" minH="full" direction="column">
          <Box w="full" maxW="420px">
            <Image
              src={jalsoochakLogo}
              alt="JalSoochak logo"
              h="72px"
              w="117.61px"
              mb={{ base: 10, md: 12 }}
            />
          </Box>

          <Flex flex="1" align="center" justify="center">
            <Box w="360px">
              <Text textStyle="h5" mb={3}>
                Reset password
              </Text>

              <Box as="form" onSubmit={handleSubmit}>
                <Flex direction="column" gap="1.5rem">
                  <FormControl isRequired isInvalid={showConfirmPassword && !!confirmError}>
                    <FormLabel textStyle="bodyText6" mb="4px">
                      New password{' '}
                      <Text as="span" color="error.500">
                        *
                      </Text>
                    </FormLabel>
                    <InputGroup>
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        h="36px"
                        px="12px"
                        py="8px"
                        borderRadius="4px"
                        borderColor="neutral.300"
                        _placeholder={{ color: 'neutral.300' }}
                        fontSize="sm"
                        focusBorderColor="primary.500"
                        pr="36px"
                      />
                      <InputRightElement h="36px">
                        <Button
                          variant="unstyled"
                          size="sm"
                          color="neutral.400"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                          _hover={{ bg: 'transparent' }}
                          _active={{ bg: 'transparent' }}
                        >
                          {showNewPassword ? (
                            <AiOutlineEye size="16px" />
                          ) : (
                            <AiOutlineEyeInvisible size="16px" />
                          )}
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <FormControl isRequired isInvalid={!!confirmError}>
                    <FormLabel textStyle="bodyText6" mb="4px">
                      Confirm new password{' '}
                      <Text as="span" color="error.500">
                        *
                      </Text>
                    </FormLabel>
                    <InputGroup>
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value)
                          if (confirmError) setConfirmError('')
                        }}
                        h="36px"
                        px="12px"
                        py="8px"
                        borderRadius="4px"
                        borderColor="neutral.300"
                        _placeholder={{ color: 'neutral.300' }}
                        fontSize="sm"
                        focusBorderColor="primary.500"
                        pr="36px"
                      />
                      <InputRightElement h="36px">
                        <Button
                          variant="unstyled"
                          size="sm"
                          color="neutral.400"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          _hover={{ bg: 'transparent' }}
                          _active={{ bg: 'transparent' }}
                        >
                          {showConfirmPassword ? (
                            <AiOutlineEye size="16px" />
                          ) : (
                            <AiOutlineEyeInvisible size="16px" />
                          )}
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                    {confirmError && <FormErrorMessage>{confirmError}</FormErrorMessage>}
                  </FormControl>

                  {!isPasswordMatch && confirmPassword && !confirmError ? (
                    <Text mt="-8px" fontSize="sm" color="error.500">
                      Passwords do not match.
                    </Text>
                  ) : null}

                  {apiError && (
                    <Text fontSize="sm" color="error.500">
                      {apiError}
                    </Text>
                  )}

                  <Button
                    type="submit"
                    w="full"
                    fontSize="16px"
                    fontWeight="600"
                    isDisabled={!canSubmit || resetPasswordMutation.isPending}
                    isLoading={resetPasswordMutation.isPending}
                    loadingText="Resetting..."
                    _loading={{ bg: 'primary.500', color: 'white' }}
                  >
                    Reset Password
                  </Button>
                </Flex>
              </Box>
            </Box>
          </Flex>
        </Flex>
      </Flex>

      <AuthSideImage isVisible={showBannerImage} />
    </Flex>
  )
}
