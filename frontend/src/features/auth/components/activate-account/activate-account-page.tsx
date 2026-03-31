import { useCallback, useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
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
  List,
  ListItem,
  Spinner,
  Text,
  useMediaQuery,
} from '@chakra-ui/react'
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'
import { authApi } from '@/features/auth/services/auth-api'
import { AuthSideImage } from '@/features/auth/components/signup/auth-side-image'
import { ToastContainer } from '@/shared/components/common'
import { useToast } from '@/shared/hooks/use-toast'
import { useAuthStore } from '@/app/store/auth-store'
import jalsoochakLogo from '@/assets/media/logo.svg'

type FetchState = 'loading' | 'ready' | 'error'
type Step = 'password' | 'profile'

export function AccountActivationPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [showBannerImage] = useMediaQuery('(min-width: 992px)')

  const token = searchParams.get('token') ?? ''

  const setFromActivation = useAuthStore((state) => state.setFromActivation)

  const [fetchState, setFetchState] = useState<FetchState>('loading')
  const [fetchError, setFetchError] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')

  const [step, setStep] = useState<Step>('password')

  // Password step state
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Profile step state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    document.title = 'Activate Account | JalSoochak'
    if (!token) {
      setFetchState('error')
      setFetchError('Invalid or expired invite link.')
      return
    }
    let cancelled = false
    authApi
      .getInviteInfo(token)
      .then((info) => {
        if (!cancelled) {
          setInviteEmail(info.email)
          setFirstName(info.firstName ?? '')
          setLastName(info.lastName ?? '')
          setPhoneNumber(info.phoneNumber ?? '')
          setFetchState('ready')
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setFetchState('error')
          setFetchError(e instanceof Error ? e.message : 'Invalid or expired invite link.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [token])

  // Password validation
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password)
  const hasMinLength = password.length >= 8
  const isPasswordValid =
    hasUppercase && hasLowercase && hasNumber && hasSpecialChar && hasMinLength
  const isPasswordMatch = password === confirmPassword

  const canProceedToProfile =
    password.length > 0 && confirmPassword.length > 0 && isPasswordValid && isPasswordMatch

  const isPhoneValid = /^\d{10}$/.test(phoneNumber)
  const canActivate = firstName.trim() !== '' && lastName.trim() !== '' && isPhoneValid

  const handleNext = () => {
    if (canProceedToProfile) {
      setStep('profile')
    }
  }

  const handleActivate = useCallback(async () => {
    if (!canActivate || isSubmitting) return
    setIsSubmitting(true)
    try {
      const loginResponse = await authApi.activateAccount({
        inviteToken: token,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber,
        password,
      })
      toast.addToast('Account activated successfully.', 'success')
      const redirectPath = setFromActivation(loginResponse)
      setTimeout(() => navigate(redirectPath), 1000)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to activate account.'
      toast.addToast(message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }, [
    canActivate,
    isSubmitting,
    token,
    firstName,
    lastName,
    phoneNumber,
    password,
    toast,
    navigate,
    setFromActivation,
  ])

  const renderContent = () => {
    if (fetchState === 'loading') {
      return (
        <>
          <Text textStyle="h5" fontWeight="600" mb="0.25rem">
            Activate Account
          </Text>
          <Flex justify="center" align="center" py={8}>
            <Spinner size="lg" color="primary.500" />
          </Flex>
        </>
      )
    }

    if (fetchState === 'error') {
      return (
        <>
          <Text textStyle="h5" fontWeight="600" mb="0.25rem">
            Activate Account
          </Text>
          <Text textStyle="bodyText5" color="error.500" mt="0.5rem">
            {fetchError}
          </Text>
        </>
      )
    }

    if (step === 'password') {
      return (
        <>
          <Text textStyle="h5" fontWeight="600" mb="0.25rem">
            Activate Account
          </Text>
          <Text textStyle="bodyText5" fontWeight="400" mb="1.25rem">
            Create a password to proceed.
          </Text>

          <FormControl mb="1rem">
            <FormLabel>
              <Text textStyle="bodyText6" mb="4px" color="neutral.300">
                Email address
              </Text>
            </FormLabel>
            <Input
              type="email"
              value={inviteEmail}
              isDisabled
              h="36px"
              px="12px"
              py="8px"
              borderRadius="4px"
              borderColor="neutral.300"
              fontSize="sm"
              _disabled={{ opacity: 1, cursor: 'not-allowed', textColor: 'neutral.300' }}
            />
          </FormControl>

          <FormControl mt="1rem" mb="1rem">
            <FormLabel>
              <Text textStyle="bodyText6" mb="4px">
                Create password
                <Text as="span" color="error.500">
                  {' '}
                  *
                </Text>
              </Text>
            </FormLabel>
            <InputGroup>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
          </FormControl>

          <FormControl mt="1rem" isInvalid={!isPasswordMatch && !!confirmPassword}>
            <FormLabel>
              <Text textStyle="bodyText6" mb="4px">
                Confirm password
                <Text as="span" color="error.500">
                  {' '}
                  *
                </Text>
              </Text>
            </FormLabel>
            <InputGroup>
              <Input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                  onClick={() => setShowConfirm((p) => !p)}
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  _hover={{ bg: 'transparent' }}
                  _active={{ bg: 'transparent' }}
                >
                  {showConfirm ? (
                    <AiOutlineEye size="16px" />
                  ) : (
                    <AiOutlineEyeInvisible size="16px" />
                  )}
                </Button>
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>Passwords do not match.</FormErrorMessage>
          </FormControl>

          {password.length > 0 && !isPasswordValid ? (
            <List
              mt="0.75rem"
              spacing="0.5px"
              fontSize="sm"
              color="error.500"
              pl="18px"
              styleType="disc"
            >
              {!hasMinLength && <ListItem>Be at least 8 characters long.</ListItem>}
              {!hasUppercase && <ListItem>Include at least 1 uppercase letter.</ListItem>}
              {!hasLowercase && <ListItem>Include at least 1 lowercase letter.</ListItem>}
              {!hasNumber && <ListItem>Include at least 1 number.</ListItem>}
              {!hasSpecialChar && <ListItem>Include at least 1 special character.</ListItem>}
            </List>
          ) : null}

          <Button
            w="full"
            mt="1.25rem"
            fontSize="16px"
            fontWeight="600"
            isDisabled={!canProceedToProfile}
            onClick={handleNext}
          >
            Next
          </Button>
        </>
      )
    }

    return (
      <>
        <Text textStyle="h5" fontWeight="600" mb="0.25rem">
          Complete your profile
        </Text>
        <Text textStyle="bodyText5" fontWeight="400" mb="1.25rem">
          Enter your details to activate your account.
        </Text>

        <FormControl mb="1rem" isRequired>
          <FormLabel textStyle="bodyText6" mb="4px">
            First name
          </FormLabel>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter first name"
            h="36px"
            px="12px"
            py="8px"
            borderRadius="4px"
            borderColor="neutral.300"
            _placeholder={{ color: 'neutral.300' }}
            fontSize="sm"
            focusBorderColor="primary.500"
          />
        </FormControl>

        <FormControl mb="1rem" isRequired>
          <FormLabel textStyle="bodyText6" mb="4px">
            Last name
          </FormLabel>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter last name"
            h="36px"
            px="12px"
            py="8px"
            borderRadius="4px"
            borderColor="neutral.300"
            _placeholder={{ color: 'neutral.300' }}
            fontSize="sm"
            focusBorderColor="primary.500"
          />
        </FormControl>

        <FormControl mb="1rem" isRequired isInvalid={phoneNumber.length > 0 && !isPhoneValid}>
          <FormLabel textStyle="bodyText6" mb="4px">
            Phone number
          </FormLabel>
          <Input
            type="tel"
            value={phoneNumber}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '')
              if (val.length <= 10) setPhoneNumber(val)
            }}
            placeholder="10-digit mobile number"
            inputMode="numeric"
            h="36px"
            px="12px"
            py="8px"
            borderRadius="4px"
            borderColor="neutral.300"
            _placeholder={{ color: 'neutral.300' }}
            fontSize="sm"
            focusBorderColor="primary.500"
          />
          <FormErrorMessage>Enter a valid 10-digit phone number.</FormErrorMessage>
        </FormControl>

        <Button
          variant="ghost"
          size="sm"
          mb="0.75rem"
          onClick={() => setStep('password')}
          color="primary.500"
          pl={0}
          _hover={{ bg: 'transparent', textDecoration: 'underline' }}
        >
          ← Back
        </Button>

        <Button
          w="full"
          fontSize="16px"
          fontWeight="600"
          isDisabled={!canActivate || isSubmitting}
          isLoading={isSubmitting}
          loadingText="Activating..."
          _loading={{ bg: 'primary.500', color: 'white' }}
          onClick={() => void handleActivate()}
        >
          Activate Account
        </Button>
      </>
    )
  }

  return (
    <Flex minH="100vh" w="full" direction={showBannerImage ? 'row' : 'column'}>
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
              w="117.61px"
              h="68.55px"
              mb={{ base: 10, md: 12 }}
            />
          </Box>

          <Flex flex="1" align="center" justify="center">
            <Box w="360px">{renderContent()}</Box>
          </Flex>
        </Flex>
      </Flex>

      <AuthSideImage isVisible={showBannerImage} />

      <ToastContainer
        toasts={toast.toasts}
        onRemove={toast.removeToast}
        position="bottom-left-quarter"
      />
    </Flex>
  )
}
