import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Text,
  Button,
  Flex,
  HStack,
  VStack,
  Heading,
  Spinner,
  Checkbox,
  CheckboxGroup,
  RadioGroup,
  Radio,
  Input,
  SimpleGrid,
  FormControl,
  FormErrorMessage,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { EditIcon, WarningTwoIcon } from '@chakra-ui/icons'
import { FiUpload } from 'react-icons/fi'
import { useToast } from '@/shared/hooks/use-toast'
import { ActionTooltip, ToastContainer } from '@/shared/components/common'
import {
  useConfigurationQuery,
  useLogoQuery,
  useSaveConfigurationMutation,
  useSystemChannelsQuery,
  useUpdateLogoMutation,
} from '../../services/query/use-state-admin-queries'
import {
  CHANNEL_CODE_TO_NAME,
  DEFAULT_DATE_FORMAT_CONFIG,
  DEFAULT_METER_CHANGE_REASONS,
  DEFAULT_SUPPLY_OUTAGE_REASONS,
  type DateFormatConfig,
  type MeterChangeReason,
  type SupplyOutageReason,
} from '../../types/configuration'
import { MeterChangeReasonsSection } from './meter-change-reasons-section'
import { SupplyOutageReasonsSection } from './supply-outage-reasons-section'
import { DateFormatSection } from './date-format-section'
import {
  validateDescriptiveField,
  hasDuplicates,
  exceedsMaxLength,
} from '@/shared/utils/validation'
import { ROUTES } from '@/shared/constants/routes'

const MAX_METER_REASON_LENGTH = 100
const MAX_AVG_MEMBERS = 20

interface ConfigDraft {
  supportedChannels: string[]
  logoFile: File | null
  logoUrl?: string
  meterChangeReasons: MeterChangeReason[]
  supplyOutageReasons: SupplyOutageReason[]
  locationCheckRequired: boolean
  displayDepartmentMaps: boolean
  dataConsolidationTime: string
  pumpOperatorReminderNudgeTime: string
  dateFormatScreen: DateFormatConfig
  dateFormatTable: DateFormatConfig
  averageMembersPerHousehold: number
}

function buildInitialDraft(
  config?: {
    supportedChannels: string[]
    meterChangeReasons: MeterChangeReason[]
    supplyOutageReasons: SupplyOutageReason[]
    locationCheckRequired: boolean
    displayDepartmentMaps: boolean
    dataConsolidationTime: string
    pumpOperatorReminderNudgeTime: string
    dateFormatScreen: DateFormatConfig
    dateFormatTable: DateFormatConfig
    averageMembersPerHousehold: number
  },
  logoUrl?: string
): ConfigDraft {
  return {
    supportedChannels: config ? [...config.supportedChannels] : [],
    logoFile: null,
    logoUrl,
    meterChangeReasons: config
      ? config.meterChangeReasons.map((r) => ({ ...r }))
      : DEFAULT_METER_CHANGE_REASONS.map((r) => ({ ...r })),
    supplyOutageReasons: config
      ? config.supplyOutageReasons.map((r) => ({ ...r }))
      : DEFAULT_SUPPLY_OUTAGE_REASONS.map((r) => ({ ...r })),
    locationCheckRequired: config?.locationCheckRequired ?? false,
    displayDepartmentMaps: config?.displayDepartmentMaps ?? false,
    dataConsolidationTime: config?.dataConsolidationTime ?? '',
    pumpOperatorReminderNudgeTime: config?.pumpOperatorReminderNudgeTime ?? '',
    dateFormatScreen: config?.dateFormatScreen
      ? { ...config.dateFormatScreen }
      : { ...DEFAULT_DATE_FORMAT_CONFIG },
    dateFormatTable: config?.dateFormatTable
      ? { ...config.dateFormatTable }
      : { ...DEFAULT_DATE_FORMAT_CONFIG },
    averageMembersPerHousehold: config?.averageMembersPerHousehold ?? 0,
  }
}

