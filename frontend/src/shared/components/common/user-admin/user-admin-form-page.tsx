import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Heading,
  Link,
  Text,
  Flex,
  SimpleGrid,
  Input,
  Button,
  HStack,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Spinner,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { EditIcon } from '@chakra-ui/icons'
import { Toggle, ToastContainer } from '../index'
import { useToast } from '@/shared/hooks/use-toast'
import { isAlphabeticWithSpaces, exceedsMaxLength } from '@/shared/utils/validation'
import type {
  UserAdminData,
  UserAdminRoutes,
  UserAdminFormPageLabels,
  UserAdminCreateMutation,
  UserAdminUpdateMutation,
  UserAdminStatusMutation,
} from './types'

const MAX_NAME_LENGTH = 25
const MAX_EMAIL_LENGTH = 60

const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
const isValidPhone = (val: string) => /^\d{10}$/.test(val)

// ─── Inner form — only rendered once original is available (edit) or absent (add) ───

interface FormContentProps {
  readonly id: string | undefined
  readonly isEditMode: boolean
  readonly original: UserAdminData | null
  readonly routes: UserAdminRoutes
  readonly labels: UserAdminFormPageLabels
  readonly createMutation: UserAdminCreateMutation
  readonly updateMutation: UserAdminUpdateMutation
  readonly statusMutation: UserAdminStatusMutation
}

