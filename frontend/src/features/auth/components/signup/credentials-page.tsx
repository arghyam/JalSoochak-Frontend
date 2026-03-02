import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Box, Button, Flex, Spinner, Text } from '@chakra-ui/react'
import { FormInput } from '@/shared/components/common'
import { ROUTES } from '@/shared/constants/routes'
import { authApi, buildUpdateProfileRequest } from '@/features/auth/services/auth-api'
import type { ToastType } from '@/shared/components/common/toast'

type CredentialsPageProps = {
  email: string
  userId: string
  onShowToast: (message: string, type: ToastType) => void
}

type FetchStatus = 'idle' | 'loading' | 'ready' | 'error'

type ProfileForPut = {
  primaryEmail: string
  role: string
  tenantCode?: string
  tenantId?: string
}

const DEFAULT_PROFILE_ROLE = 'stateadmin'

export function CredentialsPage({ email, userId, onShowToast }: CredentialsPageProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>(userId ? 'loading' : 'idle')
  const [fetchError, setFetchError] = useState('')
  const [profile, setProfile] = useState<ProfileForPut | null>(null)

  useEffect(() => {
    if (!userId) {
      setFetchStatus('idle')
      return
    }
    let cancelled = false
    setFetchStatus('loading')
    setFetchError('')
    authApi
      .getUserProfile(userId)
      .then((res) => {
        if (!cancelled) {
          setFirstName(res.firstName ?? '')
          setLastName(res.lastName ?? '')
          setPhoneNumber(res.primaryNumber ?? '')
          setProfile({
            primaryEmail: res.primaryEmail,
            role: res.role,
            ...(res.tenantCode && { tenantCode: res.tenantCode }),
            ...(res.tenantId && { tenantId: res.tenantId }),
          })
          setFetchStatus('ready')
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setFetchStatus('error')
          setFetchError(e instanceof Error ? e.message : 'Failed to load profile.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const isPhoneValid = /^\d{10}$/.test(phoneNumber)
  const canSubmit = Boolean(firstName && isPhoneValid)

  const handleSubmit = useCallback(async () => {
    if (!userId) {
      onShowToast(t('toast.sessionExpired'), 'error')
      return
    }
    setIsSubmitting(true)
    try {
      const primaryEmail = profile?.primaryEmail ?? email
      const role = profile?.role ?? DEFAULT_PROFILE_ROLE
      const body = buildUpdateProfileRequest({
        role,
        firstName,
        lastName,
        primaryEmail,
        primaryNumber: phoneNumber,
      })
      await authApi.updateProfile(userId, body, {
        ...(profile?.tenantCode && { tenantCode: profile.tenantCode }),
        ...(profile?.tenantId && { tenantId: profile.tenantId }),
      })
      onShowToast(t('toast.profileUpdated'), 'success')
      setTimeout(() => navigate(ROUTES.LOGIN), 1500)
    } catch (e) {
      const message = e instanceof Error ? e.message : t('toast.profileUpdateFailed')
      onShowToast(message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }, [userId, firstName, lastName, email, phoneNumber, profile, t, onShowToast, navigate])

  if (userId && fetchStatus === 'loading') {
    return (
      <>
        <Text textStyle="h5" fontWeight="600" mb="0.25rem">
          Profile Details
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

  if (userId && fetchStatus === 'error') {
    return (
      <>
        <Text textStyle="h5" fontWeight="600" mb="0.25rem">
          Profile Details
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
        Profile Details
      </Text>
      <Text textStyle="bodyText5" fontWeight="400" mb="1.25rem">
        Complete your profile information.
      </Text>

      <Flex gap="1rem" mb="1rem">
        <FormInput
          label="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value.replace(/[^A-Za-z]/g, ''))}
          placeholder="Enter"
          isRequired
          labelTextStyle="bodyText6"
          inputProps={{ autoComplete: 'given-name' }}
        />

        <FormInput
          label="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value.replace(/[^A-Za-z]/g, ''))}
          placeholder="Enter"
          labelTextStyle="bodyText6"
          inputProps={{ autoComplete: 'family-name' }}
        />
      </Flex>

      <Box mb="1.25rem">
        <FormInput
          label="Phone Number"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
          placeholder="+91"
          isRequired
          isInvalid={!isPhoneValid && !!phoneNumber}
          errorMessage={
            !isPhoneValid && phoneNumber ? 'Phone number must be 10 digits.' : undefined
          }
          labelTextStyle="bodyText6"
          inputProps={{
            autoComplete: 'tel',
            inputMode: 'numeric',
            pattern: '[0-9]*',
            maxLength: 10,
          }}
        />
      </Box>

      <Button
        w="full"
        fontSize="16px"
        fontWeight="600"
        isDisabled={!canSubmit || isSubmitting}
        isLoading={isSubmitting}
        loadingText="Signing up..."
        _loading={{ bg: 'primary.500', color: 'white' }}
        onClick={handleSubmit}
      >
        Sign up
      </Button>
    </>
  )
}