export function ConfigurationPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const navigate = useNavigate()
  const { data: config, isLoading, isError } = useConfigurationQuery()
  const {
    data: systemChannels,
    isLoading: isSystemChannelsLoading,
    isError: isSystemChannelsError,
  } = useSystemChannelsQuery()
  const {
    data: logoBlobData,
    isLoading: isLogoLoading,
    isError: isLogoError,
    error: logoError,
  } = useLogoQuery()

  const logoObjectUrl = useMemo(() => {
    if (logoBlobData instanceof Blob) return URL.createObjectURL(logoBlobData)
    return null
  }, [logoBlobData])

  useEffect(() => {
    return () => {
      if (logoObjectUrl) URL.revokeObjectURL(logoObjectUrl)
    }
  }, [logoObjectUrl])
  const saveMutation = useSaveConfigurationMutation()
  const updateLogoMutation = useUpdateLogoMutation()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<ConfigDraft | null>(null)
  const [avgMembersStr, setAvgMembersStr] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.title = `${t('configuration.pageTitle')} | JalSoochak`
  }, [t])

  const effectiveIsEditing = isEditing || Boolean(config && !config.isConfigured)

  const hasChanges = useMemo(() => {
    if (!config || !draft || !config.isConfigured) return false
    const compare = (a: string, b: string) => a.localeCompare(b)
    const channelsChanged =
      [...draft.supportedChannels].sort(compare).join() !==
      [...config.supportedChannels].sort(compare).join()
    const sortById = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id)
    const reasonsChanged =
      JSON.stringify([...draft.meterChangeReasons].sort(sortById)) !==
      JSON.stringify([...config.meterChangeReasons].sort(sortById))
    const supplyReasonsChanged =
      JSON.stringify([...draft.supplyOutageReasons].sort(sortById)) !==
      JSON.stringify([...config.supplyOutageReasons].sort(sortById))
    return (
      channelsChanged ||
      draft.logoFile !== null ||
      draft.locationCheckRequired !== config.locationCheckRequired ||
      draft.displayDepartmentMaps !== config.displayDepartmentMaps ||
      draft.dataConsolidationTime !== config.dataConsolidationTime ||
      draft.pumpOperatorReminderNudgeTime !== config.pumpOperatorReminderNudgeTime ||
      JSON.stringify(draft.dateFormatScreen) !== JSON.stringify(config.dateFormatScreen) ||
      JSON.stringify(draft.dateFormatTable) !== JSON.stringify(config.dateFormatTable) ||
      draft.averageMembersPerHousehold !== config.averageMembersPerHousehold ||
      reasonsChanged ||
      supplyReasonsChanged
    )
  }, [config, draft])

  const allDisplayChannels = useMemo(() => {
    const active = systemChannels ?? []
    const removed = config?.degraded ? (config.removedChannels ?? []) : []
    const removedSet = new Set(removed)
    return [...active.filter((c) => !removedSet.has(c)), ...removed]
  }, [systemChannels, config])

  const handleEdit = () => {
    const initial = buildInitialDraft(config, logoObjectUrl ?? undefined)
    setDraft(initial)
    setIsEditing(true)
    setAvgMembersStr(
      initial.averageMembersPerHousehold > 0 ? String(initial.averageMembersPerHousehold) : ''
    )
  }

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleCancel = () => {
    setDraft(null)
    setIsEditing(false)
    setAvgMembersStr('')
    setErrors({})
  }

  const validateForm = (current: ConfigDraft): boolean => {
    const newErrors: Record<string, string> = {}

    // Supported channels
    if (current.supportedChannels.length === 0) {
      newErrors.supportedChannels = t('state-admin:validation.selectAtLeastOne')
    }

    // Meter change reasons
    const nonEmptyReasonNames: string[] = []
    current.meterChangeReasons.forEach((reason) => {
      const error = validateDescriptiveField(reason.name)
      if (error) {
        newErrors[`meterReason.${reason.id}`] = t(`state-admin:validation.${error}`)
      } else if (exceedsMaxLength(reason.name, MAX_METER_REASON_LENGTH)) {
        newErrors[`meterReason.${reason.id}`] = t('state-admin:validation.maxLength', {
          max: MAX_METER_REASON_LENGTH,
        })
      } else {
        nonEmptyReasonNames.push(reason.name)
      }
    })
    if (hasDuplicates(nonEmptyReasonNames)) {
      const seen = new Set<string>()
      current.meterChangeReasons.forEach((reason) => {
        const normalized = reason.name.trim().toLowerCase()
        if (!normalized) return
        if (seen.has(normalized) && !newErrors[`meterReason.${reason.id}`]) {
          newErrors[`meterReason.${reason.id}`] = t('state-admin:validation.duplicateValue')
        }
        seen.add(normalized)
      })
    }

    // Supply outage reasons
    const nonEmptyOutageNames: string[] = []
    current.supplyOutageReasons.forEach((reason) => {
      const error = validateDescriptiveField(reason.name)
      if (error) {
        newErrors[`supplyOutageReason.${reason.id}`] = t(`state-admin:validation.${error}`)
      } else if (exceedsMaxLength(reason.name, MAX_METER_REASON_LENGTH)) {
        newErrors[`supplyOutageReason.${reason.id}`] = t('state-admin:validation.maxLength', {
          max: MAX_METER_REASON_LENGTH,
        })
      } else {
        nonEmptyOutageNames.push(reason.name)
      }
    })
    if (hasDuplicates(nonEmptyOutageNames)) {
      const seen = new Set<string>()
      current.supplyOutageReasons.forEach((reason) => {
        const normalized = reason.name.trim().toLowerCase()
        if (!normalized) return
        if (seen.has(normalized) && !newErrors[`supplyOutageReason.${reason.id}`]) {
          newErrors[`supplyOutageReason.${reason.id}`] = t('state-admin:validation.duplicateValue')
        }
        seen.add(normalized)
      })
    }

    // Time fields
    if (!current.dataConsolidationTime) {
      newErrors.dataConsolidationTime = t('state-admin:validation.timeRequired')
    }
    if (!current.pumpOperatorReminderNudgeTime) {
      newErrors.pumpOperatorReminderNudgeTime = t('state-admin:validation.timeRequired')
    }

    // Average members
    if (!current.averageMembersPerHousehold || current.averageMembersPerHousehold <= 0) {
      newErrors.averageMembersPerHousehold = t('state-admin:validation.mustBePositive')
    } else if (current.averageMembersPerHousehold > MAX_AVG_MEMBERS) {
      newErrors.averageMembersPerHousehold = t('state-admin:validation.mustBeInRange', {
        min: 1,
        max: MAX_AVG_MEMBERS,
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async (andNavigate = false) => {
    const current = draft ?? buildInitialDraft(config ?? undefined, logoObjectUrl ?? undefined)

    if (!validateForm(current)) return

    try {
      if (current.logoFile) {
        await updateLogoMutation.mutateAsync(current.logoFile)
      }

      await saveMutation.mutateAsync({
        supportedChannels: current.supportedChannels,
        meterChangeReasons: current.meterChangeReasons,
        supplyOutageReasons: current.supplyOutageReasons,
        locationCheckRequired: current.locationCheckRequired,
        displayDepartmentMaps: current.displayDepartmentMaps,
        dataConsolidationTime: current.dataConsolidationTime,
        pumpOperatorReminderNudgeTime: current.pumpOperatorReminderNudgeTime,
        dateFormatScreen: current.dateFormatScreen,
        dateFormatTable: current.dateFormatTable,
        averageMembersPerHousehold: current.averageMembersPerHousehold,
        isConfigured: true,
      })
      setDraft(null)
      setIsEditing(false)
      setAvgMembersStr('')
      setErrors({})
      toast.addToast(t('configuration.messages.saveSuccess'), 'success')
      if (andNavigate) navigate(ROUTES.STATE_ADMIN_LANGUAGE)
    } catch {
      toast.addToast(t('configuration.messages.saveFailed'), 'error')
    }
  }

  const handleChannelChange = (values: string[]) => {
    setDraft((prev) => ({
      ...(prev ?? buildInitialDraft(config, logoObjectUrl ?? undefined)),
      supportedChannels: values,
    }))
    clearError('supportedChannels')
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const MAX_LOGO_SIZE = 2 * 1024 * 1024 // 2MB
    if (file.size > MAX_LOGO_SIZE) {
      setErrors((prev) => ({ ...prev, logo: t('configuration.messages.validation.logoTooLarge') }))
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    const ALLOWED_TYPES = ['image/png', 'image/jpeg']
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        logo: t('configuration.messages.validation.logoInvalidType'),
      }))
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    clearError('logo')
    setDraft((prev) => ({
      ...(prev ?? buildInitialDraft(config, logoObjectUrl ?? undefined)),
      logoFile: file,
      logoUrl: URL.createObjectURL(file),
    }))
  }

  if (isLoading) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={6}>
          {t('configuration.pageTitle')}
        </Heading>
        <Flex align="center" role="status" aria-live="polite" aria-busy="true">
          <Spinner size="md" color="primary.500" mr={3} />
          <Text color="neutral.600">{t('common:loading')}</Text>
        </Flex>
      </Box>
    )
  }

  if (isError || !config) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={6}>
          {t('configuration.pageTitle')}
        </Heading>
        <Text color="error.500">{t('common:toast.failedToLoad')}</Text>
      </Box>
    )
  }

  const activeDraft = draft ?? buildInitialDraft(config, logoObjectUrl ?? undefined)

  const displayAvgStr =
    avgMembersStr !== '' || effectiveIsEditing
      ? avgMembersStr
      : activeDraft.averageMembersPerHousehold > 0
        ? String(activeDraft.averageMembersPerHousehold)
        : ''

  const halfChannels = Math.ceil(allDisplayChannels.length / 2)

  return (
    <Box w="full">
      <Box mb={5}>
        <Heading
          as="h1"
          size={{ base: 'h2', md: 'h1' }}
          mb={effectiveIsEditing && config.isConfigured ? 2 : 0}
        >
          {t('configuration.pageTitle')}
        </Heading>
        {effectiveIsEditing && config.isConfigured && (
          <Flex as="nav" aria-label="Breadcrumb" gap={2} flexWrap="wrap">
            <Button
              variant="link"
              fontSize="14px"
              lineHeight="21px"
              color="neutral.500"
              fontWeight="normal"
              _hover={{ textDecoration: 'underline' }}
              onClick={handleCancel}
            >
              {t('configuration.breadcrumb.view')}
            </Button>
            <Text fontSize="14px" lineHeight="21px" color="neutral.500" aria-hidden="true">
              /
            </Text>
            <Text fontSize="14px" lineHeight="21px" color="neutral.800" aria-current="page">
              {t('configuration.breadcrumb.edit')}
            </Text>
          </Flex>
        )}
      </Box>

      <Box
        as="section"
        aria-labelledby="configuration-heading"
        bg="white"
        borderWidth="0.5px"
        borderColor="neutral.100"
        borderRadius={{ base: 'lg', md: 'xl' }}
        w="full"
        minH={{ base: 'auto', lg: 'calc(100vh - 148px)' }}
        py={{ base: 4, md: 6 }}
        px={4}
      >
        <Flex direction="column" w="full" h="full" justify="space-between">
          {/* Card Header */}
          <Flex justify="space-between" align="center" mb={4}>
            <Heading
              as="h2"
              id="configuration-heading"
              size="h3"
              textStyle="h8"
              fontWeight="400"
              fontSize={{ base: 'md', md: 'xl' }}
            >
              {t('configuration.sectionTitle')}
            </Heading>
            {config.isConfigured && !effectiveIsEditing && (
              <Button
                variant="ghost"
                h={6}
                w={6}
                minW={6}
                pl="2px"
                pr="2px"
                onClick={handleEdit}
                color="neutral.950"
                _hover={{ bg: 'primary.50', color: 'primary.500' }}
                aria-label={t('configuration.aria.editConfiguration')}
              >
                <EditIcon h={5} w={5} aria-hidden="true" />
              </Button>
            )}
          </Flex>

          {/* View Mode */}
          {!effectiveIsEditing && config.isConfigured ? (
            <ViewMode
              config={config}
              logoUrl={logoObjectUrl ?? undefined}
              isLogoLoading={isLogoLoading}
              isLogoError={isLogoError}
              notFound={
                (logoError as { status?: number } | null)?.status === 404 ||
                (logoError as { response?: { status?: number } } | null)?.response?.status === 404
              }
              t={t}
            />
          ) : (
            /* Edit Mode */
            <Flex
              as="form"
              role="form"
              aria-label={t('configuration.aria.form')}
              direction="column"
              w="full"
              justify="space-between"
              minH={{ base: 'auto', lg: 'calc(100vh - 250px)' }}
              gap={{ base: 6, lg: 0 }}
            >
              <VStack spacing={6} align="stretch">
                {/* Supported Channels — 2-column vertical flow */}
                <FormControl isInvalid={!!errors.supportedChannels}>
                  <Text
                    fontSize={{ base: 'xs', md: 'sm' }}
                    fontWeight="medium"
                    color="neutral.950"
                    mb={3}
                  >
                    {t('configuration.sections.supportedChannels.title')}
                    <Text as="span" color="error.500" ml={1}>
                      *
                    </Text>
                  </Text>
                  {isSystemChannelsLoading ? (
                    <Flex align="center" gap={2}>
                      <Spinner size="sm" color="primary.500" />
                      <Text fontSize="sm" color="neutral.600">
                        {t('common:loading')}
                      </Text>
                    </Flex>
                  ) : isSystemChannelsError ? (
                    <Text fontSize="sm" color="error.500">
                      {t('common:toast.failedToLoad')}
                    </Text>
                  ) : (
                    <CheckboxGroup
                      value={activeDraft.supportedChannels}
                      onChange={handleChannelChange}
                    >
                      <SimpleGrid columns={2} spacing={3} w={{ base: 'full', md: '400px' }}>
                        <VStack align="start" spacing={3}>
                          {allDisplayChannels.slice(0, halfChannels).map((code) => {
                            const isRemoved =
                              config?.degraded && (config.removedChannels ?? []).includes(code)
                            return (
                              <HStack key={code} spacing={1} align="center">
                                <Checkbox value={code} isDisabled={!!isRemoved}>
                                  <Text
                                    fontSize="sm"
                                    color={isRemoved ? 'neutral.400' : 'neutral.950'}
                                  >
                                    {CHANNEL_CODE_TO_NAME[code] ?? code}
                                  </Text>
                                </Checkbox>
                                {isRemoved && (
                                  <ActionTooltip
                                    label={t(
                                      'configuration.sections.supportedChannels.degradedTooltip'
                                    )}
                                  >
                                    <WarningTwoIcon
                                      color="error.500"
                                      boxSize={3}
                                      aria-label={t(
                                        'configuration.sections.supportedChannels.degradedTooltip'
                                      )}
                                    />
                                  </ActionTooltip>
                                )}
                              </HStack>
                            )
                          })}
                        </VStack>
                        <VStack align="start" spacing={3}>
                          {allDisplayChannels.slice(halfChannels).map((code) => {
                            const isRemoved =
                              config?.degraded && (config.removedChannels ?? []).includes(code)
                            return (
                              <HStack key={code} spacing={1} align="center">
                                <Checkbox value={code} isDisabled={!!isRemoved}>
                                  <Text
                                    fontSize="sm"
                                    color={isRemoved ? 'neutral.400' : 'neutral.950'}
                                  >
                                    {CHANNEL_CODE_TO_NAME[code] ?? code}
                                  </Text>
                                </Checkbox>
                                {isRemoved && (
                                  <ActionTooltip
                                    label={t(
                                      'configuration.sections.supportedChannels.degradedTooltip'
                                    )}
                                  >
                                    <WarningTwoIcon
                                      color="error.500"
                                      boxSize={3}
                                      aria-label={t(
                                        'configuration.sections.supportedChannels.degradedTooltip'
                                      )}
                                    />
                                  </ActionTooltip>
                                )}
                              </HStack>
                            )
                          })}
                        </VStack>
                      </SimpleGrid>
                    </CheckboxGroup>
                  )}
                  <FormErrorMessage>{errors.supportedChannels}</FormErrorMessage>
                </FormControl>

                {/* 4. Meter Change Reasons */}
                <MeterChangeReasonsSection
                  title={t('configuration.sections.meterChangeReasons.title')}
                  reasons={activeDraft.meterChangeReasons}
                  errors={errors}
                  onClearError={clearError}
                  onChange={(reasons) =>
                    setDraft((prev) => ({
                      ...(prev ?? buildInitialDraft(config, logoObjectUrl ?? undefined)),
                      meterChangeReasons: reasons,
                    }))
                  }
                />

                {/* 5. Supply Outage Reasons */}
                <SupplyOutageReasonsSection
                  title={t('configuration.sections.supplyOutageReasons.title')}
                  reasons={activeDraft.supplyOutageReasons}
                  errors={errors}
                  onClearError={clearError}
                  onChange={(reasons) =>
                    setDraft((prev) => ({
                      ...(prev ?? buildInitialDraft(config, logoObjectUrl ?? undefined)),
                      supplyOutageReasons: reasons,
                    }))
                  }
                />

                {/* 6. Record Location + Display Department Maps side by side */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  {/* Record Location */}
                  <Box>
                    <Text
                      fontSize={{ base: 'xs', md: 'sm' }}
                      fontWeight="medium"
                      color="neutral.950"
                      mb={3}
                    >
                      {t('configuration.sections.locationCheckRequired.title')}
                    </Text>
                    <RadioGroup
                      value={activeDraft.locationCheckRequired ? 'yes' : 'no'}
                      onChange={(val) =>
                        setDraft((prev) => ({
                          ...(prev ?? buildInitialDraft(config, logoObjectUrl ?? undefined)),
                          locationCheckRequired: val === 'yes',
                        }))
                      }
                    >
                      <HStack spacing={6}>
                        <Radio value="yes">
                          <Text fontSize="sm" color="neutral.950">
                            {t('configuration.sections.locationCheckRequired.yes')}
                          </Text>
                        </Radio>
                        <Radio value="no">
                          <Text fontSize="sm" color="neutral.950">
                            {t('configuration.sections.locationCheckRequired.no')}
                          </Text>
                        </Radio>
                      </HStack>
                    </RadioGroup>
                  </Box>

                  {/* Display Department Maps */}
                  <Box>
                    <Text
                      fontSize={{ base: 'xs', md: 'sm' }}
                      fontWeight="medium"
                      color="neutral.950"
                      mb={3}
                    >
                      {t('configuration.sections.displayDepartmentMaps.title')}
                    </Text>
                    <RadioGroup
                      value={activeDraft.displayDepartmentMaps ? 'yes' : 'no'}
                      onChange={(val) =>
                        setDraft((prev) => ({
                          ...(prev ?? buildInitialDraft(config, logoObjectUrl ?? undefined)),
                          displayDepartmentMaps: val === 'yes',
                        }))
                      }
                    >
                      <HStack spacing={6}>
                        <Radio value="yes">
                          <Text fontSize="sm" color="neutral.950">
                            {t('configuration.sections.displayDepartmentMaps.yes')}
                          </Text>
                        </Radio>
                        <Radio value="no">
                          <Text fontSize="sm" color="neutral.950">
                            {t('configuration.sections.displayDepartmentMaps.no')}
                          </Text>
                        </Radio>
                      </HStack>
                    </RadioGroup>
                  </Box>
                </SimpleGrid>

                {/* 7. Data Consolidation Time + Pump Operator Reminder Nudge Time */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <FormControl isInvalid={!!errors.dataConsolidationTime}>
                    <Text
                      as="label"
                      htmlFor="data-consolidation-time"
                      fontSize={{ base: 'xs', md: 'sm' }}
                      fontWeight="medium"
                      color="neutral.950"
                      mb={1}
                      display="block"
                    >
                      {t('configuration.sections.dataConsolidationTime.title')}
                    </Text>
                    <Input
                      id="data-consolidation-time"
                      type="time"
                      lang="en-GB"
                      value={activeDraft.dataConsolidationTime}
                      onChange={(e) => {
                        setDraft((prev) => ({
                          ...(prev ?? buildInitialDraft(config, logoObjectUrl ?? undefined)),
                          dataConsolidationTime: e.target.value,
                        }))
                        clearError('dataConsolidationTime')
                      }}
                      h="36px"
                      w={{ base: 'full', xl: '486px' }}
                      fontSize="sm"
                      borderColor="neutral.300"
                      borderRadius="6px"
                      _hover={{ borderColor: 'neutral.400' }}
                      _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
                      sx={{ '&::-webkit-datetime-edit-ampm-field': { display: 'none' } }}
                    />
                    <FormErrorMessage>{errors.dataConsolidationTime}</FormErrorMessage>
                  </FormControl>
                  <FormControl isInvalid={!!errors.pumpOperatorReminderNudgeTime}>
                    <Text
                      as="label"
                      htmlFor="pump-operator-nudge-time"
                      fontSize={{ base: 'xs', md: 'sm' }}
                      fontWeight="medium"
                      color="neutral.950"
                      mb={1}
                      display="block"
                    >
                      {t('configuration.sections.pumpOperatorReminderNudgeTime.title')}
                    </Text>
                    <Input
                      id="pump-operator-nudge-time"
                      type="time"
                      lang="en-GB"
                      value={activeDraft.pumpOperatorReminderNudgeTime}
                      onChange={(e) => {
                        setDraft((prev) => ({
                          ...(prev ?? buildInitialDraft(config, logoObjectUrl ?? undefined)),
                          pumpOperatorReminderNudgeTime: e.target.value,
                        }))
                        clearError('pumpOperatorReminderNudgeTime')
                      }}
                      h="36px"
                      w={{ base: 'full', xl: '486px' }}
                      fontSize="sm"
                      borderColor="neutral.300"
                      borderRadius="6px"
                      _hover={{ borderColor: 'neutral.400' }}
                      _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
                      sx={{ '&::-webkit-datetime-edit-ampm-field': { display: 'none' } }}
                    />
                    <FormErrorMessage>{errors.pumpOperatorReminderNudgeTime}</FormErrorMessage>
                  </FormControl>
                </SimpleGrid>

                {/* 8. Screen Date Format + Table Date Format */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <DateFormatSection
                    title={t('configuration.sections.dateFormatScreen.title')}
                    value={activeDraft.dateFormatScreen}
                    onChange={(val) =>
                      setDraft((prev) => ({
                        ...(prev ?? buildInitialDraft(config, logoObjectUrl ?? undefined)),
                        dateFormatScreen: val,
                      }))
                    }
                  />
                  <DateFormatSection
                    title={t('configuration.sections.dateFormatTable.title')}
                    value={activeDraft.dateFormatTable}
                    onChange={(val) =>
                      setDraft((prev) => ({
                        ...(prev ?? buildInitialDraft(config, logoObjectUrl ?? undefined)),
                        dateFormatTable: val,
                      }))
                    }
                  />
                </SimpleGrid>

                {/* 9. Average Members Per Household */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <FormControl isInvalid={!!errors.averageMembersPerHousehold}>
                    <Text
                      as="label"
                      htmlFor="avg-members"
                      fontSize={{ base: 'xs', md: 'sm' }}
                      fontWeight="medium"
                      color="neutral.950"
                      mb={1}
                      display="block"
                    >
                      {t('configuration.sections.averageMembersPerHousehold.title')}
                    </Text>
                    <Input
                      id="avg-members"
                      type="number"
                      step="any"
                      min="0"
                      value={displayAvgStr}
                      onChange={(e) => {
                        const raw = e.target.value
                        setAvgMembersStr(raw)
                        clearError('averageMembersPerHousehold')
                        if (raw.trim() === '') {
                          setDraft((prev) => ({
                            ...(prev ?? buildInitialDraft(config, logoObjectUrl ?? undefined)),
                            averageMembersPerHousehold: 0,
                          }))
                          return
                        }
                        const parsed = Number(raw)
                        if (!Number.isFinite(parsed) || parsed < 0) return
                        setDraft((prev) => ({
                          ...(prev ?? buildInitialDraft(config, logoObjectUrl ?? undefined)),
                          averageMembersPerHousehold: parsed,
                        }))
                      }}
                      aria-label={t('configuration.sections.averageMembersPerHousehold.title')}
                      h="36px"
                      w={{ base: 'full', xl: '486px' }}
                      fontSize="sm"
                      borderColor="neutral.300"
                      borderRadius="6px"
                      _hover={{ borderColor: 'neutral.400' }}
                      _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
                    />
                    <FormErrorMessage>{errors.averageMembersPerHousehold}</FormErrorMessage>
                  </FormControl>
                </SimpleGrid>

                {/* 10. Logo (last) */}
                <FormControl isInvalid={!!errors.logo}>
                  <Text
                    fontSize={{ base: 'xs', md: 'sm' }}
                    fontWeight="medium"
                    color="neutral.950"
                    mb={3}
                  >
                    {t('configuration.sections.logo.title')}
                  </Text>
                  <HStack spacing={3} align="center" flexWrap="wrap">
                    {activeDraft.logoUrl && (
                      <Box
                        as="img"
                        src={activeDraft.logoUrl}
                        alt={t('configuration.sections.logo.currentLogo')}
                        h="40px"
                        w="40px"
                        objectFit="contain"
                        borderWidth="0.5px"
                        borderColor="neutral.100"
                        borderRadius="md"
                      />
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      style={{ display: 'none' }}
                      onChange={handleLogoChange}
                      aria-label={t('configuration.sections.logo.uploadButton')}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      fontWeight="600"
                      gap={1}
                      leftIcon={<FiUpload aria-hidden="true" />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {t('configuration.sections.logo.uploadButton')}
                    </Button>
                    <Text fontSize="xs" color="neutral.500">
                      {t('configuration.sections.logo.hint')}
                    </Text>
                  </HStack>
                  <FormErrorMessage>{errors.logo}</FormErrorMessage>
                </FormControl>
              </VStack>

              {/* Action Buttons */}
              <HStack
                spacing={3}
                justify={{ base: 'stretch', sm: 'flex-end' }}
                flexDirection={{ base: 'column-reverse', sm: 'row' }}
                mt={{ base: 4, lg: 6 }}
              >
                <Button
                  variant="secondary"
                  size="md"
                  width={{ base: 'full', sm: '174px' }}
                  onClick={handleCancel}
                  isDisabled={saveMutation.isPending || updateLogoMutation.isPending}
                >
                  {t('common:button.cancel')}
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  width={{ base: 'full', sm: '174px' }}
                  onClick={() => handleSave(!config.isConfigured)}
                  isLoading={saveMutation.isPending || updateLogoMutation.isPending}
                  isDisabled={
                    (config.isConfigured && !hasChanges) ||
                    saveMutation.isPending ||
                    updateLogoMutation.isPending
                  }
                >
                  {config.isConfigured
                    ? t('common:button.saveChanges')
                    : t('common:button.saveAndNext')}
                </Button>
              </HStack>
            </Flex>
          )}
        </Flex>
      </Box>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </Box>
  )
}

// ─── View Mode ────────────────────────────────────────────────────────────────

function ViewField({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box>
      <Text
        fontSize={{ base: 'xs', md: 'sm' }}
        fontWeight="medium"
        color={color ?? 'neutral.950'}
        mb={1}
      >
        {label}
      </Text>
      <Text fontSize={{ base: 'xs', md: 'sm' }} color="neutral.950">
        {value || '-'}
      </Text>
    </Box>
  )
}

function ViewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium" color="neutral.950" mb={3}>
        {title}
      </Text>
      {children}
    </Box>
  )
}

function ViewMode({
  config,
  logoUrl,
  isLogoLoading,
  isLogoError,
  notFound,
  t,
}: {
  config: NonNullable<ReturnType<typeof useConfigurationQuery>['data']>
  logoUrl: string | undefined
  isLogoLoading: boolean
  isLogoError: boolean
  notFound: boolean
  t: ReturnType<typeof useTranslation<['state-admin', 'common']>>['t']
}) {
  return (
    <VStack spacing={6} align="stretch">
      {/* Supported Channels */}
      <ViewSection title={t('configuration.sections.supportedChannels.title')}>
        <Text fontSize="sm" color="neutral.950">
          {config.supportedChannels.length > 0
            ? config.supportedChannels.map((c) => CHANNEL_CODE_TO_NAME[c] ?? c).join(', ')
            : '-'}
        </Text>
      </ViewSection>

      {/* Meter Change Reasons — 2-column grid */}
      <ViewSection title={t('configuration.sections.meterChangeReasons.title')}>
        {config.meterChangeReasons.length > 0 ? (
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
            {config.meterChangeReasons.map((r) => (
              <Text key={r.id} fontSize="sm" color="neutral.950">
                {r.name}
              </Text>
            ))}
          </SimpleGrid>
        ) : (
          <Text fontSize="sm" color="neutral.500">
            -
          </Text>
        )}
      </ViewSection>

      {/* Supply Outage Reasons — 2-column grid */}
      <ViewSection title={t('configuration.sections.supplyOutageReasons.title')}>
        {config.supplyOutageReasons.length > 0 ? (
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
            {config.supplyOutageReasons.map((r) => (
              <Text key={r.id} fontSize="sm" color="neutral.950">
                {r.name}
              </Text>
            ))}
          </SimpleGrid>
        ) : (
          <Text fontSize="sm" color="neutral.500">
            -
          </Text>
        )}
      </ViewSection>

      {/* Record Location + Display Department Maps side by side */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <ViewField
          label={t('configuration.sections.locationCheckRequired.title')}
          value={
            config.locationCheckRequired
              ? t('configuration.sections.locationCheckRequired.yes')
              : t('configuration.sections.locationCheckRequired.no')
          }
          color="neutral.950"
        />
        <ViewField
          label={t('configuration.sections.displayDepartmentMaps.title')}
          value={
            config.displayDepartmentMaps
              ? t('configuration.sections.displayDepartmentMaps.yes')
              : t('configuration.sections.displayDepartmentMaps.no')
          }
          color="neutral.950"
        />
      </SimpleGrid>

      {/* Data Consolidation Time + Pump Operator Reminder Nudge Time */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <ViewField
          label={t('configuration.sections.dataConsolidationTime.title')}
          value={config.dataConsolidationTime}
          color="neutral.950"
        />
        <ViewField
          label={t('configuration.sections.pumpOperatorReminderNudgeTime.title')}
          value={config.pumpOperatorReminderNudgeTime}
          color="neutral.950"
        />
      </SimpleGrid>

      {/* Screen Date Format + Table Date Format */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <ViewSection title={t('configuration.sections.dateFormatScreen.title')}>
          <VStack align="stretch" spacing={1}>
            <Text fontSize="sm" color="neutral.950">
              {t('configuration.sections.dateFormat.dateFormat')}:{' '}
              {config.dateFormatScreen.dateFormat ?? '-'}
            </Text>
            <Text fontSize="sm" color="neutral.950">
              {t('configuration.sections.dateFormat.timeFormat')}:{' '}
              {config.dateFormatScreen.timeFormat ?? '-'}
            </Text>
            <Text fontSize="sm" color="neutral.950">
              {t('configuration.sections.dateFormat.timezone')}:{' '}
              {config.dateFormatScreen.timezone ?? '-'}
            </Text>
          </VStack>
        </ViewSection>
        <ViewSection title={t('configuration.sections.dateFormatTable.title')}>
          <VStack align="stretch" spacing={1}>
            <Text fontSize="sm" color="neutral.950">
              {t('configuration.sections.dateFormat.dateFormat')}:{' '}
              {config.dateFormatTable.dateFormat ?? '-'}
            </Text>
            <Text fontSize="sm" color="neutral.950">
              {t('configuration.sections.dateFormat.timeFormat')}:{' '}
              {config.dateFormatTable.timeFormat ?? '-'}
            </Text>
            <Text fontSize="sm" color="neutral.950">
              {t('configuration.sections.dateFormat.timezone')}:{' '}
              {config.dateFormatTable.timezone ?? '-'}
            </Text>
          </VStack>
        </ViewSection>
      </SimpleGrid>

      {/* Average Members Per Household */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <ViewField
          label={t('configuration.sections.averageMembersPerHousehold.title')}
          value={
            config.averageMembersPerHousehold > 0 ? String(config.averageMembersPerHousehold) : '-'
          }
          color="neutral.950"
        />
      </SimpleGrid>

      {/* Logo (last) */}
      <ViewSection title={t('configuration.sections.logo.title')}>
        {isLogoLoading ? (
          <Spinner size="sm" color="primary.500" aria-label="Loading logo" />
        ) : isLogoError && !notFound ? (
          <Text fontSize="sm" color="error.500">
            {t('common:toast.failedToLoad')}
          </Text>
        ) : logoUrl ? (
          <Box
            as="img"
            src={logoUrl}
            alt={t('configuration.sections.logo.currentLogo')}
            h="48px"
            objectFit="contain"
          />
        ) : (
          <Text fontSize="sm" color="neutral.500">
            -
          </Text>
        )}
      </ViewSection>
    </VStack>
  )
}
