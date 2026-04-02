import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Flex,
  Image,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftAddon,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Link,
  VStack,
  HStack,
  useMediaQuery,
} from '@chakra-ui/react'
import { AuthSideImage } from '@/features/auth/components/signup/auth-side-image'
import { SearchableSelect } from '@/shared/components/common'
import jalsoochakLogo from '@/assets/media/logo.svg'
import { useAuthStore } from '@/app/store'
import {
  usePublicTenantsQuery,
  useRequestOtpMutation,
  useVerifyOtpMutation,
} from '@/features/section-officer/services/query/use-staff-auth-queries'

const OTP_RESEND_COOLDOWN_SECONDS = 30
const OTP_FALLBACK_LENGTH = 6
const PHONE_NUMBER_LENGTH = 10
const COUNTRY_CODE = '91'

type LoginStep = 'phone' | 'otp'

function maskPhoneNumber(phone: string): string {
  // phone is already full number like "918179020960" - mask middle digits
  const digits = phone.replace(/^\+?91/, '')
  return `+91 ******${digits.slice(-4)}`
}

export function StaffLoginPage() {
  const navigate = useNavigate()
  const { t } = useTranslation('section-officer')
  const { setFromActivation } = useAuthStore()
  const [showBannerImage] = useMediaQuery('(min-width: 992px)')

  const [step, setStep] = useState<LoginStep>('phone')

  // Step 1 state
  const [phoneDigits, setPhoneDigits] = useState('')
  const [tenantCode, setTenantCode] = useState('')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [tenantError, setTenantError] = useState<string | null>(null)

  // Step 2 state
  const [otpLength, setOtpLength] = useState(OTP_FALLBACK_LENGTH)
  const [otpValues, setOtpValues] = useState<string[]>(Array(OTP_FALLBACK_LENGTH).fill(''))
  const [otpError, setOtpError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data: tenants = [], isLoading: tenantsLoading } = usePublicTenantsQuery()
  const requestOtpMutation = useRequestOtpMutation()
  const verifyOtpMutation = useVerifyOtpMutation()

  const tenantOptions = tenants.map((t) => ({
    value: t.stateCode,
    label: t.name,
  }))

  const fullPhoneNumber = `${COUNTRY_CODE}${phoneDigits}`

  const startCooldown = useCallback(() => {
    setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current)
    }
  }, [])

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const resetOtpInputs = useCallback((length: number) => {
    setOtpValues(Array(length).fill(''))
    otpInputRefs.current = Array(length).fill(null)
  }, [])

  const handleSendOtp = async () => {
    setPhoneError(null)
    setTenantError(null)

    if (phoneDigits.length !== PHONE_NUMBER_LENGTH) {
      setPhoneError(t('login.phoneStep.phoneError'))
      return
    }
    if (!/^\d{10}$/.test(phoneDigits)) {
      setPhoneError(t('login.phoneStep.phoneDigitsOnlyError'))
      return
    }
    if (!tenantCode) {
      setTenantError(t('login.phoneStep.stateError'))
      return
    }

    try {
      const result = await requestOtpMutation.mutateAsync({
        phoneNumber: fullPhoneNumber,
        tenantCode,
      })
      const length = result.otpLength ?? OTP_FALLBACK_LENGTH
      setOtpLength(length)
      resetOtpInputs(length)
      setOtpError(null)
      startCooldown()
      setStep('otp')
    } catch {
      setPhoneError(t('login.phoneStep.sendOtpFailed'))
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    try {
      const result = await requestOtpMutation.mutateAsync({
        phoneNumber: fullPhoneNumber,
        tenantCode,
      })
      const length = result.otpLength ?? OTP_FALLBACK_LENGTH
      if (length !== otpLength) {
        setOtpLength(length)
        resetOtpInputs(length)
      } else {
        setOtpValues(Array(length).fill(''))
      }
      setOtpError(null)
      startCooldown()
    } catch {
      setOtpError(t('login.otpStep.resendFailed'))
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const char = value.slice(-1)
    const next = [...otpValues]
    next[index] = char
    setOtpValues(next)
    if (char && index < otpLength - 1) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, otpLength)
    if (!pasted) return
    const next = Array(otpLength).fill('')
    pasted.split('').forEach((ch, i) => {
      next[i] = ch
    })
    setOtpValues(next)
    const lastFilled = Math.min(pasted.length, otpLength - 1)
    otpInputRefs.current[lastFilled]?.focus()
  }

  const handleVerifyOtp = async () => {
    setOtpError(null)
    const otp = otpValues.join('')
    if (otp.length < otpLength) {
      setOtpError(t('login.otpStep.incompleteOtp', { otpLength }))
      return
    }

    try {
      const response = await verifyOtpMutation.mutateAsync({
        phoneNumber: fullPhoneNumber,
        tenantCode,
        otp,
      })
      const redirectPath = setFromActivation(response)
      navigate(redirectPath, { replace: true })
    } catch {
      setOtpError(t('login.otpStep.invalidOtp'))
    }
  }

  const handleBackToPhone = () => {
    setStep('phone')
    setOtpValues(Array(otpLength).fill(''))
    setOtpError(null)
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
              w="117.61px"
              h="72px"
              mb={{ base: 10, md: 12 }}
            />
          </Box>

          <Flex flex="1" align="center" justify="center">
            <Box w="360px">
              {step === 'phone' ? (
                <PhoneStep
                  t={t}
                  phoneDigits={phoneDigits}
                  onPhoneChange={setPhoneDigits}
                  phoneError={phoneError}
                  tenantCode={tenantCode}
                  onTenantChange={setTenantCode}
                  tenantError={tenantError}
                  tenantOptions={tenantOptions}
                  tenantsLoading={tenantsLoading}
                  isLoading={requestOtpMutation.isPending}
                  onSubmit={handleSendOtp}
                />
              ) : (
                <OtpStep
                  t={t}
                  maskedPhone={maskPhoneNumber(fullPhoneNumber)}
                  otpLength={otpLength}
                  otpValues={otpValues}
                  otpInputRefs={otpInputRefs}
                  otpError={otpError}
                  resendCooldown={resendCooldown}
                  isResending={requestOtpMutation.isPending}
                  isVerifying={verifyOtpMutation.isPending}
                  onOtpChange={handleOtpChange}
                  onOtpKeyDown={handleOtpKeyDown}
                  onOtpPaste={handleOtpPaste}
                  onResend={handleResendOtp}
                  onVerify={handleVerifyOtp}
                  onBack={handleBackToPhone}
                />
              )}
            </Box>
          </Flex>
        </Flex>
      </Flex>

      <AuthSideImage isVisible={showBannerImage} />
    </Flex>
  )
}

