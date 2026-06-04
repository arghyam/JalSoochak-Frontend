import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Flex,
  Image,
  Text,
  Button,
  Input,
  InputGroup,
  InputRightElement,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Link,
  useDisclosure,
  useMediaQuery,
  VStack,
  Alert,
  AlertIcon,
  AlertDescription,
} from '@chakra-ui/react'
import { AuthSideImage } from '@/features/auth/components/signup/auth-side-image'
import jalsoochakLogo from '@/assets/media/logo.svg'
import { useAuthStore } from '@/app/store'
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'
import { ForgotPasswordModal } from '@/features/auth/components/login/forgot-password-modal'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

type LoginLocationState = { passwordChanged?: boolean } | null

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required.').email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const locationState = useLocation().state as LoginLocationState
  const { login } = useAuthStore()
  const { isOpen: isForgotPasswordOpen, onOpen, onClose } = useDisclosure()
  const [showBannerImage] = useMediaQuery('(min-width: 992px)')
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const redirectPath = await login(values)
      navigate(redirectPath, { replace: true })
    } catch {
      setError('root', { message: t('login.loginFailed') })
    }
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
              w={{ base: '60px', md: '117.61px' }}
              h="72px"
              mb={{ base: 10, md: 12 }}
            />
          </Box>

          <Flex flex="1" align="center" justify="center">
            <Box w="360px" h="360px">
              <Text textStyle="h5" fontWeight="600" mb="0.25rem">
                {t('login.title')}
              </Text>
              <Text textStyle="bodyText5" fontWeight="400" mb="1.25rem">
                {t('login.subtitle')}
              </Text>

              {locationState?.passwordChanged && (
                <Alert status="success" borderRadius="4px" mb="1rem">
                  <AlertIcon />
                  <AlertDescription fontSize="sm">
                    {t('login.passwordUpdatedAlert')}
                  </AlertDescription>
                </Alert>
              )}

              <Box as="form" noValidate onSubmit={handleSubmit(onSubmit)}>
                <VStack align="stretch" spacing="1rem">
                  <FormControl isInvalid={!!errors.email}>
                    <FormLabel>
                      <Text textStyle="bodyText6" mb="4px">
                        {t('login.emailLabel')}
                        <Text as="span" color="error.500">
                          {' '}
                          *
                        </Text>
                      </Text>
                    </FormLabel>
                    <Input
                      type="email"
                      placeholder={t('login.emailPlaceholder')}
                      autoComplete="email"
                      h="36px"
                      px="12px"
                      py="8px"
                      borderRadius="4px"
                      borderColor="neutral.300"
                      _placeholder={{ color: 'neutral.300' }}
                      fontSize="sm"
                      focusBorderColor="primary.500"
                      {...register('email')}
                    />
                    <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.password}>
                    <FormLabel>
                      <Text textStyle="bodyText6" mb="4px">
                        {t('login.passwordLabel')}
                        <Text as="span" color="error.500">
                          {' '}
                          *
                        </Text>
                      </Text>
                    </FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('login.passwordPlaceholder')}
                        autoComplete="current-password"
                        h="36px"
                        px="12px"
                        py="8px"
                        borderRadius="4px"
                        borderColor="neutral.300"
                        _placeholder={{ color: 'neutral.300' }}
                        fontSize="sm"
                        focusBorderColor="primary.500"
                        pr="36px"
                        {...register('password')}
                      />
                      <InputRightElement h="36px">
                        <Button
                          variant="unstyled"
                          size="sm"
                          color="neutral.400"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={
                            showPassword ? t('login.hidePassword') : t('login.showPassword')
                          }
                          _hover={{ bg: 'transparent' }}
                          _active={{ bg: 'transparent' }}
                        >
                          {showPassword ? (
                            <AiOutlineEye size="16px" />
                          ) : (
                            <AiOutlineEyeInvisible size="16px" />
                          )}
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
                  </FormControl>

                  <Flex justify="flex-start" mt="-4px" mb="4px">
                    <Link
                      as="button"
                      type="button"
                      fontSize="14px"
                      fontWeight="600"
                      color="primary.500"
                      onClick={onOpen}
                    >
                      {t('login.forgotPassword')}
                    </Link>
                  </Flex>

                  <Button
                    type="submit"
                    w="full"
                    fontSize="16px"
                    fontWeight="600"
                    isLoading={isSubmitting}
                    loadingText={t('login.loadingText')}
                    _loading={{ bg: 'primary.500', color: 'white' }}
                  >
                    {t('login.submitButton')}
                  </Button>

                  {errors.root?.message && (
                    <FormControl isInvalid>
                      <FormErrorMessage>{errors.root.message}</FormErrorMessage>
                    </FormControl>
                  )}
                </VStack>
              </Box>
            </Box>
          </Flex>
        </Flex>
      </Flex>

      <AuthSideImage isVisible={showBannerImage} />
      <ForgotPasswordModal isOpen={isForgotPasswordOpen} onClose={onClose} />
    </Flex>
  )
}
