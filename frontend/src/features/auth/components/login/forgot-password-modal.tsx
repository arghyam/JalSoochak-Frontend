import { useState } from 'react'
import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
  Box,
} from '@chakra-ui/react'
import { HiOutlineMail } from 'react-icons/hi'
import { useTranslation } from 'react-i18next'
import { useForgotPasswordMutation } from '@/features/auth/services/query/use-auth-queries'
import { RecaptchaField } from '@/shared/components/common'
import { useRecaptcha } from '@/shared/hooks'

type ForgotPasswordModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const { t } = useTranslation('auth')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const forgotPasswordMutation = useForgotPasswordMutation()
  const {
    recaptchaRef,
    handleChange: handleCaptchaChange,
    handleExpired: handleCaptchaExpired,
    reset: resetCaptcha,
    satisfied: captchaSatisfied,
    token: captchaToken,
    error: captchaError,
    setError: setCaptchaError,
  } = useRecaptcha()

  const handleClose = () => {
    setEmail('')
    setEmailError('')
    setIsSuccess(false)
    resetCaptcha()
    onClose()
  }

  const handleSendResetLink = () => {
    const trimmedEmail = email.trim()
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)

    if (!trimmedEmail) {
      setEmailError(t('forgotPassword.emailRequired'))
      return
    }

    if (!isEmailValid) {
      setEmailError(t('forgotPassword.invalidEmail'))
      return
    }

    if (!captchaSatisfied) {
      setCaptchaError(t('forgotPassword.captchaRequired'))
      return
    }

    forgotPasswordMutation.mutate(
      { email: trimmedEmail, captchaToken: captchaToken ?? undefined },
      {
        onSuccess: () => {
          setIsSuccess(true)
        },
        onError: (err) => {
          resetCaptcha()
          const message = err instanceof Error ? err.message : t('forgotPassword.sendFailed')
          setEmailError(message)
        },
      }
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered>
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent maxW="408px" borderRadius="12px" p="24px">
        <ModalBody p="0">
          {isSuccess ? (
            <Flex direction="column" align="center" gap="20px">
              <Box
                w="48px"
                h="48px"
                borderRadius="full"
                bg="primary.50"
                border="1px solid"
                borderColor="primary.25"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <HiOutlineMail size="24px" color="var(--chakra-colors-primary-500)" />
              </Box>
              <Text textAlign="center" textStyle="bodyText3">
                {t('forgotPassword.successMessage')}
              </Text>
              <Button variant="primary" w="full" onClick={handleClose}>
                {t('forgotPassword.backToLogin')}
              </Button>
            </Flex>
          ) : (
            <>
              <Flex direction="column" align="center" gap="20px">
                <Box
                  w="48px"
                  h="48px"
                  borderRadius="full"
                  bg="primary.50"
                  border="1px solid"
                  borderColor="primary.25"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <HiOutlineMail size="24px" color="var(--chakra-colors-primary-500)" />
                </Box>
                <Text textAlign="center" textStyle="bodyText3">
                  {t('forgotPassword.instruction')}
                </Text>
              </Flex>

              <FormControl mt="20px" isInvalid={!!emailError}>
                <FormLabel textStyle="bodyText6" mb="4px">
                  {t('forgotPassword.emailLabel')}{' '}
                  <Text as="span" color="error.500">
                    *
                  </Text>
                </FormLabel>
                <Input
                  type="email"
                  placeholder={t('forgotPassword.emailPlaceholder')}
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    if (emailError) setEmailError('')
                  }}
                  h="36px"
                  px="12px"
                  py="8px"
                  borderRadius="4px"
                  borderColor="neutral.300"
                  _placeholder={{ color: 'neutral.300' }}
                  fontSize="sm"
                  focusBorderColor="primary.500"
                />
                <FormErrorMessage>{emailError}</FormErrorMessage>
              </FormControl>

              <Box mt="20px">
                <RecaptchaField
                  ref={recaptchaRef}
                  onChange={handleCaptchaChange}
                  onExpired={handleCaptchaExpired}
                  error={captchaError}
                />
              </Box>

              <Flex mt={emailError ? '0' : '32px'} gap="20px" justify="space-between">
                <Button
                  variant="secondary"
                  w="full"
                  onClick={handleClose}
                  isDisabled={forgotPasswordMutation.isPending}
                >
                  {t('forgotPassword.cancel')}
                </Button>
                <Button
                  variant="primary"
                  w="full"
                  _hover={{ bg: 'primary.600' }}
                  isLoading={forgotPasswordMutation.isPending}
                  onClick={handleSendResetLink}
                >
                  {t('forgotPassword.sendResetLink')}
                </Button>
              </Flex>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
