import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Checkbox, Flex, List, ListItem, Spinner, Text, VStack } from '@chakra-ui/react'
import { FormInput, AppButton } from '@/shared/components/common'
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

      <VStack align="stretch" spacing="1rem" mb="1rem">
        <FormInput
          label="Email address"
          type="email"
          value={email}
          onChange={() => {}}
          isDisabled
          labelTextStyle="bodyText6"
          inputProps={{ _disabled: { opacity: 1, cursor: 'not-allowed' } }}
        />

        <FormInput
          label="Create password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          isRequired
          labelTextStyle="bodyText6"
          inputProps={{ autoComplete: 'new-password' }}
        />

        <FormInput
          label="Rewrite password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Enter your password"
          isRequired
          isInvalid={!isPasswordMatch && !!confirmPassword}
          errorMessage={!isPasswordMatch && confirmPassword ? 'Passwords do not match.' : undefined}
          labelTextStyle="bodyText6"
          inputProps={{ autoComplete: 'new-password' }}
        />
      </VStack>

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

      <AppButton
        variant="primary"
        size="md"
        w="full"
        mt="1.25rem"
        isDisabled={!canSubmit || isSubmitting}
        isLoading={isSubmitting}
        loadingText="Saving..."
        onClick={handleSubmit}
      >
        Next
      </AppButton>
    </>
  )
}