function FormContent({
  id,
  isEditMode,
  original,
  routes,
  labels,
  createMutation,
  updateMutation,
  statusMutation,
}: FormContentProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const toast = useToast()

  const [isBusy, setIsBusy] = useState(false)
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
  })
  const createTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (createTimerRef.current !== null) clearTimeout(createTimerRef.current)
      if (updateTimerRef.current !== null) clearTimeout(updateTimerRef.current)
    }
  }, [])

  const [form, setForm] = useState({
    firstName: original?.firstName ?? '',
    lastName: original?.lastName ?? '',
    email: original?.email ?? '',
    phone: original?.phone ?? '',
    status: (original?.status ?? 'active') as 'active' | 'inactive',
  })

  const isNameValid = (name: string) =>
    name.trim() !== '' &&
    !exceedsMaxLength(name, MAX_NAME_LENGTH) &&
    isAlphabeticWithSpaces(name.trim())

  const isFormValid = useMemo(
    () =>
      isNameValid(form.firstName) &&
      isNameValid(form.lastName) &&
      form.email.trim() !== '' &&
      !exceedsMaxLength(form.email, MAX_EMAIL_LENGTH) &&
      isValidEmail(form.email) &&
      form.phone.trim() !== '' &&
      isValidPhone(form.phone),

    [form.firstName, form.lastName, form.email, form.phone]
  )

  const fieldErrors = {
    firstName: (() => {
      if (!touched.firstName) return ''
      if (!form.firstName.trim()) return t('validation.required')
      if (exceedsMaxLength(form.firstName, MAX_NAME_LENGTH))
        return t('validation.maxLength', { max: MAX_NAME_LENGTH })
      if (!isAlphabeticWithSpaces(form.firstName.trim())) return t('validation.alphabeticOnly')
      return ''
    })(),
    lastName: (() => {
      if (!touched.lastName) return ''
      if (!form.lastName.trim()) return t('validation.required')
      if (exceedsMaxLength(form.lastName, MAX_NAME_LENGTH))
        return t('validation.maxLength', { max: MAX_NAME_LENGTH })
      if (!isAlphabeticWithSpaces(form.lastName.trim())) return t('validation.alphabeticOnly')
      return ''
    })(),
    email: (() => {
      if (!touched.email || isEditMode) return ''
      if (!form.email.trim()) return t('validation.required')
      if (exceedsMaxLength(form.email, MAX_EMAIL_LENGTH))
        return t('validation.maxLength', { max: MAX_EMAIL_LENGTH })
      if (!isValidEmail(form.email)) return t('validation.invalidEmail')
      return ''
    })(),
    phone: (() => {
      if (!touched.phone) return ''
      if (!form.phone.trim()) return t('validation.required')
      if (!isValidPhone(form.phone)) return t('validation.invalidPhone')
      return ''
    })(),
  }

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const hasChanges = useMemo(() => {
    if (!isEditMode || !original) return true
    return (
      form.firstName !== original.firstName ||
      form.lastName !== original.lastName ||
      form.phone !== original.phone
    )
  }, [isEditMode, original, form.firstName, form.lastName, form.phone])

  const handleCancel = () => {
    if (isEditMode && id) {
      navigate(routes.view(id))
    } else {
      navigate(routes.list)
    }
  }

  const handleStatusToggle = async () => {
    if (!original || isBusy) return
    const newStatus = form.status === 'active' ? 'inactive' : 'active'
    setIsBusy(true)
    try {
      await statusMutation.mutateAsync({ id: original.id, status: newStatus })
      setForm((prev) => ({ ...prev, status: newStatus }))
      toast.addToast(
        newStatus === 'active'
          ? labels.messages.activatedSuccess
          : labels.messages.deactivatedSuccess,
        'success'
      )
    } catch {
      toast.addToast(labels.messages.failedToUpdateStatus, 'error')
    } finally {
      setIsBusy(false)
    }
  }

  const handleUpdate = async () => {
    if (!hasChanges || !id || isBusy) return
    setIsBusy(true)
    try {
      await updateMutation.mutateAsync({
        id,
        input: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),
        },
      })
      toast.addToast(t('toast.changesSaved'), 'success')
      updateTimerRef.current = setTimeout(() => {
        navigate(routes.view(id))
      }, 500)
    } catch {
      toast.addToast(t('toast.failedToSave'), 'error')
    } finally {
      setIsBusy(false)
    }
  }

  const handleCreate = async () => {
    if (isBusy) return
    setIsBusy(true)
    try {
      const created = await createMutation.mutateAsync({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      })
      if (labels.messages.linkSentFeedback) {
        toast.addToast(labels.messages.linkSentFeedback, 'success')
      } else {
        toast.addToast(labels.messages.itemAdded, 'success')
      }
      createTimerRef.current = setTimeout(() => {
        navigate(routes.view(created.id))
      }, 1000)
    } catch {
      toast.addToast(labels.messages.failedToAdd, 'error')
    } finally {
      setIsBusy(false)
    }
  }

  const handleSubmit = async () => {
    setTouched({ firstName: true, lastName: true, email: true, phone: true })
    if (!isFormValid) {
      toast.addToast(t('toast.fillAllFieldsCorrectly'), 'error')
      return
    }
    if (isEditMode) {
      await handleUpdate()
    } else {
      await handleCreate()
    }
  }

  const title = isEditMode ? labels.editTitle : labels.addTitle
  const breadcrumbLeaf = isEditMode ? labels.breadcrumb.edit : labels.breadcrumb.addNew

  return (
    <Box w="full">
      {/* Page Header */}
      <Box mb={5}>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={2}>
          {title}
        </Heading>
        <Flex as="nav" aria-label="Breadcrumb" gap={2} flexWrap="wrap">
          <Link
            href={routes.list}
            fontSize="14px"
            lineHeight="21px"
            color="neutral.500"
            _hover={{ textDecoration: 'underline' }}
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault()
              navigate(routes.list)
            }}
          >
            {labels.breadcrumb.manage}
          </Link>
          <Text fontSize="14px" lineHeight="21px" color="neutral.500" aria-hidden="true">
            /
          </Text>
          <Text fontSize="14px" lineHeight="21px" color="#26272B" aria-current="page">
            {breadcrumbLeaf}
          </Text>
        </Flex>
      </Box>

      {/* Form Card */}
      <Box
        as="form"
        role="form"
        aria-label={title}
        bg="white"
        borderWidth="0.5px"
        borderColor="neutral.200"
        borderRadius="12px"
        w="full"
        minH={{ base: 'auto', lg: 'calc(100vh - 180px)' }}
        py={6}
        px={{ base: 3, md: 4 }}
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault()
          void handleSubmit()
        }}
      >
        <Flex
          direction="column"
          h="full"
          justify="space-between"
          minH={{ base: 'auto', lg: 'calc(100vh - 232px)' }}
        >
          <Box>
            {/* User Details Section */}
            <Flex justify="space-between" align="flex-start" mb={4}>
              <Heading as="h2" size="h3" fontWeight="400" id="user-details-heading">
                {labels.form.userDetails}
              </Heading>
              {isEditMode && (
                <EditIcon boxSize={5} cursor="not-allowed" color="neutral.400" aria-hidden="true" />
              )}
            </Flex>

            <SimpleGrid
              columns={{ base: 1, lg: 2 }}
              spacing={3}
              aria-labelledby="user-details-heading"
            >
              <FormControl isRequired isInvalid={!!fieldErrors.firstName}>
                <FormLabel textStyle="h10" mb={1}>
                  {labels.form.firstName}
                </FormLabel>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  onBlur={() => handleBlur('firstName')}
                  placeholder={t('enter')}
                  h={9}
                  maxW={{ base: '100%', lg: '486px' }}
                  borderColor="neutral.200"
                  _placeholder={{ color: 'neutral.300' }}
                  aria-required="true"
                />
                {fieldErrors.firstName && (
                  <FormErrorMessage>{fieldErrors.firstName}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isRequired isInvalid={!!fieldErrors.lastName}>
                <FormLabel textStyle="h10" mb={1}>
                  {labels.form.lastName}
                </FormLabel>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  onBlur={() => handleBlur('lastName')}
                  placeholder={t('enter')}
                  h={9}
                  maxW={{ base: '100%', lg: '486px' }}
                  borderColor="neutral.200"
                  _placeholder={{ color: 'neutral.300' }}
                  aria-required="true"
                />
                {fieldErrors.lastName && (
                  <FormErrorMessage>{fieldErrors.lastName}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isRequired isInvalid={!!fieldErrors.email}>
                <FormLabel textStyle="h10" mb={1} color={isEditMode ? 'neutral.400' : undefined}>
                  {labels.form.emailAddress}
                </FormLabel>
                <Input
                  type="email"
                  value={form.email}
                  onChange={
                    isEditMode
                      ? undefined
                      : (e) => setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  onBlur={isEditMode ? undefined : () => handleBlur('email')}
                  isReadOnly={isEditMode}
                  isDisabled={isEditMode}
                  bg={isEditMode ? 'neutral.50' : undefined}
                  color={isEditMode ? 'neutral.400' : undefined}
                  placeholder={isEditMode ? undefined : t('enter')}
                  h={9}
                  maxW={{ base: '100%', lg: '486px' }}
                  borderColor="neutral.200"
                  _placeholder={{ color: 'neutral.300' }}
                  aria-required="true"
                  aria-readonly={isEditMode ? 'true' : undefined}
                />
                {fieldErrors.email && <FormErrorMessage>{fieldErrors.email}</FormErrorMessage>}
              </FormControl>

              <FormControl isRequired isInvalid={!!fieldErrors.phone}>
                <FormLabel textStyle="h10" mb={1}>
                  {labels.form.phoneNumber}
                </FormLabel>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => {
                    const digits = e.target.value.replaceAll(/\D/g, '')
                    if (digits.length <= 10) setForm((prev) => ({ ...prev, phone: digits }))
                  }}
                  onBlur={() => handleBlur('phone')}
                  placeholder="+91"
                  h={9}
                  maxW={{ base: '100%', lg: '486px' }}
                  borderColor="neutral.200"
                  _placeholder={{ color: 'neutral.300' }}
                  aria-required="true"
                  inputMode="numeric"
                />
                {fieldErrors.phone && <FormErrorMessage>{fieldErrors.phone}</FormErrorMessage>}
              </FormControl>
            </SimpleGrid>

            {/* Status toggle — edit mode only */}
            {isEditMode && (
              <Box mt={7}>
                <Heading as="h2" size="h3" fontWeight="400" mb={4} id="status-heading">
                  {labels.form.statusSection}
                </Heading>
                <Flex align="center" gap={2} h={6} aria-labelledby="status-heading">
                  <Text textStyle="h10" id="activated-label">
                    {labels.form.activated}
                  </Text>
                  <Toggle
                    isChecked={form.status === 'active'}
                    onChange={() => void handleStatusToggle()}
                    isDisabled={isBusy}
                    aria-labelledby="activated-label"
                  />
                </Flex>
              </Box>
            )}
          </Box>

          {/* Action Buttons */}
          <HStack
            spacing={3}
            justify={{ base: 'stretch', sm: 'flex-end' }}
            mt={6}
            flexDirection={{ base: 'column-reverse', sm: 'row' }}
          >
            <Button
              variant="secondary"
              size="md"
              width={{ base: 'full', sm: '174px' }}
              onClick={handleCancel}
              isDisabled={isBusy}
            >
              {t('button.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              width={{ base: 'full', sm: 'auto' }}
              maxWidth={{ base: '100%', sm: isEditMode ? '174px' : '310px' }}
              isLoading={isBusy}
              isDisabled={!isFormValid || (isEditMode && !hasChanges)}
            >
              {isEditMode ? t('button.saveChanges') : labels.buttons.addAndSendLink}
            </Button>
          </HStack>
        </Flex>
      </Box>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </Box>
  )
}

// ─── Page component — handles loading/not-found guards ───

export interface UserAdminFormPageProps {
  readonly id?: string
  readonly isEditMode: boolean
  readonly original: UserAdminData | null
  readonly isLoadingOriginal: boolean
  readonly routes: UserAdminRoutes
  readonly labels: UserAdminFormPageLabels
  readonly createMutation: UserAdminCreateMutation
  readonly updateMutation: UserAdminUpdateMutation
  readonly statusMutation: UserAdminStatusMutation
}

export function UserAdminFormPage({
  id,
  isEditMode,
  original,
  isLoadingOriginal,
  routes,
  labels,
  createMutation,
  updateMutation,
  statusMutation,
}: UserAdminFormPageProps) {
  const { t } = useTranslation('common')

  if (isEditMode && isLoadingOriginal) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={5}>
          {labels.editTitle}
        </Heading>
        <Flex role="status" aria-live="polite" align="center" minH="200px" gap={3}>
          <Spinner size="md" color="primary.500" />
          <Text color="neutral.600">{t('loading')}</Text>
        </Flex>
      </Box>
    )
  }

  if (isEditMode && !original) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={5}>
          {labels.editTitle}
        </Heading>
        <Text color="neutral.600" mt={4}>
          {labels.messages.notFound}
        </Text>
      </Box>
    )
  }

  return (
    <FormContent
      key={original?.id ?? 'new'}
      id={id}
      isEditMode={isEditMode}
      original={original}
      routes={routes}
      labels={labels}
      createMutation={createMutation}
      updateMutation={updateMutation}
      statusMutation={statusMutation}
    />
  )
}
