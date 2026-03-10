import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Heading,
  Flex,
  Stack,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  Button,
} from '@chakra-ui/react'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/app/store'
import { authApi } from '@/features/auth/services/auth-api'
import { useToast } from '@/shared/hooks/use-toast'
import { ToastContainer } from '@/shared/components/common'

interface ChangePasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

type PasswordField = keyof ChangePasswordForm

export function ChangePasswordPage() {
  const { t } = useTranslation('common')
  const user = useAuthStore((state) => state.user)
  const toast = useToast()

  const [form, setForm] = useState<ChangePasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [show, setShow] = useState<Record<PasswordField, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  })
  const [touched, setTouched] = useState<Record<PasswordField, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSubmittingRef = useRef(false)

  useEffect(() => {
    document.title = `${t('changePassword.title')} | JalSoochak`
  }, [t])

  const getErrors = (): Record<PasswordField, string> => {
    const currentPasswordError =
      touched.currentPassword && !form.currentPassword ? t('validation.required') : ''

    let newPasswordError = ''
    if (touched.newPassword && !form.newPassword) {
      newPasswordError = t('validation.required')
    } else if (
      touched.newPassword &&
      form.currentPassword &&
      form.newPassword === form.currentPassword
    ) {
      newPasswordError = t('changePassword.sameAsCurrent')
    }

    let confirmPasswordError = ''
    if (touched.confirmPassword && !form.confirmPassword) {
      confirmPasswordError = t('validation.required')
    } else if (touched.confirmPassword && form.confirmPassword !== form.newPassword) {
      confirmPasswordError = t('changePassword.mismatch')
    }

    return {
      currentPassword: currentPasswordError,
      newPassword: newPasswordError,
      confirmPassword: confirmPasswordError,
    }
  }

  const errors = getErrors()

  const isFormValid =
    form.currentPassword.length > 0 &&
    form.newPassword.length > 0 &&
    form.confirmPassword.length > 0 &&
    form.newPassword === form.confirmPassword &&
    form.newPassword !== form.currentPassword

  const toggleShow = (field: PasswordField) => {
    setShow((p) => ({ ...p, [field]: !p[field] }))
  }

  const handleBlur = (field: PasswordField) => {
    setTouched((p) => ({ ...p, [field]: true }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ currentPassword: true, newPassword: true, confirmPassword: true })
    if (!isFormValid || !user) return
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true

    setIsSubmitting(true)
    try {
      await authApi.changePassword(user.id, {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      })
      toast.addToast(t('changePassword.success'), 'success')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTouched({ currentPassword: false, newPassword: false, confirmPassword: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : t('changePassword.failed')
      toast.addToast(message, 'error')
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <Box w="full">
      <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={5}>
        {t('changePassword.title')}
      </Heading>

      <Box
        bg="white"
        borderWidth="0.5px"
        borderColor="neutral.200"
        borderRadius="12px"
        w="full"
        minH={{ base: 'auto', lg: 'calc(100vh - 180px)' }}
        py={6}
        px={{ base: 3, md: 4 }}
      >
        <Box
          as="form"
          role="form"
          aria-label={t('changePassword.title')}
          onSubmit={(e: React.FormEvent) => void handleSubmit(e)}
          maxW="md"
        >
          <Stack spacing={5} mb={8}>
            <FormControl isRequired isInvalid={!!errors.currentPassword}>
              <FormLabel textStyle="h10" mb={1}>
                {t('changePassword.currentPassword')}
              </FormLabel>
              <InputGroup>
                <Input
                  type={show.currentPassword ? 'text' : 'password'}
                  value={form.currentPassword}
                  onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
                  onBlur={() => handleBlur('currentPassword')}
                  h={9}
                  borderColor="neutral.200"
                />
                <InputRightElement h={9}>
                  <IconButton
                    aria-label={
                      show.currentPassword
                        ? t('changePassword.hidePassword')
                        : t('changePassword.showPassword')
                    }
                    icon={show.currentPassword ? <ViewOffIcon /> : <ViewIcon />}
                    variant="ghost"
                    size="xs"
                    onClick={() => toggleShow('currentPassword')}
                  />
                </InputRightElement>
              </InputGroup>
              {errors.currentPassword && (
                <FormErrorMessage>{errors.currentPassword}</FormErrorMessage>
              )}
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.newPassword}>
              <FormLabel textStyle="h10" mb={1}>
                {t('changePassword.newPassword')}
              </FormLabel>
              <InputGroup>
                <Input
                  type={show.newPassword ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
                  onBlur={() => handleBlur('newPassword')}
                  h={9}
                  borderColor="neutral.200"
                />
                <InputRightElement h={9}>
                  <IconButton
                    aria-label={
                      show.newPassword
                        ? t('changePassword.hidePassword')
                        : t('changePassword.showPassword')
                    }
                    icon={show.newPassword ? <ViewOffIcon /> : <ViewIcon />}
                    variant="ghost"
                    size="xs"
                    onClick={() => toggleShow('newPassword')}
                  />
                </InputRightElement>
              </InputGroup>
              {errors.newPassword && <FormErrorMessage>{errors.newPassword}</FormErrorMessage>}
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.confirmPassword}>
              <FormLabel textStyle="h10" mb={1}>
                {t('changePassword.confirmPassword')}
              </FormLabel>
              <InputGroup>
                <Input
                  type={show.confirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  onBlur={() => handleBlur('confirmPassword')}
                  h={9}
                  borderColor="neutral.200"
                />
                <InputRightElement h={9}>
                  <IconButton
                    aria-label={
                      show.confirmPassword
                        ? t('changePassword.hidePassword')
                        : t('changePassword.showPassword')
                    }
                    icon={show.confirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                    variant="ghost"
                    size="xs"
                    onClick={() => toggleShow('confirmPassword')}
                  />
                </InputRightElement>
              </InputGroup>
              {errors.confirmPassword && (
                <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
              )}
            </FormControl>
          </Stack>

          <Flex justify="flex-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              width={{ base: 'full', sm: 'auto' }}
              isLoading={isSubmitting}
              isDisabled={!isFormValid}
            >
              {t('changePassword.submit')}
            </Button>
          </Flex>
        </Box>
      </Box>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </Box>
  )
}
