import { useState, useEffect, useRef } from 'react'
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
import { EditIcon } from '@chakra-ui/icons'
import { FiUpload } from 'react-icons/fi'
import { useToast } from '@/shared/hooks/use-toast'
import { ToastContainer } from '@/shared/components/common'
import {
  useConfigurationQuery,
  useLogoQuery,
  useSaveConfigurationMutation,
  useUpdateLogoMutation,
} from '../../services/query/use-state-admin-queries'
import {
  DEFAULT_METER_CHANGE_REASONS,
  SUPPORTED_CHANNELS,
  type MeterChangeReason,
  type SupportedChannel,
} from '../../types/configuration'
import { MeterChangeReasonsSection } from './meter-change-reasons-section'
import { validateDescriptiveField, hasDuplicates } from '@/shared/utils/validation'

interface ConfigDraft {
  supportedChannels: SupportedChannel[]
  logoFile: File | null
  logoUrl?: string
  meterChangeReasons: MeterChangeReason[]
  locationCheckRequired: boolean
  dataConsolidationTime: string
  pumpOperatorReminderNudgeTime: string
  averageMembersPerHousehold: number
}

function buildInitialDraft(
  config?: {
    supportedChannels: SupportedChannel[]
    meterChangeReasons: MeterChangeReason[]
    locationCheckRequired: boolean
    dataConsolidationTime: string
    pumpOperatorReminderNudgeTime: string
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
    locationCheckRequired: config?.locationCheckRequired ?? false,
    dataConsolidationTime: config?.dataConsolidationTime ?? '',
    pumpOperatorReminderNudgeTime: config?.pumpOperatorReminderNudgeTime ?? '',
    averageMembersPerHousehold: config?.averageMembersPerHousehold ?? 0,
  }
}

