import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Heading, Text, Flex, HStack, Alert, AlertIcon, Icon } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { EditIcon } from '@chakra-ui/icons'
import {
  StateUTDetailsSection,
  StateAdminDetailsSection,
  Toggle,
  ToastContainer,
  AppButton,
} from '@/shared/components/common'
import { useToast } from '@/shared/hooks/use-toast'
import { ROUTES } from '@/shared/constants/routes'
import type { StateUT } from '../../types/states-uts'
import {
  useCreateStateAdminMutation,
  useCreateTenantMutation,
  useStateUTByIdQuery,
  useStateUTOptionsQuery,
  useUpdateStateUTMutation,
  useUpdateStateUTStatusMutation,
} from '../../services/query/use-super-admin-queries'

export function AddStateUTPage() {
  const { t } = useTranslation(['super-admin', 'common'])
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const toast = useToast()
  const isEditMode = Boolean(id)

  const {
    data: stateUTOptions = [],
    isLoading: isStateUTOptionsLoading,
    isError: isStateUTOptionsError,
  } = useStateUTOptionsQuery()
  const stateUTQuery = useStateUTByIdQuery(id)
  const createTenantMutation = useCreateTenantMutation()
  const createStateAdminMutation = useCreateStateAdminMutation()
  const updateStateUTMutation = useUpdateStateUTMutation()
  const updateStateUTStatusMutation = useUpdateStateUTStatusMutation()

  const originalState: StateUT | null = stateUTQuery.data ?? null

  // Create form state
  const [stateName, setStateName] = useState('')
  const [stateCode, setStateCode] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [secondaryEmail, setSecondaryEmail] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit form draft (overlay on originalState)
  const [formDraft, setFormDraft] = useState<{
    firstName?: string
    lastName?: string
    phone?: string
    secondaryEmail?: string
    contactNumber?: string
    status?: 'active' | 'inactive'
  }>({})

  useEffect(() => {
    document.title = `${isEditMode ? t('statesUts.editTitle') : t('statesUts.addTitle')} | JalSoochak`
  }, [t, isEditMode])

  const availableStates = useMemo(() => {
    return stateUTOptions.map((state) => ({
      value: state.name,
      label: state.name,
    }))
  }, [stateUTOptions])

  // Resolved admin values: edit mode uses originalState + formDraft, create uses local state
  const adminFirstName = isEditMode
    ? (formDraft.firstName ?? originalState?.admin.firstName ?? '')
    : firstName
  const adminLastName = isEditMode
    ? (formDraft.lastName ?? originalState?.admin.lastName ?? '')
    : lastName
  const adminEmail = isEditMode ? (originalState?.admin.email ?? '') : email
  const adminPhone = isEditMode ? (formDraft.phone ?? originalState?.admin.phone ?? '') : phone
  const adminSecondaryEmail = isEditMode
    ? (formDraft.secondaryEmail ?? originalState?.admin.secondaryEmail ?? '')
    : secondaryEmail
  const adminContactNumber = isEditMode
    ? (formDraft.contactNumber ?? originalState?.admin.contactNumber ?? '')
    : contactNumber
  const status = isEditMode ? (formDraft.status ?? originalState?.status ?? 'active') : 'active'

  const adminLabels = useMemo(
    () => ({
      firstName: t('statesUts.adminDetails.firstName'),
      lastName: t('statesUts.adminDetails.lastName'),
      email: t('statesUts.adminDetails.email'),
      phone: t('statesUts.adminDetails.phone'),
      secondaryEmail: t('statesUts.adminDetails.secondaryEmail'),
      contactNumber: t('statesUts.adminDetails.contactNumber'),
    }),
    [t]
  )

  const handleAdminChange = useCallback(
    (
      field: 'firstName' | 'lastName' | 'email' | 'phone' | 'secondaryEmail' | 'contactNumber',
      value: string
    ) => {
      if (isEditMode) {
        setFormDraft((prev) => ({ ...prev, [field]: value }))
      } else {
        const setters = {
          firstName: setFirstName,
          lastName: setLastName,
          email: setEmail,
          phone: setPhone,
          secondaryEmail: setSecondaryEmail,
          contactNumber: setContactNumber,
        }
        setters[field](value)
      }
    },
    [isEditMode]
  )

  const handleStateChange = (value: string) => {
    setStateName(value)
    const selectedState = stateUTOptions.find((s) => s.name === value)
    setStateCode(selectedState?.code ?? '')
  }

  const isValidEmail = (emailStr: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(emailStr)
  }

  const isValidPhone = (phoneStr: string): boolean => {
    const phoneRegex = /^\d{10}$/
    return phoneRegex.test(phoneStr)
  }

  const isFormValid = useMemo(() => {
    if (isEditMode) {
      const requiredFieldsValid =
        adminFirstName.trim() !== '' && adminLastName.trim() !== '' && adminPhone.trim() !== ''
      const phoneValid = isValidPhone(adminPhone)
      const secondaryEmailValid = adminSecondaryEmail === '' || isValidEmail(adminSecondaryEmail)
      const contactNumberValid = adminContactNumber === '' || isValidPhone(adminContactNumber)
      return requiredFieldsValid && phoneValid && secondaryEmailValid && contactNumberValid
    }
    const requiredFieldsValid =
      stateName !== '' &&
      firstName.trim() !== '' &&
      lastName.trim() !== '' &&
      email.trim() !== '' &&
      phone.trim() !== ''
    const emailValid = isValidEmail(email)
    const phoneValid = isValidPhone(phone)
    const secondaryEmailValid = secondaryEmail === '' || isValidEmail(secondaryEmail)
    const contactNumberValid = contactNumber === '' || isValidPhone(contactNumber)
    return (
      requiredFieldsValid && emailValid && phoneValid && secondaryEmailValid && contactNumberValid
    )
  }, [
    isEditMode,
    stateName,
    firstName,
    lastName,
    email,
    phone,
    secondaryEmail,
    contactNumber,
    adminFirstName,
    adminLastName,
    adminPhone,
    adminSecondaryEmail,
    adminContactNumber,
  ])

  const hasChanges = useMemo(() => {
    if (!isEditMode || !originalState) return false
    return (
      adminFirstName !== originalState.admin.firstName ||
      adminLastName !== originalState.admin.lastName ||
      adminPhone !== originalState.admin.phone ||
      adminSecondaryEmail !== (originalState.admin.secondaryEmail ?? '') ||
      adminContactNumber !== (originalState.admin.contactNumber ?? '')
    )
  }, [
    isEditMode,
    originalState,
    adminFirstName,
    adminLastName,
    adminPhone,
    adminSecondaryEmail,
    adminContactNumber,
  ])

  const handleCancel = () => {
    if (isEditMode && id) {
      navigate(ROUTES.SUPER_ADMIN_STATES_UTS_VIEW.replace(':id', id))
    } else {
      navigate(ROUTES.SUPER_ADMIN_STATES_UTS)
    }
  }

  const handleStatusToggle = async () => {
    if (!originalState || updateStateUTStatusMutation.isPending) return
    const newStatus = status === 'active' ? 'inactive' : 'active'
    try {
      await updateStateUTStatusMutation.mutateAsync({
        id: originalState.id,
        status: newStatus,
      })
      setFormDraft((prev) => ({ ...prev, status: newStatus }))
      toast.addToast(
        newStatus === 'active'
          ? t('statesUts.messages.activatedSuccess')
          : t('statesUts.messages.deactivatedSuccess'),
        'success'
      )
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.addToast(t('statesUts.messages.failedToUpdateStatus'), 'error')
    }
  }

  const handleSave = async () => {
    if (!isFormValid || !hasChanges || !id) return
    try {
      await updateStateUTMutation.mutateAsync({
        id,
        payload: {
          admin: {
            firstName: adminFirstName.trim(),
            lastName: adminLastName.trim(),
            phone: adminPhone.trim(),
            secondaryEmail: adminSecondaryEmail.trim() || undefined,
            contactNumber: adminContactNumber.trim() || undefined,
          },
        },
      })
      toast.addToast(t('common:toast.changesSaved'), 'success')
      setTimeout(() => {
        navigate(ROUTES.SUPER_ADMIN_STATES_UTS_VIEW.replace(':id', id))
      }, 500)
    } catch (error) {
      console.error('Failed to update state:', error)
      toast.addToast(t('common:toast.failedToSave'), 'error')
    }
  }

  const handleSubmit = async () => {
    if (!isFormValid) {
      toast.addToast(t('common:toast.fillAllFieldsCorrectly'), 'error')
      return
    }
    const lgdCode = parseInt(stateCode, 10)
    if (!stateCode.trim() || Number.isNaN(lgdCode)) {
      toast.addToast(t('common:toast.fillAllFieldsCorrectly'), 'error')
      return
    }
    setIsSubmitting(true)
    const tenantPayload = {
      stateCode: stateCode.trim(),
      lgdCode,
      name: stateName.trim(),
    }
    try {
      const tenant = await createTenantMutation.mutateAsync(tenantPayload)
      try {
        await createStateAdminMutation.mutateAsync({
          tenantId: String(tenant.id),
          admin: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            secondaryEmail: secondaryEmail.trim() || undefined,
            contactNumber: contactNumber.trim() || undefined,
          },
        })
        toast.addToast(t('statesUts.messages.inviteSent'), 'success')
        setTimeout(() => {
          navigate(ROUTES.SUPER_ADMIN_STATES_UTS_VIEW.replace(':id', String(tenant.id)))
        }, 1000)
      } catch (adminError) {
        console.error('Admin creation failed:', adminError)
        toast.addToast(t('statesUts.messages.tenantCreatedAdminFailed'), 'error')
      }
    } catch (error) {
      console.error('Failed to create tenant:', error)
      toast.addToast(t('statesUts.messages.failedToAdd'), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEditMode) handleSave()
    else handleSubmit()
  }

  // Edit mode: loading state
  if (isEditMode && stateUTQuery.isLoading) {
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

  // Edit mode: not found
  if (isEditMode && !originalState) {
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

  return (
    <Box w="full">
      <Box mb={5}>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={2}>
          {isEditMode ? t('statesUts.editTitle') : t('statesUts.addTitle')}
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
            {isEditMode ? t('statesUts.breadcrumb.edit') : t('statesUts.breadcrumb.addNew')}
          </Text>
        </Flex>
      </Box>

      {!isEditMode && isStateUTOptionsError && (
        <Alert status="error" borderRadius="8px" mb={4}>
          <AlertIcon />
          {t('statesUts.messages.failedToLoadStateOptions')}
        </Alert>
      )}

      <Box
        as="form"
        role="form"
        aria-label={isEditMode ? t('statesUts.editTitle') : t('statesUts.addTitle')}
        bg="white"
        borderWidth="0.5px"
        borderColor="neutral.200"
        borderRadius="12px"
        w="full"
        minH={{ base: 'auto', lg: 'calc(100vh - 180px)' }}
        py={6}
        px={{ base: 3, md: 4 }}
        onSubmit={handleFormSubmit}
      >
        <Flex
          direction="column"
          h="full"
          justify="space-between"
          minH={{ base: 'auto', lg: 'calc(100vh - 232px)' }}
        >
          <Box>
            {isEditMode && originalState ? (
              <StateUTDetailsSection
                title={t('statesUts.details.title')}
                headerRightElement={
                  <Icon
                    as={EditIcon}
                    boxSize={5}
                    cursor="not-allowed"
                    h={5}
                    w={5}
                    aria-hidden="true"
                  />
                }
                nameLabel={t('statesUts.details.name')}
                codeLabel={t('statesUts.details.code')}
                name={originalState.name}
                code={originalState.code}
              />
            ) : (
              <StateUTDetailsSection
                title={t('statesUts.details.title')}
                nameLabel={t('statesUts.details.name')}
                codeLabel={t('statesUts.details.code')}
                name={stateName}
                code={stateCode}
                nameOptions={availableStates}
                onNameChange={handleStateChange}
                nameSelectDisabled={isStateUTOptionsLoading || isStateUTOptionsError}
                nameSelectPlaceholder={t('common:select')}
              />
            )}

            <StateAdminDetailsSection
              title={t('statesUts.adminDetails.title')}
              value={{
                firstName: adminFirstName,
                lastName: adminLastName,
                email: adminEmail,
                phone: adminPhone,
                secondaryEmail: adminSecondaryEmail,
                contactNumber: adminContactNumber,
              }}
              onChange={handleAdminChange}
              labels={adminLabels}
              emailReadOnly={isEditMode}
              enterPlaceholder={t('common:enter')}
            />

            {isEditMode && (
              <>
                <Heading as="h2" size="h3" fontWeight="400" mb={4} id="status-heading">
                  {t('statesUts.statusSection.title')}
                </Heading>
                <Flex align="center" gap={2} h={6} aria-labelledby="status-heading">
                  <Text textStyle="h10" id="activated-label">
                    {t('statesUts.statusSection.stateUtStatus')}
                  </Text>
                  <Toggle
                    isChecked={status === 'active'}
                    onChange={handleStatusToggle}
                    isDisabled={updateStateUTStatusMutation.isPending}
                    aria-labelledby="activated-label"
                  />
                </Flex>
              </>
            )}
          </Box>

          <HStack
            spacing={3}
            justify={{ base: 'stretch', sm: 'flex-end' }}
            mt={6}
            flexDirection={{ base: 'column-reverse', sm: 'row' }}
          >
            <AppButton
              variant="secondary"
              size="md"
              width={{ base: 'full', sm: '174px' }}
              onClick={handleCancel}
              isDisabled={
                isEditMode
                  ? updateStateUTMutation.isPending
                  : isSubmitting ||
                    createTenantMutation.isPending ||
                    createStateAdminMutation.isPending
              }
            >
              {t('common:button.cancel')}
            </AppButton>
            <AppButton
              type="submit"
              variant="primary"
              size="md"
              width={{ base: 'full', sm: isEditMode ? '174px' : 'auto' }}
              maxWidth={{ base: '100%', sm: isEditMode ? undefined : '275px' }}
              isLoading={
                isEditMode
                  ? updateStateUTMutation.isPending
                  : isSubmitting ||
                    createTenantMutation.isPending ||
                    createStateAdminMutation.isPending
              }
              isDisabled={
                isEditMode
                  ? !isFormValid || !hasChanges
                  : !isFormValid ||
                    isSubmitting ||
                    createTenantMutation.isPending ||
                    createStateAdminMutation.isPending
              }
            >
              {isEditMode ? t('common:button.saveChanges') : t('statesUts.buttons.addAndSendLink')}
            </AppButton>
          </HStack>
        </Flex>
      </Box>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </Box>
  )
}
