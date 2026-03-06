import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Heading,
  Text,
  Flex,
  SimpleGrid,
  Input,
  Button,
  HStack,
  FormControl,
  FormLabel,
  Spinner,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { EditIcon } from '@chakra-ui/icons'
import { Toggle, ToastContainer } from '@/shared/components/common'
import { useToast } from '@/shared/hooks/use-toast'
import { ROUTES } from '@/shared/constants/routes'
import type { StateUTAdmin } from '../../types/state-ut-admins'
import {
  useStateUTAdminByIdQuery,
  useCreateStateUTAdminMutation,
  useUpdateStateUTAdminMutation,
  useUpdateStateUTAdminStatusMutation,
} from '../../services/query/use-state-admin-queries'

const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
const isValidPhone = (val: string) => /^\d{10}$/.test(val)

// ─── Inner form — only rendered once original is available (edit) or absent (add) ───

interface FormContentProps {
  readonly id: string | undefined
  readonly isEditMode: boolean
  readonly original: StateUTAdmin | null
}

function FormContent({ id, isEditMode, original }: FormContentProps) {
  const { t } = useTranslation(['state-admin', 'common'])
  const navigate = useNavigate()
  const toast = useToast()

  const createMutation = useCreateStateUTAdminMutation()
  const updateMutation = useUpdateStateUTAdminMutation()
  const statusMutation = useUpdateStateUTAdminStatusMutation()

  // State initializes synchronously from original — no effect needed
  const [form, setForm] = useState({
    firstName: original?.firstName ?? '',
    lastName: original?.lastName ?? '',
    email: original?.email ?? '',
    phone: original?.phone ?? '',
    status: (original?.status ?? 'active') as 'active' | 'inactive',
  })

  const isFormValid = useMemo(
    () =>
      form.firstName.trim() !== '' &&
      form.lastName.trim() !== '' &&
      form.email.trim() !== '' &&
      form.phone.trim() !== '' &&
      isValidEmail(form.email) &&
      isValidPhone(form.phone),
    [form.firstName, form.lastName, form.email, form.phone]
  )

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
      navigate(ROUTES.STATE_ADMIN_STATE_UT_ADMINS_VIEW.replace(':id', id))
    } else {
      navigate(ROUTES.STATE_ADMIN_STATE_UT_ADMINS)
    }
  }

  const handleStatusToggle = async () => {
    if (!original || statusMutation.isPending) return
    const newStatus = form.status === 'active' ? 'inactive' : 'active'
    try {
      await statusMutation.mutateAsync({ id: original.id, status: newStatus })
      setForm((prev) => ({ ...prev, status: newStatus }))
      toast.addToast(
        newStatus === 'active'
          ? t('stateUtAdmins.messages.activatedSuccess')
          : t('stateUtAdmins.messages.deactivatedSuccess'),
        'success'
      )
    } catch {
      toast.addToast(t('stateUtAdmins.messages.failedToUpdateStatus'), 'error')
    }
  }

  const handleUpdate = async () => {
    if (!hasChanges || !id) return
    try {
      await updateMutation.mutateAsync({
        id,
        input: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),
        },
      })
      toast.addToast(t('common:toast.changesSaved'), 'success')
      setTimeout(() => {
        navigate(ROUTES.STATE_ADMIN_STATE_UT_ADMINS_VIEW.replace(':id', id))
      }, 500)
    } catch {
      toast.addToast(t('common:toast.failedToSave'), 'error')
    }
  }

  const handleCreate = async () => {
    try {
      const created = await createMutation.mutateAsync({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      })
      toast.addToast(t('stateUtAdmins.messages.adminAdded'), 'success')
      setTimeout(() => {
        navigate(ROUTES.STATE_ADMIN_STATE_UT_ADMINS_VIEW.replace(':id', created.id))
      }, 1000)
    } catch {
      toast.addToast(t('stateUtAdmins.messages.failedToAdd'), 'error')
    }
  }

  const handleSubmit = async () => {
    if (!isFormValid) {
      toast.addToast(t('common:toast.fillAllFieldsCorrectly'), 'error')
      return
    }
    if (isEditMode) {
      await handleUpdate()
    } else {
      await handleCreate()
    }
  }

  const title = isEditMode ? t('stateUtAdmins.editTitle') : t('stateUtAdmins.addTitle')
  const breadcrumbLeaf = isEditMode
    ? t('stateUtAdmins.breadcrumb.edit')
    : t('stateUtAdmins.breadcrumb.addNew')
  const isMutating = createMutation.isPending || updateMutation.isPending

  return (
    <Box w="full">
      {/* Page Header */}
      <Box mb={5}>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={2}>
          {title}
        </Heading>
        <Flex as="nav" aria-label="Breadcrumb" gap={2} flexWrap="wrap">
          <Text
            as="a"
            fontSize="14px"
            lineHeight="21px"
            color="neutral.500"
            cursor="pointer"
            _hover={{ textDecoration: 'underline' }}
            onClick={() => navigate(ROUTES.STATE_ADMIN_STATE_UT_ADMINS)}
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent) =>
              e.key === 'Enter' && navigate(ROUTES.STATE_ADMIN_STATE_UT_ADMINS)
            }
          >
            {t('stateUtAdmins.breadcrumb.manage')}
          </Text>
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
                {t('stateUtAdmins.form.userDetails')}
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
              <FormControl isRequired>
                <FormLabel textStyle="h10" mb={1}>
                  {t('stateUtAdmins.form.firstName')}
                </FormLabel>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  placeholder={t('common:enter')}
                  h={9}
                  maxW={{ base: '100%', lg: '486px' }}
                  borderColor="neutral.200"
                  _placeholder={{ color: 'neutral.300' }}
                  aria-required="true"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel textStyle="h10" mb={1}>
                  {t('stateUtAdmins.form.lastName')}
                </FormLabel>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  placeholder={t('common:enter')}
                  h={9}
                  maxW={{ base: '100%', lg: '486px' }}
                  borderColor="neutral.200"
                  _placeholder={{ color: 'neutral.300' }}
                  aria-required="true"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel textStyle="h10" mb={1} color={isEditMode ? 'neutral.400' : undefined}>
                  {t('stateUtAdmins.form.emailAddress')}
                </FormLabel>
                <Input
                  type="email"
                  value={form.email}
                  onChange={
                    isEditMode
                      ? undefined
                      : (e) => setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  isReadOnly={isEditMode}
                  isDisabled={isEditMode}
                  bg={isEditMode ? 'neutral.50' : undefined}
                  color={isEditMode ? 'neutral.400' : undefined}
                  placeholder={isEditMode ? undefined : t('common:enter')}
                  h={9}
                  maxW={{ base: '100%', lg: '486px' }}
                  borderColor="neutral.200"
                  _placeholder={{ color: 'neutral.300' }}
                  aria-required="true"
                  aria-readonly={isEditMode ? 'true' : undefined}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel textStyle="h10" mb={1}>
                  {t('stateUtAdmins.form.phoneNumber')}
                </FormLabel>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => {
                    const digits = e.target.value.replaceAll(/\D/g, '')
                    if (digits.length <= 10) setForm((prev) => ({ ...prev, phone: digits }))
                  }}
                  placeholder="+91"
                  h={9}
                  maxW={{ base: '100%', lg: '486px' }}
                  borderColor="neutral.200"
                  _placeholder={{ color: 'neutral.300' }}
                  aria-required="true"
                  inputMode="numeric"
                />
              </FormControl>
            </SimpleGrid>

            {/* Status toggle — edit mode only */}
            {isEditMode && (
              <Box mt={7}>
                <Heading as="h2" size="h3" fontWeight="400" mb={4} id="status-heading">
                  {t('stateUtAdmins.form.statusSection')}
                </Heading>
                <Flex align="center" gap={2} h={6} aria-labelledby="status-heading">
                  <Text textStyle="h10" id="activated-label">
                    {t('stateUtAdmins.form.activated')}
                  </Text>
                  <Toggle
                    isChecked={form.status === 'active'}
                    onChange={() => void handleStatusToggle()}
                    isDisabled={statusMutation.isPending}
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
              isDisabled={isMutating}
            >
              {t('common:button.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              width={{ base: 'full', sm: 'auto' }}
              maxWidth={{ base: '100%', sm: isEditMode ? '174px' : '310px' }}
              isLoading={isMutating}
              isDisabled={!isFormValid || (isEditMode && !hasChanges)}
            >
              {isEditMode
                ? t('common:button.saveChanges')
                : t('stateUtAdmins.buttons.addAndSendLink')}
            </Button>
          </HStack>
        </Flex>
      </Box>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </Box>
  )
}

// ─── Page component — handles data fetching, loading/not-found guards ───

export function StateUTAdminFormPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const { id } = useParams<{ id?: string }>()
  const isEditMode = Boolean(id)

  const adminQuery = useStateUTAdminByIdQuery(id)
  const original = adminQuery.data ?? null

  useEffect(() => {
    document.title = `${isEditMode ? t('stateUtAdmins.editTitle') : t('stateUtAdmins.addTitle')} | JalSoochak`
  }, [t, isEditMode])

  if (isEditMode && adminQuery.isLoading) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={5}>
          {t('stateUtAdmins.editTitle')}
        </Heading>
        <Flex role="status" aria-live="polite" align="center" minH="200px" gap={3}>
          <Spinner size="md" color="primary.500" />
          <Text color="neutral.600">{t('common:loading')}</Text>
        </Flex>
      </Box>
    )
  }

  if (isEditMode && !original) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={5}>
          {t('stateUtAdmins.editTitle')}
        </Heading>
        <Text color="neutral.600" mt={4}>
          {t('stateUtAdmins.messages.notFound')}
        </Text>
      </Box>
    )
  }

  return (
    <FormContent key={original?.id ?? 'new'} id={id} isEditMode={isEditMode} original={original} />
  )
}
