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
  FormErrorMessage,
  IconButton,
} from '@chakra-ui/react'
import { EditIcon } from '@chakra-ui/icons'
import { useTranslation } from 'react-i18next'
import {
  ToastContainer,
  SearchableSelect,
  PageHeader,
  Toggle,
  ActionTooltip,
} from '@/shared/components/common'
import { TENANT_STATUSES, type TenantStatus } from '../../types/states-uts'
import { useToast } from '@/shared/hooks/use-toast'
import { ROUTES } from '@/shared/constants/routes'
import { isAlphabeticWithSpaces, exceedsMaxLength } from '@/shared/utils/validation'
import {
  useStatesUTsQuery,
  useStateAdminsByTenantQuery,
  useUpdateTenantStatusMutation,
  useUpdateUserMutation,
  useUpdateUserStatusMutation,
} from '../../services/query/use-super-admin-queries'
import type { UserAdminData } from '@/shared/components/common'

const MAX_NAME_LENGTH = 25
const isValidPhone = (v: string) => /^\d{10}$/.test(v)
const isNameValid = (name: string) =>
  name.trim() !== '' &&
  !exceedsMaxLength(name, MAX_NAME_LENGTH) &&
  isAlphabeticWithSpaces(name.trim())

/** Per-admin draft: firstName, lastName and phone are editable. */
interface AdminDraft {
  firstName: string
  lastName: string
  phone: string
}

interface AdminTouchedFields {
  firstName: boolean
  lastName: boolean
  phone: boolean
}

function hasAdminChanged(original: UserAdminData, draft: AdminDraft): boolean {
  return (
    draft.firstName !== original.firstName ||
    draft.lastName !== original.lastName ||
    draft.phone !== original.phone
  )
}

