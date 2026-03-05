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
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { EditIcon } from '@chakra-ui/icons'
import { FiUpload } from 'react-icons/fi'
import { useToast } from '@/shared/hooks/use-toast'
import { ToastContainer } from '@/shared/components/common'
import {
  useConfigurationQuery,
  useSaveConfigurationMutation,
} from '../../services/query/use-state-admin-queries'
import {
  DEFAULT_LGD_HIERARCHY,
  DEFAULT_DEPARTMENT_HIERARCHY,
  DEFAULT_METER_CHANGE_REASONS,
  SUPPORTED_CHANNELS,
  type HierarchyLevel,
  type MeterChangeReason,
  type SupportedChannel,
} from '../../types/configuration'
import { HierarchySection } from './hierarchy-section'
import { MeterChangeReasonsSection } from './meter-change-reasons-section'

interface ConfigDraft {
  lgdHierarchy: HierarchyLevel[]
  departmentHierarchy: HierarchyLevel[]
  supportedChannels: SupportedChannel[]
  logoFile: File | null
  logoUrl?: string
  meterChangeReasons: MeterChangeReason[]
  locationCheckRequired: boolean
  dataConsolidationTime: string
  averageMembersPerHousehold: number
}

function buildInitialDraft(config?: {
  lgdHierarchy: HierarchyLevel[]
  departmentHierarchy: HierarchyLevel[]
  supportedChannels: SupportedChannel[]
  logoUrl?: string
  meterChangeReasons: MeterChangeReason[]
  locationCheckRequired: boolean
  dataConsolidationTime: string
  averageMembersPerHousehold: number
}): ConfigDraft {
  return {
    lgdHierarchy: config
      ? config.lgdHierarchy.map((l) => ({ ...l }))
      : DEFAULT_LGD_HIERARCHY.map((l) => ({ ...l })),
    departmentHierarchy: config
      ? config.departmentHierarchy.map((l) => ({ ...l }))
      : DEFAULT_DEPARTMENT_HIERARCHY.map((l) => ({ ...l })),
    supportedChannels: config ? [...config.supportedChannels] : [],
    logoFile: null,
    logoUrl: config?.logoUrl,
    meterChangeReasons: config
      ? config.meterChangeReasons.map((r) => ({ ...r }))
      : DEFAULT_METER_CHANGE_REASONS.map((r) => ({ ...r })),
    locationCheckRequired: config?.locationCheckRequired ?? false,
    dataConsolidationTime: config?.dataConsolidationTime ?? '',
    averageMembersPerHousehold: config?.averageMembersPerHousehold ?? 0,
  }
}

