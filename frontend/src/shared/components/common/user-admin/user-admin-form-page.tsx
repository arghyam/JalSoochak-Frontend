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
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Toggle, ToastContainer, ActionTooltip } from '../index'
import { PageHeader } from '../page-header'
import { useToast } from '@/shared/hooks/use-toast'
import { isAlphabeticWithSpaces } from '@/shared/utils/validation'
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

interface UserAdminFormValues {
  firstName: string
  lastName: string
  email: string
  phone: string
  status: 'active' | 'inactive'
}

export interface UserAdminFormConfig {
  readonly id?: string
  readonly isEditMode: boolean
  readonly original: UserAdminData | null
  readonly isLoadingOriginal: boolean
}

export interface UserAdminFormActions {
  readonly createMutation: UserAdminCreateMutation
  readonly updateMutation: UserAdminUpdateMutation
  readonly statusMutation: UserAdminStatusMutation
}

// ─── Inner form — only rendered once original is available (edit) or absent (add) ───

interface FormContentProps {
  readonly config: UserAdminFormConfig
  readonly actions: UserAdminFormActions
  readonly routes: UserAdminRoutes
  readonly labels: UserAdminFormPageLabels
}

function FormContent({ config, actions, routes, labels }: FormContentProps) {
  const { id, isEditMode, original } = config
  const { createMutation, updateMutation, statusMutation } = actions

  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const toast = useToast()
  const createTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isStatusBusy, setIsStatusBusy] = useState(false)

  useEffect(() => {
    const timer = createTimerRef.current
    return () => {
      if (timer !== null) clearTimeout(timer)
    }
  }, [])

  const schema = useMemo(
    () =>
      z.object({
        firstName: z
          .string()
          .refine((v) => v.trim().length > 0, t('validation.required'))
          .refine(
            (v) => v.length <= MAX_NAME_LENGTH,
            t('validation.maxLength', { max: MAX_NAME_LENGTH })
          )
          .refine((v) => isAlphabeticWithSpaces(v.trim()), t('validation.alphabeticOnly')),
        lastName: z
          .string()
          .refine((v) => v.trim().length > 0, t('validation.required'))
          .refine(
            (v) => v.length <= MAX_NAME_LENGTH,
            t('validation.maxLength', { max: MAX_NAME_LENGTH })
          )
          .refine((v) => isAlphabeticWithSpaces(v.trim()), t('validation.alphabeticOnly')),
        email: z
          .string()
          .refine((v) => v.trim().length > 0, t('validation.required'))
          .refine(
            (v) => v.length <= MAX_EMAIL_LENGTH,
            t('validation.maxLength', { max: MAX_EMAIL_LENGTH })
          )
          .refine(isValidEmail, t('validation.invalidEmail')),
        phone: z
          .string()
          .refine((v) => v.trim().length > 0, t('validation.required'))
          .refine(isValidPhone, t('validation.invalidPhone')),
        status: z.enum(['active', 'inactive'] as const),
      }),
    [t]
  )

  const isPendingRegistration = original?.status === 'pending'

  const initialStatus: 'active' | 'inactive' =
    !original || original.status === 'pending' ? 'active' : original.status

  const {
    register,
    handleSubmit: rhfHandleSubmit,
    formState: { errors, isSubmitting, touchedFields, isSubmitted },
    reset,
    setValue,
    getValues,
    watch,
  } = useForm<UserAdminFormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      firstName: original?.firstName ?? '',
      lastName: original?.lastName ?? '',
      email: original?.email ?? '',
      phone: original?.phone ?? '',
      status: initialStatus,
    },
  })

  useEffect(() => {
    if (original) {
      reset({
        firstName: original.firstName,
        lastName: original.lastName,
        email: original.email,
        phone: original.phone,
        status: original.status === 'pending' ? 'active' : original.status,
      })
    }
  }, [original, reset])

  // Watch only the fields needed for synchronous button-state computation
  const [wFirstName, wLastName, wEmail, wPhone, wStatus] = watch([
    'firstName',
    'lastName',
    'email',
    'phone',
    'status',
  ])

  const isNameValid = (name: string) =>
    name.trim().length > 0 && name.length <= MAX_NAME_LENGTH && isAlphabeticWithSpaces(name.trim())

  // Synchronous validity check (mirrors original isFormValid) — used for button disabled state
  const isFormValid = useMemo(
    () =>
      isNameValid(wFirstName) &&
      isNameValid(wLastName) &&
      wEmail.trim().length > 0 &&
      wEmail.length <= MAX_EMAIL_LENGTH &&
      isValidEmail(wEmail) &&
      wPhone.trim().length > 0 &&
      isValidPhone(wPhone),

    [wFirstName, wLastName, wEmail, wPhone]
  )

  // Synchronous change detection (mirrors original hasChanges) — only profile fields, not status
  const hasChanges = useMemo(() => {
    if (!isEditMode || !original) return true
    return (
      wFirstName !== original.firstName ||
      wLastName !== original.lastName ||
      wPhone !== original.phone
    )
  }, [isEditMode, original, wFirstName, wLastName, wPhone])

  // Show a field's error after the user has blurred it OR after a submit attempt
  const showErr = (field: keyof typeof touchedFields) =>
    ((touchedFields[field] as boolean | undefined) ?? false) || isSubmitted

  const handleCancel = () => {
    if (isEditMode && id) {
      navigate(routes.view(id))
    } else {
      navigate(routes.list)
    }
  }

  const handleStatusToggle = async () => {
    if (!original || isStatusBusy) return
    const currentStatus = getValues('status')
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    setIsStatusBusy(true)
    try {
      await statusMutation.mutateAsync({ id: original.id, status: newStatus })
      setValue('status', newStatus)
      toast.addToast(
        newStatus === 'active'
          ? labels.messages.activatedSuccess
          : labels.messages.deactivatedSuccess,
        'success'
      )
    } catch {
      toast.addToast(labels.messages.failedToUpdateStatus, 'error')
    } finally {
      setIsStatusBusy(false)
    }
  }

  const onSubmit = async (data: UserAdminFormValues) => {
    if (isEditMode) {
      if (!id) return
      try {
        await updateMutation.mutateAsync({
          id,
          input: {
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            phone: data.phone.trim(),
          },
        })
        navigate(routes.view(id), { state: { successToast: t('toast.changesSaved') } })
      } catch {
        toast.addToast(t('toast.failedToSave'), 'error')
      }
    } else {
      try {
        const created = await createMutation.mutateAsync({
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email.trim(),
          phone: data.phone.trim(),
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
      }
    }
  }

  const onInvalid = () => {
    toast.addToast(t('toast.fillAllFieldsCorrectly'), 'error')
  }

  // Phone: preserve digit-only filtering while honouring RHF's ref + onBlur
  const {
    ref: phoneRef,
    name: phoneName,
    onBlur: phoneOnBlur,
    onChange: phoneOnChange,
  } = register('phone')

  const title = isEditMode ? labels.editTitle : labels.addTitle
  const breadcrumbLeaf = isEditMode ? labels.breadcrumb.edit : labels.breadcrumb.addNew

  return (
    <Box w="full">
      <PageHeader>
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
      </PageHeader>

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
          void rhfHandleSubmit(onSubmit, onInvalid)(e)
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
                <EditIcon boxSize={5} cursor="not-allowed" color="neutral.950" aria-hidden="true" />
              )}
            </Flex>

            <SimpleGrid
              columns={{ base: 1, lg: 2 }}
              spacing={3}
              aria-labelledby="user-details-heading"
            >
              <FormControl isRequired isInvalid={!!(showErr('firstName') && errors.firstName)}>
                <FormLabel textStyle="h10" mb={1}>
                  {labels.form.firstName}
                </FormLabel>
                <Input
                  {...register('firstName')}
                  placeholder={t('enter')}
                  h={9}
                  maxW={{ base: '100%', lg: '486px' }}
                  borderColor="neutral.200"
                  _placeholder={{ color: 'neutral.300' }}
                  aria-required="true"
                />
                {showErr('firstName') && errors.firstName && (
                  <FormErrorMessage>{errors.firstName.message}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isRequired isInvalid={!!(showErr('lastName') && errors.lastName)}>
                <FormLabel textStyle="h10" mb={1}>
                  {labels.form.lastName}
                </FormLabel>
                <Input
                  {...register('lastName')}
                  placeholder={t('enter')}
                  h={9}
                  maxW={{ base: '100%', lg: '486px' }}
                  borderColor="neutral.200"
                  _placeholder={{ color: 'neutral.300' }}
                  aria-required="true"
                />
                {showErr('lastName') && errors.lastName && (
                  <FormErrorMessage>{errors.lastName.message}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl
                isRequired
                isInvalid={!isEditMode && !!(showErr('email') && errors.email)}
              >
                <FormLabel textStyle="h10" mb={1} color={isEditMode ? 'neutral.400' : undefined}>
                  {labels.form.emailAddress}
                </FormLabel>
                <Input
                  {...register('email')}
                  type="email"
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
                {!isEditMode && showErr('email') && errors.email && (
                  <FormErrorMessage>{errors.email.message}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isRequired isInvalid={!!(showErr('phone') && errors.phone)}>
                <FormLabel textStyle="h10" mb={1}>
                  {labels.form.phoneNumber}
                </FormLabel>
                <Input
                  ref={phoneRef}
                  name={phoneName}
                  onBlur={phoneOnBlur}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const digits = e.target.value.replaceAll(/\D/g, '')
                    if (digits.length <= 10) {
                      e.target.value = digits
                      void phoneOnChange(e)
                    } else {
                      e.target.value = getValues('phone')
                    }
                  }}
                  placeholder="+91"
                  h={9}
                  maxW={{ base: '100%', lg: '486px' }}
                  borderColor="neutral.200"
                  _placeholder={{ color: 'neutral.300' }}
                  aria-required="true"
                  inputMode="numeric"
                />
                {showErr('phone') && errors.phone && (
                  <FormErrorMessage>{errors.phone.message}</FormErrorMessage>
                )}
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
                  {isPendingRegistration ? (
                    <ActionTooltip
                      label={labels.messages.pendingStatusTooltip ?? t('status.pending')}
                      shouldWrapChildren
                    >
                      <Box as="span">
                        <Toggle
                          isChecked={false}
                          onChange={() => {}}
                          isDisabled
                          aria-labelledby="activated-label"
                        />
                      </Box>
                    </ActionTooltip>
                  ) : (
                    <Toggle
                      isChecked={wStatus === 'active'}
                      onChange={() => void handleStatusToggle()}
                      isDisabled={isSubmitting || isStatusBusy}
                      aria-labelledby="activated-label"
                    />
                  )}
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
              isDisabled={isSubmitting || isStatusBusy}
            >
              {t('button.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              width={{ base: 'full', sm: 'auto' }}
              maxWidth={{ base: '100%', sm: isEditMode ? '174px' : '310px' }}
              isLoading={isSubmitting}
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
  readonly config: UserAdminFormConfig
  readonly actions: UserAdminFormActions
  readonly routes: UserAdminRoutes
  readonly labels: UserAdminFormPageLabels
}

export function UserAdminFormPage({ config, actions, routes, labels }: UserAdminFormPageProps) {
  const { t } = useTranslation('common')
  const { isEditMode, isLoadingOriginal, original } = config

  if (isEditMode && isLoadingOriginal) {
    return (
      <Box w="full">
        <PageHeader>
          <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
            {labels.editTitle}
          </Heading>
        </PageHeader>
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
        <PageHeader>
          <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
            {labels.editTitle}
          </Heading>
        </PageHeader>
        <Text color="neutral.600" mt={4}>
          {labels.messages.notFound}
        </Text>
      </Box>
    )
  }

  return (
    <FormContent
      key={original?.id ?? 'new'}
      config={config}
      actions={actions}
      routes={routes}
      labels={labels}
    />
  )
}