export function EditStateUTPage() {
  const { t } = useTranslation(['super-admin', 'common'])
  const navigate = useNavigate()
  const { tenantCode } = useParams<{ tenantCode: string }>()
  const toast = useToast()

  const tenantsQuery = useStatesUTsQuery()
  const tenant = tenantsQuery.data?.find((t) => t.stateCode === tenantCode) ?? null
  const adminsQuery = useStateAdminsByTenantQuery(tenantCode)
  const admins: UserAdminData[] = adminsQuery.data ?? []

  const updateStatusMutation = useUpdateTenantStatusMutation()
  const updateUserMutation = useUpdateUserMutation()
  const updateUserStatusMutation = useUpdateUserStatusMutation()

  const [adminDrafts, setAdminDrafts] = useState<Record<string, AdminDraft>>({})
  const [adminTouched, setAdminTouched] = useState<Record<string, AdminTouchedFields>>({})
  const [adminStatuses, setAdminStatuses] = useState<
    Record<string, 'active' | 'inactive' | 'pending'>
  >({})
  const [statusTogglingId, setStatusTogglingId] = useState<string | null>(null)
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

  const isAllChangedAdminsValid = useMemo(
    () =>
      changedAdmins.every((admin) => {
        const draft = adminDrafts[admin.id]
        if (!draft) return true
        return (
          isNameValid(draft.firstName) && isNameValid(draft.lastName) && isValidPhone(draft.phone)
        )
      }),
    [changedAdmins, adminDrafts]
  )

  const getAdminDraftErrors = (adminId: string, draft: AdminDraft) => {
    const touched = adminTouched[adminId] ?? { firstName: false, lastName: false, phone: false }
    return {
      firstName: (() => {
        if (!touched.firstName) return ''
        if (!draft.firstName.trim()) return t('common:validation.required')
        if (exceedsMaxLength(draft.firstName, MAX_NAME_LENGTH))
          return t('common:validation.maxLength', { max: MAX_NAME_LENGTH })
        if (!isAlphabeticWithSpaces(draft.firstName.trim()))
          return t('common:validation.alphabeticOnly')
        return ''
      })(),
      lastName: (() => {
        if (!touched.lastName) return ''
        if (!draft.lastName.trim()) return t('common:validation.required')
        if (exceedsMaxLength(draft.lastName, MAX_NAME_LENGTH))
          return t('common:validation.maxLength', { max: MAX_NAME_LENGTH })
        if (!isAlphabeticWithSpaces(draft.lastName.trim()))
          return t('common:validation.alphabeticOnly')
        return ''
      })(),
      phone: (() => {
        if (!touched.phone) return ''
        if (!draft.phone.trim()) return t('common:validation.required')
        if (!isValidPhone(draft.phone)) return t('common:validation.invalidPhone')
        return ''
      })(),
    }
  }

  const markAdminFieldTouched = (adminId: string, field: keyof AdminTouchedFields) => {
    setAdminTouched((prev) => ({
      ...prev,
      [adminId]: {
        firstName: prev[adminId]?.firstName ?? false,
        lastName: prev[adminId]?.lastName ?? false,
        phone: prev[adminId]?.phone ?? false,
        [field]: true,
      },
    }))
  }

  const handleStatusChange = async (newStatus: TenantStatus) => {
    if (!tenant || updateStatusMutation.isPending) return
    try {
      await updateStatusMutation.mutateAsync({ id: tenant.id, status: newStatus })
      toast.addToast(t('statesUts.messages.statusUpdatedSuccess'), 'success')
    } catch {
      toast.addToast(t('statesUts.messages.failedToUpdateStatus'), 'error')
    }
  }

  const handleAdminStatusToggle = async (adminId: string, currentStatus: string) => {
    if (statusTogglingId !== null || updateUserStatusMutation.isPending) return
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    setStatusTogglingId(adminId)
    try {
      await updateUserStatusMutation.mutateAsync({ id: adminId, status: newStatus })
      setAdminStatuses((prev) => ({ ...prev, [adminId]: newStatus }))
      toast.addToast(
        newStatus === 'active'
          ? t('statesUts.messages.adminActivatedSuccess')
          : t('statesUts.messages.adminDeactivatedSuccess'),
        'success'
      )
    } catch {
      toast.addToast(t('statesUts.messages.failedToUpdateStatus'), 'error')
    } finally {
      setStatusTogglingId(null)
    }
  }

  const handleCancel = () => {
    if (tenantCode) {
      navigate(ROUTES.SUPER_ADMIN_STATES_UTS_VIEW.replace(':tenantCode', tenantCode))
    } else {
      navigate(ROUTES.SUPER_ADMIN_STATES_UTS)
    }
  }

  const handleSave = async () => {
    const newTouched: Record<string, AdminTouchedFields> = {}
    changedAdmins.forEach((admin) => {
      newTouched[admin.id] = { firstName: true, lastName: true, phone: true }
    })
    setAdminTouched((prev) => ({ ...prev, ...newTouched }))
    if (!hasChanges || !isAllChangedAdminsValid || isSaving) return
    setIsSaving(true)
    const failedEmails: string[] = []

    for (const admin of changedAdmins) {
      const draft = adminDrafts[admin.id]
      if (!draft) continue
      try {
        await updateUserMutation.mutateAsync({
          id: admin.id,
          payload: {
            firstName: draft.firstName,
            lastName: draft.lastName,
            phoneNumber: draft.phone,
          },
        })
      } catch {
        failedEmails.push(admin.email)
      }
    }

    setIsSaving(false)

    if (failedEmails.length === 0) {
      toast.addToast(t('common:toast.changesSaved'), 'success')
      if (tenantCode) {
        if (navigateTimerRef.current !== null) {
          clearTimeout(navigateTimerRef.current)
        }
        navigateTimerRef.current = setTimeout(() => {
          navigateTimerRef.current = null
          navigate(ROUTES.SUPER_ADMIN_STATES_UTS_VIEW.replace(':tenantCode', tenantCode))
        }, 500)
      }
    } else {
      toast.addToast(t('common:toast.failedToSave'), 'error')
    }
  }

  const setAdminField = (adminId: string, field: keyof AdminDraft, value: string) => {
    setAdminDrafts((prev) => {
      const source = admins.find((a) => a.id === adminId)
      return {
        ...prev,
        [adminId]: {
          firstName: prev[adminId]?.firstName ?? source?.firstName ?? '',
          lastName: prev[adminId]?.lastName ?? source?.lastName ?? '',
          phone: prev[adminId]?.phone ?? source?.phone ?? '',
          [field]: value,
        },
      }
    })
  }

  if (tenantsQuery.isLoading) {
    return (
      <Box w="full">
        <PageHeader>
          <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
            {t('statesUts.editTitle')}
          </Heading>
        </PageHeader>
        <Flex role="status" aria-live="polite" align="center" justify="center" minH="200px">
          <Text color="neutral.600">{t('common:loading')}</Text>
        </Flex>
      </Box>
    )
  }

  if (!tenant) {
    return (
      <Box w="full">
        <PageHeader>
          <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
            {t('statesUts.editTitle')}
          </Heading>
        </PageHeader>
        <Text color="neutral.600" mt={4}>
          {t('statesUts.messages.notFound')}
        </Text>
      </Box>
    )
  }

  const isPending = isSaving || updateUserMutation.isPending

  return (
    <Box w="full">
      <PageHeader>
        <Flex justify="space-between" align="flex-start" mb={2}>
          <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
            {t('statesUts.editTitle')}
          </Heading>
        </Flex>
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
      </PageHeader>

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
            <Flex justify="space-between" align="flex-start" mb={4}>
              <Heading as="h2" size="h3" fontWeight="400" mb={4} id="state-details-heading">
                {t('statesUts.details.title')}
              </Heading>
              {tenant && (
                <IconButton
                  aria-label={`${t('statesUts.aria.editStateUt')} ${tenant.name}`}
                  icon={<EditIcon boxSize={5} />}
                  variant="ghost"
                  size="sm"
                  color="neutral.950"
                  _hover={{ color: 'primary.500', bg: 'transparent' }}
                  onClick={() =>
                    navigate(ROUTES.SUPER_ADMIN_STATES_UTS_VIEW.replace(':tenantCode', tenantCode!))
                  }
                />
              )}
            </Flex>
            <SimpleGrid
              columns={{ base: 1, lg: 2 }}
              spacing={6}
              columnGap={100}
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
                  aria-readonly="true"
                />
              </FormControl>
            </SimpleGrid>

            {/* Status Toggle */}
            <Heading as="h2" size="h3" fontWeight="400" mb={4} id="status-heading">
              {t('statesUts.statusSection.title')}
            </Heading>
            <Box mb={7}>
              <SearchableSelect
                options={TENANT_STATUSES.map((s) => ({
                  value: s,
                  label: t(`statesUts.statusSection.statuses.${s}`),
                }))}
                value={tenant.status}
                onChange={(val) => void handleStatusChange(val as TenantStatus)}
                disabled={updateStatusMutation.isPending}
                ariaLabel={t('statesUts.statusSection.stateUtStatus')}
                width={{ base: '100%', md: '175px' }}
              />
            </Box>

            {/* State Admin Details — editable */}
            {adminsQuery.isLoading && (
              <Text color="neutral.600" textStyle="h10" mb={4}>
                {t('common:loading')}
              </Text>
            )}
            {!adminsQuery.isLoading && !adminsQuery.isError && admins.length === 0 && (
              <Text color="neutral.400" textStyle="h10" mb={4}>
                {t('common:na')}
              </Text>
            )}
            {!adminsQuery.isLoading && admins.length > 0 && (
              <Flex direction="column" gap={6}>
                {admins.map((admin) => {
                  const draft: AdminDraft = {
                    firstName: adminDrafts[admin.id]?.firstName ?? admin.firstName,
                    lastName: adminDrafts[admin.id]?.lastName ?? admin.lastName,
                    phone: adminDrafts[admin.id]?.phone ?? admin.phone,
                  }
                  const draftErrors = getAdminDraftErrors(admin.id, draft)
                  const adminHeadingId = `admin-details-heading-${admin.id}`
                  const currentAdminStatus = adminStatuses[admin.id] ?? admin.status
                  const isTogglingThisAdmin = statusTogglingId === admin.id
                  const isPendingRegistration = currentAdminStatus === 'pending'
                  const isToggleDisabled =
                    updateUserStatusMutation.isPending ||
                    isTogglingThisAdmin ||
                    isPendingRegistration
                  return (
                    <Box key={admin.id}>
                      <Flex justify="space-between" align="center" mb={4}>
                        <Heading as="h2" size="h3" fontWeight="400" id={adminHeadingId}>
                          {t('statesUts.adminDetails.title')}
                        </Heading>
                        <Flex align="center" gap={2}>
                          <Text textStyle="h10">{t('statesUts.statusSection.activated')}</Text>
                          {isPendingRegistration ? (
                            <ActionTooltip
                              label={t('statesUts.messages.adminRegistrationPending')}
                              shouldWrapChildren
                            >
                              <Box as="span">
                                <Toggle
                                  isChecked={false}
                                  onChange={() =>
                                    void handleAdminStatusToggle(admin.id, currentAdminStatus)
                                  }
                                  isDisabled={isToggleDisabled}
                                  aria-label={`${t('statesUts.statusSection.activated')} ${admin.firstName}`}
                                />
                              </Box>
                            </ActionTooltip>
                          ) : (
                            <Toggle
                              isChecked={currentAdminStatus === 'active'}
                              onChange={() =>
                                void handleAdminStatusToggle(admin.id, currentAdminStatus)
                              }
                              isDisabled={isToggleDisabled}
                              aria-label={`${t('statesUts.statusSection.activated')} ${admin.firstName}`}
                            />
                          )}
                        </Flex>
                      </Flex>
                      <SimpleGrid
                        columns={{ base: 1, lg: 2 }}
                        spacing={4}
                        columnGap={100}
                        aria-labelledby={adminHeadingId}
                      >
                        <FormControl isInvalid={!!draftErrors.firstName}>
                          <FormLabel textStyle="h10" mb={1}>
                            {t('statesUts.adminDetails.firstName')}
                          </FormLabel>
                          <Input
                            value={draft.firstName}
                            onChange={(e) => setAdminField(admin.id, 'firstName', e.target.value)}
                            onBlur={() => markAdminFieldTouched(admin.id, 'firstName')}
                            placeholder={t('common:enter')}
                            borderColor="neutral.200"
                            h={9}
                            _placeholder={{ color: 'neutral.300' }}
                          />
                          {draftErrors.firstName && (
                            <FormErrorMessage>{draftErrors.firstName}</FormErrorMessage>
                          )}
                        </FormControl>
                        <FormControl isInvalid={!!draftErrors.lastName}>
                          <FormLabel textStyle="h10" mb={1}>
                            {t('statesUts.adminDetails.lastName')}
                          </FormLabel>
                          <Input
                            value={draft.lastName}
                            onChange={(e) => setAdminField(admin.id, 'lastName', e.target.value)}
                            onBlur={() => markAdminFieldTouched(admin.id, 'lastName')}
                            placeholder={t('common:enter')}
                            borderColor="neutral.200"
                            h={9}
                            _placeholder={{ color: 'neutral.300' }}
                          />
                          {draftErrors.lastName && (
                            <FormErrorMessage>{draftErrors.lastName}</FormErrorMessage>
                          )}
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
                            aria-readonly="true"
                          />
                        </FormControl>
                        <FormControl isInvalid={!!draftErrors.phone}>
                          <FormLabel textStyle="h10" mb={1}>
                            {t('statesUts.adminDetails.phone')}
                          </FormLabel>
                          <Input
                            type="tel"
                            value={draft.phone}
                            onChange={(e) => {
                              const digits = e.target.value.replaceAll(/\D/g, '')
                              if (digits.length <= 10) {
                                setAdminField(admin.id, 'phone', digits)
                              }
                            }}
                            onBlur={() => markAdminFieldTouched(admin.id, 'phone')}
                            placeholder="+91"
                            borderColor="neutral.200"
                            h={9}
                            _placeholder={{ color: 'neutral.300' }}
                            inputMode="numeric"
                          />
                          {draftErrors.phone && (
                            <FormErrorMessage>{draftErrors.phone}</FormErrorMessage>
                          )}
                        </FormControl>
                      </SimpleGrid>
                    </Box>
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
              isDisabled={!hasChanges || !isAllChangedAdminsValid || isPending}
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
