import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  List,
  ListItem,
  Spinner,
  Text,
} from '@chakra-ui/react'
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'
import { authApi, buildSetPasswordRequest } from '@/features/auth/services/auth-api'
import { ROUTES } from '@/shared/constants/routes'
import type { ToastType } from '@/shared/components/common/toast'

type CreatePasswordPageProps = {
  onShowToast: (message: string, type: ToastType) => void
}

type FetchState = 'loading' | 'ready' | 'error'

export function CreatePasswordPage({ onShowToast }: CreatePasswordPageProps) {
  const { t } = useTranslation('common')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [fetchState, setFetchState] = useState<FetchState>('loading')
  const [email, setEmail] = useState('')
  const [fetchError, setFetchError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!id) {
      setFetchState('error')
      setFetchError('Invalid or expired invite link.')
      return
    }
    let cancelled = false
    authApi
      .getUserByInviteId(id)
      .then((res) => {
        if (!cancelled) {
          setEmail(res.email)
          setFetchState('ready')
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setFetchState('error')
          setFetchError(e instanceof Error ? e.message : 'Invalid or expired invite link.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password)
  const hasMinLength = password.length >= 8
  const isPasswordValid =
    hasUppercase && hasLowercase && hasNumber && hasSpecialChar && hasMinLength
  const isPasswordMatch = password === confirmPassword
  const canSubmit =
    password.length > 0 && confirmPassword.length > 0 && isPasswordValid && isPasswordMatch

  const handleSubmit = useCallback(async () => {
    if (!id) return
    setIsSubmitting(true)
    try {
      const request = buildSetPasswordRequest({
        userId: id,
        emailId: email,
        newPassword: password,
        confirmPassword,
      })
      await authApi.createPassword(request)
      onShowToast(t('toast.passwordCreated'), 'success')
      setTimeout(() => navigate(ROUTES.CREDENTIALS, { state: { email, userId: id } }), 1500)
    } catch (e) {
      const message = e instanceof Error ? e.message : t('toast.passwordCreateFailed')
      onShowToast(message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }, [id, email, password, confirmPassword, t, onShowToast, navigate])

  if (fetchState === 'loading') {
    return (
      <>
        <Text textStyle="h5" fontWeight="600" mb="0.25rem">
          Sign up
        </Text>
        <Text textStyle="bodyText5" fontWeight="400" mb="1.25rem">
          Loading...
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
          Sign up
        </Text>
        <Text textStyle="bodyText5" color="error.500" mb="1.25rem">
          {fetchError}
        </Text>
      </>
    )
  }

  return (
    <>
      <Text textStyle="h5" fontWeight="600" mb="0.25rem">
        Sign up
      </Text>
      <Text textStyle="bodyText5" fontWeight="400" mb="1.25rem">
        Create a password to proceed further.
      </Text>

      <FormControl mb="1rem">
        <FormLabel>
          <Text textStyle="bodyText6" mb="4px" color="neutral.300">
            Email address
          </Text>
        </FormLabel>
        <Input
          type="email"
          value={email}
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
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              _hover={{ bg: 'transparent' }}
              _active={{ bg: 'transparent' }}
            >
              {showPassword ? <AiOutlineEye size="16px" /> : <AiOutlineEyeInvisible size="16px" />}
            </Button>
          </InputRightElement>
        </InputGroup>
      </FormControl>

      <FormControl mt="1rem" isInvalid={!isPasswordMatch && !!confirmPassword}>
        <FormLabel>
          <Text textStyle="bodyText6" mb="4px">
            Rewrite password
            <Text as="span" color="error.500">
              *
            </Text>
          </Text>
        </FormLabel>
        <InputGroup>
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Enter your password"
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
          <ListItem>Include at least 1 lowercase letter.</ListItem>
          <ListItem>Include at least 1 uppercase letter.</ListItem>
          <ListItem>Include at least 1 number.</ListItem>
          <ListItem>Include at least 1 special character.</ListItem>
          <ListItem>Be at least 8 characters long.</ListItem>
        </List>
      ) : null}

      <Checkbox
        mt="0.75rem"
        isChecked={rememberMe}
        onChange={(e) => setRememberMe(e.target.checked)}
        sx={{
          '.chakra-checkbox__control': {
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'neutral.400',
            borderRadius: '4px',
            overflow: 'hidden',
            _checked: {
              bg: 'primary.500',
              borderColor: 'primary.500',
              color: 'white',
            },
            _hover: {
              bg: 'primary.500',
              borderColor: 'primary.500',
            },
            _focusVisible: {
              boxShadow: 'none',
            },
          },
        }}
      >
        <Text textStyle="bodyText5" color="neutral.950" fontWeight="400">
          Remember me
        </Text>
      </Checkbox>

      <Button
        w="full"
        mt="1.25rem"
        fontSize="16px"
        fontWeight="600"
        isDisabled={!canSubmit || isSubmitting}
        isLoading={isSubmitting}
        loadingText="Saving..."
        _loading={{ bg: 'primary.500', color: 'white' }}
        onClick={handleSubmit}
      >
        Next
      </Button>
    </>
  )
}