interface PhoneStepProps {
  t: (key: string, opts?: Record<string, unknown>) => string
  phoneDigits: string
  onPhoneChange: (v: string) => void
  phoneError: string | null
  tenantCode: string
  onTenantChange: (v: string) => void
  tenantError: string | null
  tenantOptions: { value: string; label: string }[]
  tenantsLoading: boolean
  isLoading: boolean
  onSubmit: () => void
}

function PhoneStep({
  t,
  phoneDigits,
  onPhoneChange,
  phoneError,
  tenantCode,
  onTenantChange,
  tenantError,
  tenantOptions,
  tenantsLoading,
  isLoading,
  onSubmit,
}: PhoneStepProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSubmit()
  }

  return (
    <VStack align="stretch" spacing="1.5rem">
      <Box>
        <Text textStyle="h5" fontWeight="600" mb="0.25rem">
          {t('login.heading')}
        </Text>
        <Text textStyle="bodyText5" fontWeight="400" color="neutral.600">
          {t('login.phoneStep.subtitle')}
        </Text>
      </Box>

      <VStack align="stretch" spacing="1rem">
        <FormControl isInvalid={!!phoneError}>
          <FormLabel>
            <Text textStyle="bodyText6" mb="4px">
              {t('login.phoneStep.phoneLabel')}
              <Text as="span" color="error.500">
                {' '}
                *
              </Text>
            </Text>
          </FormLabel>
          <InputGroup h="36px">
            <InputLeftAddon
              h="36px"
              px="12px"
              bg="neutral.50"
              borderColor="neutral.300"
              fontSize="sm"
              color="neutral.700"
              borderRadius="4px 0 0 4px"
            >
              +91
            </InputLeftAddon>
            <Input
              type="tel"
              placeholder={t('login.phoneStep.phonePlaceholder')}
              value={phoneDigits}
              onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
              onKeyDown={handleKeyDown}
              h="36px"
              px="12px"
              py="8px"
              borderRadius="0 4px 4px 0"
              borderColor="neutral.300"
              _placeholder={{ color: 'neutral.300' }}
              fontSize="sm"
              focusBorderColor="primary.500"
              maxLength={10}
              autoComplete="tel-national"
              data-testid="phone-input"
            />
          </InputGroup>
          {phoneError && <FormErrorMessage>{phoneError}</FormErrorMessage>}
        </FormControl>

        <FormControl isInvalid={!!tenantError}>
          <FormLabel>
            <Text textStyle="bodyText6" mb="4px">
              {t('login.phoneStep.stateLabel')}
              <Text as="span" color="error.500">
                {' '}
                *
              </Text>
            </Text>
          </FormLabel>
          <SearchableSelect
            options={tenantOptions}
            value={tenantCode}
            onChange={onTenantChange}
            placeholder={
              tenantsLoading
                ? t('login.phoneStep.stateLoading')
                : t('login.phoneStep.statePlaceholder')
            }
            disabled={tenantsLoading}
            width="100%"
            height="36px"
            borderRadius="4px"
            ariaLabel={t('login.phoneStep.stateLabel')}
            data-testid="tenant-select"
          />
          {tenantError && <FormErrorMessage>{tenantError}</FormErrorMessage>}
        </FormControl>

        <Button
          w="full"
          fontSize="16px"
          fontWeight="600"
          isLoading={isLoading}
          loadingText={t('login.phoneStep.sendingOtp')}
          _loading={{ bg: 'primary.500', color: 'white' }}
          onClick={onSubmit}
          data-testid="send-otp-button"
        >
          {t('login.phoneStep.sendOtp')}
        </Button>
      </VStack>
    </VStack>
  )
}

