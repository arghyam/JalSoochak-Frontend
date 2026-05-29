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
  RadioGroup,
  Radio,
  Input,
  SimpleGrid,
  FormControl,
  FormErrorMessage,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { EditIcon } from '@chakra-ui/icons'
import { FiUpload } from 'react-icons/fi'
import { useToast } from '@/shared/hooks/use-toast'
import { ToastContainer, PageHeader, RequiredIndicator } from '@/shared/components/common'
import {
  useConfigStatusQuery,
  useConfigurationQuery,
  useLogoQuery,
  useSaveConfigurationMutation,
  useSystemChannelsQuery,
  useUpdateLogoMutation,
  useLgdHierarchyQuery,
  useDepartmentHierarchyQuery,
} from '../../services/query/use-state-admin-queries'
import type { ConfigKey } from '../../types/config-status'
import {
  FALLBACK_SYSTEM_CHANNELS,
  DEFAULT_DATE_FORMAT_CONFIG,
  DEFAULT_METER_CHANGE_REASONS,
  DEFAULT_SUPPLY_OUTAGE_REASONS,
  type DateFormatConfig,
  type MeterChangeReason,
  type SupplyOutageReason,
  type SupportedChannel,
} from '../../types/configuration'
import { MeterChangeReasonsSection } from './meter-change-reasons-section'
import { SupplyOutageReasonsSection } from './supply-outage-reasons-section'
import { DateFormatSection } from './date-format-section'
import { ViewMode, FieldInfoIcon } from './configuration-view-mode'
import { ChannelsSection } from './channels-section'
import { MapLevelsSection } from './map-levels-section'
import { NudgeTimeSection } from './nudge-time-section'
import {
  validateDescriptiveField,
  hasDuplicates,
  exceedsMaxLength,
  descriptiveNameToReasonId,
  isClientGeneratedConfigurationReasonId,
} from '@/shared/utils/validation'
import { ROUTES } from '@/shared/constants/routes'
import type { TFunction } from 'i18next'

const MAX_METER_REASON_LENGTH = 100
const MAX_AVG_MEMBERS = 20

interface ConfigDraft {
  supportedChannels: SupportedChannel[]
  logoFile: File | null
  logoUrl?: string
  meterChangeReasons: MeterChangeReason[]
  supplyOutageReasons: SupplyOutageReason[]
  locationCheckRequired: boolean
  displayMapLgdLevels: boolean[]
  displayDepartmentMapLevels: boolean[]
  dataConsolidationTime: string
  pumpOperatorReminderNudgeTime: string
  dateFormatScreen: DateFormatConfig
  dateFormatTable: DateFormatConfig
  averageMembersPerHousehold: number
}

function padArrayToLength(arr: boolean[], length: number, defaultValue: boolean): boolean[] {
  const result = [...arr]
  while (result.length < length) {
    result.push(defaultValue)
  }
  return result.slice(0, length)
}