export function ConfigurationPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const { data: config, isLoading, isError } = useConfigurationQuery()
  const saveMutation = useSaveConfigurationMutation()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<ConfigDraft | null>(null)
  const [avgMembersStr, setAvgMembersStr] = useState('')
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.title = `${t('configuration.pageTitle')} | JalSoochak`
  }, [t])

  const effectiveIsEditing = isEditing || Boolean(config && !config.isConfigured)

  const handleEdit = () => {
    const initial = buildInitialDraft(config)
    setDraft(initial)
    setIsEditing(true)
    setAvgMembersStr(
      initial.averageMembersPerHousehold > 0 ? String(initial.averageMembersPerHousehold) : ''
    )
  }

  const handleCancel = () => {
    setDraft(null)
    setIsEditing(false)
    setAvgMembersStr('')
  }

  const handleSave = async () => {
    // draft is null when the first-configure form is shown without the user
    // touching any field (effectiveIsEditing fires before handleEdit is called).
    // Fall back to the same defaults the form already displays.
    const current = draft ?? buildInitialDraft(config ?? undefined)

    const emptyLgd = current.lgdHierarchy.some((l) => !l.name.trim())
    const emptyDept = current.departmentHierarchy.some((l) => !l.name.trim())
    if (emptyLgd || emptyDept) {
      toast.addToast(t('configuration.messages.validation.hierarchyRequired'), 'error')
      return
    }
    if (current.supportedChannels.length === 0) {
      toast.addToast(t('configuration.messages.validation.channelRequired'), 'error')
      return
    }

    try {
      let logoUrl = current.logoUrl
      if (current.logoFile) {
        logoUrl = await fileToBase64(current.logoFile)
      }

      await saveMutation.mutateAsync({
        lgdHierarchy: current.lgdHierarchy,
        departmentHierarchy: current.departmentHierarchy,
        supportedChannels: current.supportedChannels,
        logoUrl,
        meterChangeReasons: current.meterChangeReasons,
        locationCheckRequired: current.locationCheckRequired,
        dataConsolidationTime: current.dataConsolidationTime,
        averageMembersPerHousehold: current.averageMembersPerHousehold,
        isConfigured: true,
      })
      setDraft(null)
      setIsEditing(false)
      setAvgMembersStr('')
      toast.addToast(t('configuration.messages.saveSuccess'), 'success')
    } catch {
      toast.addToast(t('configuration.messages.saveFailed'), 'error')
    }
  }

  const handleChannelChange = (values: string[]) => {
    setDraft((prev) => ({
      ...(prev ?? buildInitialDraft(config)),
      supportedChannels: values as SupportedChannel[],
    }))
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const MAX_LOGO_SIZE = 2 * 1024 * 1024 // 2MB
    if (file.size > MAX_LOGO_SIZE) {
      toast.addToast(t('configuration.messages.validation.logoTooLarge'), 'error')
      return
    }
    setDraft((prev) => ({
      ...(prev ?? buildInitialDraft(config)),
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

  const activeDraft = draft ?? buildInitialDraft(config)

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
            <ViewMode config={config} t={t} />
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
                {/* 1 & 2. LGD + Department Hierarchy side by side */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <HierarchySection
                    sectionId="lgd"
                    title={t('configuration.sections.lgdHierarchy.title')}
                    levels={activeDraft.lgdHierarchy}
                    onChange={(levels) =>
                      setDraft((prev) => ({
                        ...(prev ?? buildInitialDraft(config)),
                        lgdHierarchy: levels,
                      }))
                    }
                    ariaLevelKey="configuration.aria.lgdLevel"
                  />
                  <HierarchySection
                    sectionId="dept"
                    title={t('configuration.sections.departmentHierarchy.title')}
                    levels={activeDraft.departmentHierarchy}
                    onChange={(levels) =>
                      setDraft((prev) => ({
                        ...(prev ?? buildInitialDraft(config)),
                        departmentHierarchy: levels,
                      }))
                    }
                    ariaLevelKey="configuration.aria.deptLevel"
                  />
                </SimpleGrid>

                {/* 3. Supported Channels — 2-column vertical flow */}
                <Box>
                  <Text
                    fontSize={{ base: 'sm', md: 'md' }}
                    fontWeight="semibold"
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
                </Box>

                {/* 4. Meter Change Reasons */}
                <MeterChangeReasonsSection
                  title={t('configuration.sections.meterChangeReasons.title')}
                  reasons={activeDraft.meterChangeReasons}
                  onChange={(reasons) =>
                    setDraft((prev) => ({
                      ...(prev ?? buildInitialDraft(config)),
                      meterChangeReasons: reasons,
                    }))
                  }
                />

                {/* 5. Record Location + Logo side by side */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  {/* Record Location */}
                  <Box>
                    <Text
                      fontSize={{ base: 'sm', md: 'md' }}
                      fontWeight="semibold"
                      color="neutral.950"
                      mb={3}
                    >
                      {t('configuration.sections.locationCheckRequired.title')}
                    </Text>
                    <RadioGroup
                      value={activeDraft.locationCheckRequired ? 'yes' : 'no'}
                      onChange={(val) =>
                        setDraft((prev) => ({
                          ...(prev ?? buildInitialDraft(config)),
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
                      fontSize={{ base: 'sm', md: 'md' }}
                      fontWeight="semibold"
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

                {/* 6. Data Consolidation Time + Average Members Per Household */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Box>
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
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...(prev ?? buildInitialDraft(config)),
                          dataConsolidationTime: e.target.value,
                        }))
                      }
                      h="36px"
                      fontSize="sm"
                      borderColor="neutral.300"
                      borderRadius="6px"
                      _hover={{ borderColor: 'neutral.400' }}
                      _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
                    />
                  </Box>
                  <Box>
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
                        setDraft((prev) => ({
                          ...(prev ?? buildInitialDraft(config)),
                          averageMembersPerHousehold: raw === '' ? 0 : Number(raw),
                        }))
                      }}
                      aria-label={t('configuration.sections.averageMembersPerHousehold.title')}
                      h="36px"
                      fontSize="sm"
                      borderColor="neutral.300"
                      borderRadius="6px"
                      _hover={{ borderColor: 'neutral.400' }}
                      _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
                    />
                  </Box>
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
                  isDisabled={saveMutation.isPending}
                >
                  {t('common:button.cancel')}
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  width={{ base: 'full', sm: '174px' }}
                  onClick={handleSave}
                  isLoading={saveMutation.isPending}
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

function ViewField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium" color="neutral.700" mb={1}>
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
      <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="semibold" color="neutral.950" mb={3}>
        {title}
      </Text>
      {children}
    </Box>
  )
}

function ViewMode({
  config,
  t,
}: {
  config: NonNullable<ReturnType<typeof useConfigurationQuery>['data']>
  t: ReturnType<typeof useTranslation<['state-admin', 'common']>>['t']
}) {
  return (
    <VStack spacing={6} align="stretch">
      {/* LGD + Department Hierarchy side by side */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <ViewSection title={t('configuration.sections.lgdHierarchy.title')}>
          <VStack align="stretch" spacing={3}>
            {config.lgdHierarchy.map((level) => (
              <ViewField
                key={level.level}
                label={t('configuration.sections.lgdHierarchy.levelLabel', {
                  level: level.level,
                })}
                value={level.name}
              />
            ))}
          </VStack>
        </ViewSection>

        <ViewSection title={t('configuration.sections.departmentHierarchy.title')}>
          <VStack align="stretch" spacing={3}>
            {config.departmentHierarchy.map((level) => (
              <ViewField
                key={level.level}
                label={t('configuration.sections.lgdHierarchy.levelLabel', {
                  level: level.level,
                })}
                value={level.name}
              />
            ))}
          </VStack>
        </ViewSection>
      </SimpleGrid>

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
        />
        <ViewSection title={t('configuration.sections.logo.title')}>
          {config.logoUrl ? (
            <Box
              as="img"
              src={config.logoUrl}
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

      {/* Data Consolidation Time + Average Members Per Household */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <ViewField
          label={t('configuration.sections.dataConsolidationTime.title')}
          value={config.dataConsolidationTime}
        />
        <ViewField
          label={t('configuration.sections.averageMembersPerHousehold.title')}
          value={
            config.averageMembersPerHousehold > 0 ? String(config.averageMembersPerHousehold) : '-'
          }
        />
      </SimpleGrid>
    </VStack>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