export function ConfigurationPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const { data: config, isLoading, isError } = useConfigurationQuery()
  const { data: fetchedLogoUrl } = useLogoQuery()
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

  const handleEdit = () => {
    const initial = buildInitialDraft(config, fetchedLogoUrl ?? undefined)
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
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    const current = draft ?? buildInitialDraft(config ?? undefined, fetchedLogoUrl ?? undefined)

    if (!validateForm(current)) return

    try {
      if (current.logoFile) {
        await updateLogoMutation.mutateAsync(current.logoFile)
      }

      await saveMutation.mutateAsync({
        supportedChannels: current.supportedChannels,
        meterChangeReasons: current.meterChangeReasons,
        locationCheckRequired: current.locationCheckRequired,
        dataConsolidationTime: current.dataConsolidationTime,
        pumpOperatorReminderNudgeTime: current.pumpOperatorReminderNudgeTime,
        averageMembersPerHousehold: current.averageMembersPerHousehold,
        isConfigured: true,
      })
      setDraft(null)
      setIsEditing(false)
      setAvgMembersStr('')
      setErrors({})
      toast.addToast(t('configuration.messages.saveSuccess'), 'success')
    } catch {
      toast.addToast(t('configuration.messages.saveFailed'), 'error')
    }
  }

  const handleChannelChange = (values: string[]) => {
    setDraft((prev) => ({
      ...(prev ?? buildInitialDraft(config, fetchedLogoUrl ?? undefined)),
      supportedChannels: values as SupportedChannel[],
    }))
    clearError('supportedChannels')
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const MAX_LOGO_SIZE = 2 * 1024 * 1024 // 2MB
    if (file.size > MAX_LOGO_SIZE) {
      toast.addToast(t('configuration.messages.validation.logoTooLarge'), 'error')
      return
    }
    const ALLOWED_TYPES = ['image/png', 'image/jpeg']
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.addToast(t('configuration.messages.validation.logoInvalidType'), 'error')
      return
    }
    setDraft((prev) => ({
      ...(prev ?? buildInitialDraft(config, fetchedLogoUrl ?? undefined)),
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

  const activeDraft = draft ?? buildInitialDraft(config, fetchedLogoUrl ?? undefined)

  const displayAvgStr =
    avgMembersStr !== '' || effectiveIsEditing
      ? avgMembersStr
      : activeDraft.averageMembersPerHousehold > 0
        ? String(activeDraft.averageMembersPerHousehold)
        : ''

  const halfChannels = Math.ceil(SUPPORTED_CHANNELS.length / 2)

  return (
    <Box w="full">
      <Box mb={5}>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
          {t('configuration.pageTitle')}
        </Heading>
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
            <ViewMode config={config} logoUrl={fetchedLogoUrl ?? undefined} t={t} />
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
                  <CheckboxGroup
                    value={activeDraft.supportedChannels}
                    onChange={handleChannelChange}
                  >
                    <SimpleGrid columns={2} spacing={3} w={{ base: 'full', md: '360px' }}>
                      <VStack align="start" spacing={3}>
                        {SUPPORTED_CHANNELS.slice(0, halfChannels).map((channel) => (
                          <Checkbox key={channel} value={channel}>
                            <Text fontSize="sm" color="neutral.950">
                              {channel}
                            </Text>
                          </Checkbox>
                        ))}
                      </VStack>
                      <VStack align="start" spacing={3}>
                        {SUPPORTED_CHANNELS.slice(halfChannels).map((channel) => (
                          <Checkbox key={channel} value={channel}>
                            <Text fontSize="sm" color="neutral.950">
                              {channel}
                            </Text>
                          </Checkbox>
                        ))}
                      </VStack>
                    </SimpleGrid>
                  </CheckboxGroup>
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
                      ...(prev ?? buildInitialDraft(config, fetchedLogoUrl ?? undefined)),
                      meterChangeReasons: reasons,
                    }))
                  }
                />

                {/* 5. Record Location + Logo side by side */}
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
                          ...(prev ?? buildInitialDraft(config, fetchedLogoUrl ?? undefined)),
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

                  {/* Logo */}
                  <Box>
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
                  </Box>
                </SimpleGrid>

                {/* 6. Data Consolidation Time + Pump Operator Reminder Nudge Time */}
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
                      value={activeDraft.dataConsolidationTime}
                      onChange={(e) => {
                        setDraft((prev) => ({
                          ...(prev ?? buildInitialDraft(config, fetchedLogoUrl ?? undefined)),
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
                      value={activeDraft.pumpOperatorReminderNudgeTime}
                      onChange={(e) => {
                        setDraft((prev) => ({
                          ...(prev ?? buildInitialDraft(config, fetchedLogoUrl ?? undefined)),
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
                    />
                    <FormErrorMessage>{errors.pumpOperatorReminderNudgeTime}</FormErrorMessage>
                  </FormControl>
                </SimpleGrid>

                {/* 7. Average Members Per Household */}
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
                            ...(prev ?? buildInitialDraft(config, fetchedLogoUrl ?? undefined)),
                            averageMembersPerHousehold: 0,
                          }))
                          return
                        }
                        const parsed = Number(raw)
                        if (!Number.isFinite(parsed) || parsed < 0) return
                        setDraft((prev) => ({
                          ...(prev ?? buildInitialDraft(config, fetchedLogoUrl ?? undefined)),
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
                  onClick={handleSave}
                  isLoading={saveMutation.isPending || updateLogoMutation.isPending}
                >
                  {config.isConfigured ? t('common:button.saveChanges') : t('common:button.save')}
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
  t,
}: {
  config: NonNullable<ReturnType<typeof useConfigurationQuery>['data']>
  logoUrl: string | undefined
  t: ReturnType<typeof useTranslation<['state-admin', 'common']>>['t']
}) {
  return (
    <VStack spacing={6} align="stretch">
      {/* Supported Channels */}
      <ViewSection title={t('configuration.sections.supportedChannels.title')}>
        <Text fontSize="sm" color="neutral.950">
          {config.supportedChannels.length > 0 ? config.supportedChannels.join(', ') : '-'}
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

      {/* Record Location + Logo side by side */}
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
        <ViewSection title={t('configuration.sections.logo.title')}>
          {logoUrl ? (
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
    </VStack>
  )
}
