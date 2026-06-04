import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Spinner,
  Text,
} from '@chakra-ui/react'
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
        <FormControl>
          <FormLabel>
            <Text textStyle="bodyText6" mb="4px">
              First name
              <Text as="span" color="error.500">
                *
              </Text>
            </Text>
          </FormLabel>
          <Input
            placeholder="Enter"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value.replace(/[^A-Za-z]/g, ''))}
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

        <FormControl>
          <FormLabel>
            <Text textStyle="bodyText6" mb="4px">
              Last name
            </Text>
          </FormLabel>
          <Input
            placeholder="Enter"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value.replace(/[^A-Za-z]/g, ''))}
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
      </Flex>

      <FormControl mb="1.25rem" isInvalid={!isPhoneValid && !!phoneNumber}>
        <FormLabel>
          <Text textStyle="bodyText6" mb="4px">
            Phone Number
            <Text as="span" color="error.500">
              *
            </Text>
          </Text>
        </FormLabel>
        <Input
          type="tel"
          placeholder="+91"
          autoComplete="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
          maxLength={10}
          h="36px"
          px="12px"
          py="8px"
          borderRadius="4px"
          borderColor="neutral.300"
          _placeholder={{ color: 'neutral.300' }}
          fontSize="sm"
          focusBorderColor="primary.500"
        />
        <FormErrorMessage>Phone number must be 10 digits.</FormErrorMessage>
      </FormControl>

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
