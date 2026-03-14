import { useState, useEffect, useMemo, useRef } from 'react'
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
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { Toggle, ToastContainer } from '@/shared/components/common'
import { useToast } from '@/shared/hooks/use-toast'
import { ROUTES } from '@/shared/constants/routes'
import {
  useTenantByIdQuery,
  useStateAdminsByTenantQuery,
  useUpdateTenantStatusMutation,
  useUpdateUserMutation,
} from '../../services/query/use-super-admin-queries'
import type { UserAdminData } from '@/shared/components/common'

/** Per-admin draft: only lastName and phone are editable. */
interface AdminDraft {
  lastName: string
  phone: string
}

function hasAdminChanged(original: UserAdminData, draft: AdminDraft): boolean {
  return draft.lastName !== original.lastName || draft.phone !== original.phone
}

export function EditStateUTPage() {
  const { t } = useTranslation(['super-admin', 'common'])
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const toast = useToast()

  const tenantId = id && !Number.isNaN(Number(id)) ? Number(id) : undefined
  const tenantQuery = useTenantByIdQuery(tenantId)
  const tenant = tenantQuery.data ?? null
  const adminsQuery = useStateAdminsByTenantQuery(tenant?.stateCode)
  const admins: UserAdminData[] = adminsQuery.data ?? []

  const updateStatusMutation = useUpdateTenantStatusMutation()
  const updateUserMutation = useUpdateUserMutation()

  const [adminDrafts, setAdminDrafts] = useState<Record<string, AdminDraft>>({})
  const [isSaving, setIsSaving] = useState(false)
  const navigateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    document.title = `${t('statesUts.editTitle')} | JalSoochak`
    return () => {
      if (navigateTimerRef.current !== null) {
        clearTimeout(navigateTimerRef.current)
      }
    }
  }, [t])

  const changedAdmins = useMemo(
    () =>
      admins.filter((admin) => {
        const draft = adminDrafts[admin.id]
        return draft !== undefined && hasAdminChanged(admin, draft)
      }),
    [admins, adminDrafts]
  )

  const hasChanges = changedAdmins.length > 0

  const handleStatusToggle = async () => {
    if (!tenant || updateStatusMutation.isPending) return
    const newStatus = tenant.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      await updateStatusMutation.mutateAsync({ id: tenant.id, status: newStatus })
      toast.addToast(
        newStatus === 'ACTIVE'
          ? t('statesUts.messages.activatedSuccess')
          : t('statesUts.messages.deactivatedSuccess'),
        'success'
      )
    } catch {
      toast.addToast(t('statesUts.messages.failedToUpdateStatus'), 'error')
    }
  }

  const handleCancel = () => {
    if (id) {
      navigate(ROUTES.SUPER_ADMIN_STATES_UTS_VIEW.replace(':id', id))
    } else {
      navigate(ROUTES.SUPER_ADMIN_STATES_UTS)
    }
  }

  const handleSave = async () => {
    if (!hasChanges || isSaving) return
    setIsSaving(true)
    const failedEmails: string[] = []

    for (const admin of changedAdmins) {
      const draft = adminDrafts[admin.id]
      if (!draft) continue
      try {
        await updateUserMutation.mutateAsync({
          id: admin.id,
          payload: { lastName: draft.lastName, phoneNumber: draft.phone },
        })
      } catch {
        failedEmails.push(admin.email)
      }
    }

    setIsSaving(false)

    if (failedEmails.length === 0) {
      toast.addToast(t('common:toast.changesSaved'), 'success')
      if (id) {
        if (navigateTimerRef.current !== null) {
          clearTimeout(navigateTimerRef.current)
        }
        navigateTimerRef.current = setTimeout(() => {
          navigateTimerRef.current = null
          navigate(ROUTES.SUPER_ADMIN_STATES_UTS_VIEW.replace(':id', id))
        }, 500)
      }
    } else {
      toast.addToast(t('common:toast.failedToSave'), 'error')
    }
  }

  const setAdminField = (adminId: string, field: keyof AdminDraft, value: string) => {
    setAdminDrafts((prev) => ({
      ...prev,
      [adminId]: {
        lastName: prev[adminId]?.lastName ?? admins.find((a) => a.id === adminId)?.lastName ?? '',
        phone: prev[adminId]?.phone ?? admins.find((a) => a.id === adminId)?.phone ?? '',
        [field]: value,
      },
    }))
  }

  if (tenantQuery.isLoading) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={5}>
          {t('statesUts.editTitle')}
        </Heading>
        <Flex role="status" aria-live="polite" align="center" justify="center" minH="200px">
          <Text color="neutral.600">{t('common:loading')}</Text>
        </Flex>
      </Box>
    )
  }

  if (!tenant) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={5}>
          {t('statesUts.editTitle')}
        </Heading>
        <Text color="neutral.600" mt={4}>
          {t('statesUts.messages.notFound')}
        </Text>
      </Box>
    )
  }

  const isPending = isSaving || updateUserMutation.isPending

  return (
    <Box w="full">
      {/* Breadcrumb */}
      <Box mb={5}>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={2}>
          {t('statesUts.editTitle')}
        </Heading>
        <Flex as="nav" aria-label="Breadcrumb" gap={2} flexWrap="wrap">
          <Text
            as="a"
            fontSize="14px"
            lineHeight="21px"
            color="neutral.500"
            cursor="pointer"
            _hover={{ textDecoration: 'underline' }}
            onClick={() => navigate(ROUTES.SUPER_ADMIN_STATES_UTS)}
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent) =>
              e.key === 'Enter' && navigate(ROUTES.SUPER_ADMIN_STATES_UTS)
            }
          >
            {t('statesUts.breadcrumb.manage')}
          </Text>
          <Text fontSize="14px" lineHeight="21px" color="neutral.500" aria-hidden="true">
            /
          </Text>
          <Text fontSize="14px" lineHeight="21px" color="#26272B" aria-current="page">
            {t('statesUts.breadcrumb.edit')}
          </Text>
        </Flex>
      </Box>

      {/* Form Card */}
      <Box
        as="form"
        role="form"
        aria-label={t('statesUts.editTitle')}
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
          void handleSave()
        }}
      >
        <Flex
          direction="column"
          h="full"
          justify="space-between"
          minH={{ base: 'auto', lg: 'calc(100vh - 232px)' }}
        >
          <Box>
            {/* State/UT Details — read-only */}
            <Heading as="h2" size="h3" fontWeight="400" mb={4} id="state-details-heading">
              {t('statesUts.details.title')}
            </Heading>
            <SimpleGrid
              columns={{ base: 1, lg: 2 }}
              spacing={6}
              mb={7}
              aria-labelledby="state-details-heading"
            >
              <FormControl>
                <FormLabel textStyle="h10" color="neutral.400" mb={1}>
                  {t('statesUts.details.name')}
                </FormLabel>
                <Input
                  value={tenant.name}
                  isReadOnly
                  isDisabled
                  bg="neutral.50"
                  borderColor="neutral.200"
                  color="neutral.400"
                  h={9}
                  maxW={{ base: '100%', lg: '486px' }}
                  aria-readonly="true"
                />
              </FormControl>
              <FormControl>
                <FormLabel textStyle="h10" color="neutral.400" mb={1}>
                  {t('statesUts.details.stateCode')}
                </FormLabel>
                <Input
                  value={`${tenant.stateCode} (LGD: ${String(tenant.lgdCode)})`}
                  isReadOnly
                  isDisabled
                  bg="neutral.50"
                  borderColor="neutral.200"
                  color="neutral.400"
                  h={9}
                  maxW={{ base: '100%', lg: '486px' }}
                  aria-readonly="true"
                />
              </FormControl>
            </SimpleGrid>

            {/* Status Toggle */}
            <Heading as="h2" size="h3" fontWeight="400" mb={4} id="status-heading">
              {t('statesUts.statusSection.title')}
            </Heading>
            <Flex align="center" gap={2} h={6} mb={7} aria-labelledby="status-heading">
              <Text textStyle="h10" id="status-toggle-label">
                {t('statesUts.statusSection.stateUtStatus')}
              </Text>
              <Toggle
                isChecked={tenant.status === 'ACTIVE'}
                onChange={() => void handleStatusToggle()}
                isDisabled={updateStatusMutation.isPending}
                aria-labelledby="status-toggle-label"
              />
            </Flex>

            {/* State Admin Details — editable */}
            <Heading as="h2" size="h3" fontWeight="400" mb={4} id="admin-details-heading">
              {t('statesUts.adminDetails.title')}
            </Heading>
            {adminsQuery.isLoading && (
              <Text color="neutral.600" textStyle="h10" mb={4}>
                {t('common:loading')}
              </Text>
            )}
            {!adminsQuery.isLoading && admins.length === 0 && (
              <Text color="neutral.400" textStyle="h10" mb={4}>
                {t('common:na')}
              </Text>
            )}
            {!adminsQuery.isLoading && admins.length > 0 && (
              <Flex direction="column" gap={6}>
                {admins.map((admin) => {
                  const lastName = adminDrafts[admin.id]?.lastName ?? admin.lastName
                  const phone = adminDrafts[admin.id]?.phone ?? admin.phone
                  return (
                    <SimpleGrid
                      key={admin.id}
                      columns={{ base: 1, lg: 2 }}
                      spacing={4}
                      aria-labelledby="admin-details-heading"
                    >
                      <FormControl>
                        <FormLabel textStyle="h10" color="neutral.400" mb={1}>
                          {t('statesUts.adminDetails.firstName')}
                        </FormLabel>
                        <Input
                          value={admin.firstName}
                          isReadOnly
                          isDisabled
                          bg="neutral.50"
                          borderColor="neutral.200"
                          color="neutral.400"
                          h={9}
                          maxW={{ base: '100%', lg: '486px' }}
                          aria-readonly="true"
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel textStyle="h10" mb={1}>
                          {t('statesUts.adminDetails.lastName')}
                        </FormLabel>
                        <Input
                          value={lastName}
                          onChange={(e) => setAdminField(admin.id, 'lastName', e.target.value)}
                          placeholder={t('common:enter')}
                          borderColor="neutral.200"
                          h={9}
                          maxW={{ base: '100%', lg: '486px' }}
                          _placeholder={{ color: 'neutral.300' }}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel textStyle="h10" color="neutral.400" mb={1}>
                          {t('statesUts.adminDetails.email')}
                        </FormLabel>
                        <Input
                          value={admin.email}
                          isReadOnly
                          isDisabled
                          bg="neutral.50"
                          borderColor="neutral.200"
                          color="neutral.400"
                          h={9}
                          maxW={{ base: '100%', lg: '486px' }}
                          aria-readonly="true"
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel textStyle="h10" mb={1}>
                          {t('statesUts.adminDetails.phone')}
                        </FormLabel>
                        <Input
                          type="tel"
                          value={phone}
                          onChange={(e) => {
                            const digits = e.target.value.replaceAll(/\D/g, '')
                            if (digits.length <= 10) {
                              setAdminField(admin.id, 'phone', digits)
                            }
                          }}
                          placeholder="+91"
                          borderColor="neutral.200"
                          h={9}
                          maxW={{ base: '100%', lg: '486px' }}
                          _placeholder={{ color: 'neutral.300' }}
                          inputMode="numeric"
                        />
                      </FormControl>
                    </SimpleGrid>
                  )
                })}
              </Flex>
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
              isDisabled={isPending}
            >
              {t('common:button.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              width={{ base: 'full', sm: '174px' }}
              isLoading={isPending}
              isDisabled={!hasChanges || isPending}
            >
              {t('common:button.saveChanges')}
            </Button>
          </HStack>
        </Flex>
      </Box>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </Box>
  )
}