interface OtpStepProps {
  t: (key: string, opts?: Record<string, unknown>) => string
  maskedPhone: string
  otpLength: number
  otpValues: string[]
  otpInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>
  otpError: string | null
  resendCooldown: number
  isResending: boolean
  isVerifying: boolean
  onOtpChange: (index: number, value: string) => void
  onOtpKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void
  onOtpPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void
  onResend: () => void
  onVerify: () => void
  onBack: () => void
}

function OtpStep({
  t,
  maskedPhone,
  otpLength,
  otpValues,
  otpInputRefs,
  otpError,
  resendCooldown,
  isResending,
  isVerifying,
  onOtpChange,
  onOtpKeyDown,
  onOtpPaste,
  onResend,
  onVerify,
  onBack,
}: OtpStepProps) {
  const isOtpComplete = otpValues.every((v) => v !== '')

  return (
    <VStack align="stretch" spacing="1.5rem">
      <Box>
        <Text textStyle="h5" fontWeight="600" mb="0.25rem">
          {t('login.heading')}
        </Text>
        <Text textStyle="bodyText5" fontWeight="400" color="neutral.600">
          {t('login.otpStep.subtitle', { otpLength, maskedPhone })}
        </Text>
      </Box>

      <VStack align="stretch" spacing="1rem">
        <FormControl isInvalid={!!otpError}>
          <FormLabel>
            <Text textStyle="bodyText6" mb="4px">
              {t('login.otpStep.otpLabel')}
              <Text as="span" color="error.500">
                {' '}
                *
              </Text>
            </Text>
          </FormLabel>
          <HStack spacing="8px" data-testid="otp-inputs">
            {Array.from({ length: otpLength }).map((_, i) => (
              <Input
                key={i}
                ref={(el) => {
                  otpInputRefs.current[i] = el
                }}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={otpValues[i] ?? ''}
                onChange={(e) => onOtpChange(i, e.target.value)}
                onKeyDown={(e) => onOtpKeyDown(i, e)}
                onPaste={i === 0 ? onOtpPaste : undefined}
                w="48px"
                h="48px"
                textAlign="center"
                fontSize="lg"
                fontWeight="medium"
                borderRadius="8px"
                borderColor={otpError ? 'error.500' : 'neutral.300'}
                focusBorderColor={otpError ? 'error.500' : 'primary.500'}
                _placeholder={{ color: 'neutral.300' }}
                placeholder="0"
                autoFocus={i === 0}
                data-testid={`otp-input-${i}`}
              />
            ))}
          </HStack>
          {otpError && <FormErrorMessage>{otpError}</FormErrorMessage>}
        </FormControl>

        <HStack spacing="4px" align="center">
          <Text textStyle="bodyText5" color="neutral.600" fontSize="sm">
            {t('login.otpStep.didNotReceive')}
          </Text>
          {resendCooldown > 0 ? (
            <Text fontSize="sm" color="neutral.400">
              {t('login.otpStep.resendIn', { seconds: resendCooldown })}
            </Text>
          ) : (
            <Link
              as="button"
              type="button"
              fontSize="sm"
              fontWeight="600"
              color="primary.500"
              onClick={onResend}
              opacity={isResending ? 0.5 : 1}
              pointerEvents={isResending ? 'none' : 'auto'}
              data-testid="resend-otp-button"
            >
              {isResending ? t('login.otpStep.sending') : t('login.otpStep.resend')}
            </Link>
          )}
        </HStack>

        <Button
          w="full"
          fontSize="16px"
          fontWeight="600"
          isLoading={isVerifying}
          isDisabled={!isOtpComplete}
          loadingText={t('login.otpStep.loggingIn')}
          _loading={{ bg: 'primary.500', color: 'white' }}
          onClick={onVerify}
          data-testid="login-button"
        >
          {t('login.otpStep.login')}
        </Button>

        <Flex justify="center">
          <Link
            as="button"
            type="button"
            fontSize="sm"
            fontWeight="500"
            color="neutral.600"
            onClick={onBack}
            data-testid="back-button"
          >
            {t('login.otpStep.back')}
          </Link>
        </Flex>
      </VStack>
    </VStack>
  )
}