function buildInitialDraft(
  config?: {
    supportedChannels: SupportedChannel[]
    meterChangeReasons: MeterChangeReason[]
    supplyOutageReasons: SupplyOutageReason[]
    locationCheckRequired: boolean
    displayMapLgdLevels: boolean[]
    displayDepartmentMapLevels: boolean[]
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
    displayMapLgdLevels: padArrayToLength(config?.displayMapLgdLevels ?? [], 6, true),
    displayDepartmentMapLevels: padArrayToLength(config?.displayDepartmentMapLevels ?? [], 6, true),
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

function mapMeterChangeReasonIdsForPayload(reasons: MeterChangeReason[]): MeterChangeReason[] {
  return reasons.map((r) =>
    isClientGeneratedConfigurationReasonId(r.id)
      ? { ...r, id: descriptiveNameToReasonId(r.name) }
      : r
  )
}

function mapSupplyOutageReasonIdsForPayload(reasons: SupplyOutageReason[]): SupplyOutageReason[] {
  return reasons.map((r) =>
    isClientGeneratedConfigurationReasonId(r.id)
      ? { ...r, id: descriptiveNameToReasonId(r.name) }
      : r
  )
}

function buildConfigurationValidationErrors(
  current: ConfigDraft,
  isMandatory: (key: ConfigKey) => boolean,
  t: TFunction<['state-admin', 'common']>
): Record<string, string> {
  const newErrors: Record<string, string> = {}

  if (isMandatory('TENANT_SUPPORTED_CHANNELS') && current.supportedChannels.length === 0) {
    newErrors.supportedChannels = t('state-admin:validation.selectAtLeastOne')
  }

  if (isMandatory('METER_CHANGE_REASONS') && current.meterChangeReasons.length === 0) {
    newErrors.meterChangeReasons = t('state-admin:validation.selectAtLeastOne')
  }

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

  if (isMandatory('SUPPLY_OUTAGE_REASONS') && current.supplyOutageReasons.length === 0) {
    newErrors.supplyOutageReasons = t('state-admin:validation.selectAtLeastOne')
  }

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

  if (isMandatory('TENANT_LOGO') && !current.logoUrl && !current.logoFile) {
    newErrors.logo = t('configuration.messages.validation.logoRequired')
  }

  if (isMandatory('DATE_FORMAT_SCREEN') && !current.dateFormatScreen.dateFormat) {
    newErrors.dateFormatScreen = t('configuration.messages.validation.dateFormatScreenRequired')
  }

  if (isMandatory('DATE_FORMAT_TABLE') && !current.dateFormatTable.dateFormat) {
    newErrors.dateFormatTable = t('configuration.messages.validation.dateFormatTableRequired')
  }

  if (isMandatory('DATA_CONSOLIDATION_TIME') && !current.dataConsolidationTime) {
    newErrors.dataConsolidationTime = t('state-admin:validation.timeRequired')
  }
  if (isMandatory('PUMP_OPERATOR_REMINDER_NUDGE_TIME') && !current.pumpOperatorReminderNudgeTime) {
    newErrors.pumpOperatorReminderNudgeTime = t('state-admin:validation.timeRequired')
  }

  if (isMandatory('AVERAGE_MEMBERS_PER_HOUSEHOLD')) {
    if (!current.averageMembersPerHousehold || current.averageMembersPerHousehold <= 0) {
      newErrors.averageMembersPerHousehold = t('state-admin:validation.mustBePositive')
    } else if (current.averageMembersPerHousehold > MAX_AVG_MEMBERS) {
      newErrors.averageMembersPerHousehold = t('state-admin:validation.mustBeInRange', {
        min: 1,
        max: MAX_AVG_MEMBERS,
      })
    }
  } else if (current.averageMembersPerHousehold > MAX_AVG_MEMBERS) {
    newErrors.averageMembersPerHousehold = t('state-admin:validation.mustBeInRange', {
      min: 1,
      max: MAX_AVG_MEMBERS,
    })
  }

  return newErrors
}

function getFirstConfigurationErrorFieldId(
  newErrors: Record<string, string>,
  current: ConfigDraft
): string | null {
  if (newErrors.supportedChannels) return 'config-field-supported-channels'
  for (const r of current.meterChangeReasons) {
    if (newErrors[`meterReason.${r.id}`]) return `config-field-meter-reason-${r.id}`
  }
  if (newErrors.meterChangeReasons) return 'config-section-meter-change-reasons'
  for (const r of current.supplyOutageReasons) {
    if (newErrors[`supplyOutageReason.${r.id}`]) return `config-field-supply-outage-${r.id}`
  }
  if (newErrors.supplyOutageReasons) return 'config-section-supply-outage-reasons'
  if (newErrors.logo) return 'config-field-logo'
  if (newErrors.dateFormatScreen) return 'config-field-date-format-screen'
  if (newErrors.dateFormatTable) return 'config-field-date-format-table'
  if (newErrors.dataConsolidationTime) return 'data-consolidation-time'
  if (newErrors.pumpOperatorReminderNudgeTime) return 'pump-operator-nudge-time'
  if (newErrors.averageMembersPerHousehold) return 'avg-members'
  return null
}

function scrollToFirstConfigurationError(
  newErrors: Record<string, string>,
  current: ConfigDraft
): void {
  const targetId = getFirstConfigurationErrorFieldId(newErrors, current)
  if (!targetId) return
  queueMicrotask(() => {
    const el = document.getElementById(targetId)
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    if (
      el instanceof HTMLInputElement ||
      el instanceof HTMLSelectElement ||
      el instanceof HTMLTextAreaElement
    ) {
      el.focus({ preventScroll: true })
    }
  })
}

export function ConfigurationPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const navigate = useNavigate()
  const { data: config, isLoading, isError } = useConfigurationQuery()
  const { data: configStatuses } = useConfigStatusQuery()
  const isMandatory = (key: ConfigKey): boolean => configStatuses?.[key]?.mandatory ?? true
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
  const { data: lgdHierarchy } = useLgdHierarchyQuery()
  const { data: departmentHierarchy } = useDepartmentHierarchyQuery()

  const lgdLevelCount = Math.min(
    lgdHierarchy?.levels.length ?? config?.displayMapLgdLevels.length ?? 0,
    6
  )
  const deptLevelCount = Math.min(
    departmentHierarchy?.levels.length ?? config?.displayDepartmentMapLevels.length ?? 0,
    6
  )

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
    const mapLgdLevelsChanged =
      JSON.stringify(draft.displayMapLgdLevels) !== JSON.stringify(config.displayMapLgdLevels)
    const mapDeptLevelsChanged =
      JSON.stringify(draft.displayDepartmentMapLevels) !==
      JSON.stringify(config.displayDepartmentMapLevels)
    return (
      channelsChanged ||
      draft.logoFile !== null ||
      draft.locationCheckRequired !== config.locationCheckRequired ||
      mapLgdLevelsChanged ||
      mapDeptLevelsChanged ||
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
    const active: SupportedChannel[] =
      systemChannels && systemChannels.length > 0 ? systemChannels : FALLBACK_SYSTEM_CHANNELS
    const selected: SupportedChannel[] = config?.supportedChannels ?? []
    const removed: SupportedChannel[] = config?.degraded ? (config.removedChannels ?? []) : []

    const removedSet = new Set<SupportedChannel>(removed)
    const merged = Array.from(new Set<SupportedChannel>([...active, ...selected]))

    return [...merged.filter((c) => !removedSet.has(c)), ...Array.from(removedSet)]
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

  const handleSave = async (andNavigate = false) => {
    const current = draft ?? buildInitialDraft(config ?? undefined, logoObjectUrl ?? undefined)

    const newErrors = buildConfigurationValidationErrors(current, isMandatory, t)
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      scrollToFirstConfigurationError(newErrors, current)
      return
    }

    try {
      if (current.logoFile) {
        await updateLogoMutation.mutateAsync(current.logoFile)
      }

      await saveMutation.mutateAsync({
        supportedChannels: current.supportedChannels,
        meterChangeReasons: mapMeterChangeReasonIdsForPayload(current.meterChangeReasons),
        supplyOutageReasons: mapSupplyOutageReasonIdsForPayload(current.supplyOutageReasons),
        locationCheckRequired: current.locationCheckRequired,
        displayMapLgdLevels: current.displayMapLgdLevels,
        displayDepartmentMapLevels: current.displayDepartmentMapLevels,
        dataConsolidationTime:
          isMandatory('DATA_CONSOLIDATION_TIME') || current.dataConsolidationTime
            ? current.dataConsolidationTime
            : '',
        pumpOperatorReminderNudgeTime:
          isMandatory('PUMP_OPERATOR_REMINDER_NUDGE_TIME') || current.pumpOperatorReminderNudgeTime
            ? current.pumpOperatorReminderNudgeTime
            : '',
        dateFormatScreen: current.dateFormatScreen,
        dateFormatTable: current.dateFormatTable,
        averageMembersPerHousehold:
          isMandatory('AVERAGE_MEMBERS_PER_HOUSEHOLD') || current.averageMembersPerHousehold > 0
            ? current.averageMembersPerHousehold
            : 0,
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
        <PageHeader mb={6}>
          <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
            {t('configuration.pageTitle')}
          </Heading>
        </PageHeader>
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
        <PageHeader mb={6}>
          <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
            {t('configuration.pageTitle')}
          </Heading>
        </PageHeader>
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
      <PageHeader>
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
      </PageHeader>

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
            {config.isConfigured && (
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
              lgdLevelCount={lgdLevelCount}
              deptLevelCount={deptLevelCount}
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
                <ChannelsSection
                  allDisplayChannels={allDisplayChannels}
                  halfChannels={halfChannels}
                  selectedChannels={activeDraft.supportedChannels}
                  errors={errors}
                  required={isMandatory('TENANT_SUPPORTED_CHANNELS')}
                  isLoading={isSystemChannelsLoading}
                  isError={isSystemChannelsError}
                  degraded={config?.degraded ?? false}
                  removedChannels={config?.removedChannels ?? []}
                  onChange={(channels) =>
                    setDraft((d) => (d ? { ...d, supportedChannels: channels } : d))
                  }
                  onClearError={clearError}
                />

                {/* 4. Meter Change Reasons */}
                <MeterChangeReasonsSection
                  title={t('configuration.sections.meterChangeReasons.title')}
                  infoTooltip={t('configuration.infoText.meterChangeReasons')}
                  required={isMandatory('METER_CHANGE_REASONS')}
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
                  infoTooltip={t('configuration.infoText.supplyOutageReasons')}
                  required={isMandatory('SUPPLY_OUTAGE_REASONS')}
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

                {/* 6. Record Location */}
                <Box>
                  <Flex align="center" gap={1} mb={3}>
                    <Text
                      fontSize={{ base: 'xs', md: 'sm' }}
                      fontWeight="medium"
                      color="neutral.950"
                    >
                      {t('configuration.sections.locationCheckRequired.title')}
                      <RequiredIndicator required={isMandatory('LOCATION_CHECK_REQUIRED')} />
                    </Text>
                    <FieldInfoIcon tooltip={t('configuration.infoText.locationCheckRequired')} />
                  </Flex>
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

                {/* 6a. LGD Map Levels (if lgdLevelCount > 0) */}
                {lgdLevelCount > 0 && (
                  <MapLevelsSection
                    title={t('configuration.sections.lgdMapLevels.title')}
                    infoTooltip={t('configuration.infoText.lgdMapLevels')}
                    levelCount={lgdLevelCount}
                    levelLabelKey="configuration.sections.lgdMapLevels.displayLevelLabel"
                    value={activeDraft.displayMapLgdLevels}
                    onChange={(newLevels) =>
                      setDraft((prev) => ({
                        ...(prev ?? buildInitialDraft(config, logoObjectUrl ?? undefined)),
                        displayMapLgdLevels: newLevels,
                      }))
                    }
                  />
                )}

                {/* 6b. Department Map Levels (if deptLevelCount > 0) */}
                {deptLevelCount > 0 && (
                  <MapLevelsSection
                    title={t('configuration.sections.departmentMapLevels.title')}
                    infoTooltip={t('configuration.infoText.departmentMapLevels')}
                    levelCount={deptLevelCount}
                    levelLabelKey="configuration.sections.departmentMapLevels.displayLevelLabel"
                    value={activeDraft.displayDepartmentMapLevels}
                    onChange={(newLevels) =>
                      setDraft((prev) => ({
                        ...(prev ?? buildInitialDraft(config, logoObjectUrl ?? undefined)),
                        displayDepartmentMapLevels: newLevels,
                      }))
                    }
                  />
                )}

                {/* 7. Data Consolidation Time + Pump Operator Reminder Nudge Time */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <NudgeTimeSection
                    title={t('configuration.sections.dataConsolidationTime.title')}
                    infoTooltip={t('configuration.infoText.dataConsolidationTime')}
                    required={isMandatory('DATA_CONSOLIDATION_TIME')}
                    value={activeDraft.dataConsolidationTime}
                    fieldId="data-consolidation-time"
                    errorKey="dataConsolidationTime"
                    error={errors.dataConsolidationTime}
                    onChange={(val) =>
                      setDraft((prev) => ({
                        ...(prev ?? buildInitialDraft(config, logoObjectUrl ?? undefined)),
                        dataConsolidationTime: val,
                      }))
                    }
                    onClearError={clearError}
                  />
                  <NudgeTimeSection
                    title={t('configuration.sections.pumpOperatorReminderNudgeTime.title')}
                    infoTooltip={t('configuration.infoText.pumpOperatorReminderNudgeTime')}
                    required={isMandatory('PUMP_OPERATOR_REMINDER_NUDGE_TIME')}
                    value={activeDraft.pumpOperatorReminderNudgeTime}
                    fieldId="pump-operator-nudge-time"
                    errorKey="pumpOperatorReminderNudgeTime"
                    error={errors.pumpOperatorReminderNudgeTime}
                    onChange={(val) =>
                      setDraft((prev) => ({
                        ...(prev ?? buildInitialDraft(config, logoObjectUrl ?? undefined)),
                        pumpOperatorReminderNudgeTime: val,
                      }))
                    }
                    onClearError={clearError}
                  />
                </SimpleGrid>

                {/* 8. Screen Date Format + Table Date Format */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <FormControl
                    id="config-field-date-format-screen"
                    isInvalid={!!errors.dateFormatScreen}
                  >
                    <DateFormatSection
                      title={t('configuration.sections.dateFormatScreen.title')}
                      infoTooltip={t('configuration.infoText.dateFormatScreen')}
                      required={isMandatory('DATE_FORMAT_SCREEN')}
                      value={activeDraft.dateFormatScreen}
                      onChange={(val) => {
                        clearError('dateFormatScreen')
                        setDraft((prev) => ({
                          ...(prev ?? buildInitialDraft(config, logoObjectUrl ?? undefined)),
                          dateFormatScreen: val,
                        }))
                      }}
                    />
                    <FormErrorMessage>{errors.dateFormatScreen}</FormErrorMessage>
                  </FormControl>
                  <FormControl
                    id="config-field-date-format-table"
                    isInvalid={!!errors.dateFormatTable}
                  >
                    <DateFormatSection
                      title={t('configuration.sections.dateFormatTable.title')}
                      infoTooltip={t('configuration.infoText.dateFormatTable')}
                      required={isMandatory('DATE_FORMAT_TABLE')}
                      value={activeDraft.dateFormatTable}
                      onChange={(val) => {
                        clearError('dateFormatTable')
                        setDraft((prev) => ({
                          ...(prev ?? buildInitialDraft(config, logoObjectUrl ?? undefined)),
                          dateFormatTable: val,
                        }))
                      }}
                    />
                    <FormErrorMessage>{errors.dateFormatTable}</FormErrorMessage>
                  </FormControl>
                </SimpleGrid>

                {/* 9. Average Members Per Household */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <FormControl isInvalid={!!errors.averageMembersPerHousehold}>
                    <Flex align="center" gap={1} mb={1}>
                      <Text
                        as="label"
                        htmlFor="avg-members"
                        fontSize={{ base: 'xs', md: 'sm' }}
                        fontWeight="medium"
                        color="neutral.950"
                        display="block"
                      >
                        {t('configuration.sections.averageMembersPerHousehold.title')}
                        <RequiredIndicator
                          required={isMandatory('AVERAGE_MEMBERS_PER_HOUSEHOLD')}
                        />
                      </Text>
                      <FieldInfoIcon
                        tooltip={t('configuration.infoText.averageMembersPerHousehold')}
                      />
                    </Flex>
                    <Input
                      id="avg-members"
                      type="number"
                      step="any"
                      min="0"
                      value={displayAvgStr}
                      onWheel={(e) => e.currentTarget.blur()}
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
                <FormControl id="config-field-logo" isInvalid={!!errors.logo}>
                  <Flex align="center" gap={1} mb={3}>
                    <Text
                      fontSize={{ base: 'xs', md: 'sm' }}
                      fontWeight="medium"
                      color="neutral.950"
                    >
                      {t('configuration.sections.logo.title')}
                      <RequiredIndicator required={isMandatory('TENANT_LOGO')} />
                    </Text>
                    <FieldInfoIcon tooltip={t('configuration.infoText.logo')} />
                  </Flex>
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
                      flex={{ base: 1, sm: 'none' }}
                      w={{ base: 'auto', sm: '147px' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FiUpload
                        aria-hidden="true"
                        size={16}
                        style={{ marginRight: '4px', flexShrink: 0 }}
                      />
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
