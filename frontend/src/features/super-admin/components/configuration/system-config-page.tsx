import React, { useState, useEffect, useMemo } from 'react'
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
  Input,
  SimpleGrid,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { EditIcon } from '@chakra-ui/icons'
import { IoInformation } from 'react-icons/io5'
import { useToast } from '@/shared/hooks/use-toast'
import {
  ToastContainer,
  EditableBreadcrumb,
  ActionTooltip,
  PageHeader,
} from '@/shared/components/common'
import {
  useSystemConfigurationQuery,
  useSaveSystemConfigurationMutation,
} from '../../services/query/use-super-admin-queries'
import {
  SYSTEM_SUPPORTED_CHANNELS,
  type SystemSupportedChannel,
  type SystemConfiguration,
} from '../../types/system-config'

interface ConfigDraft {
  supportedChannels: SystemSupportedChannel[]
  // Archived for now, kept for future integration
  // oversupplyThreshold: string
  // undersupplyThreshold: string
  bfmImageConfidenceThreshold: string
  locationAffinityThreshold: string
}

function buildDraft(config?: SystemConfiguration): ConfigDraft {
  return {
    supportedChannels: config ? [...config.supportedChannels] : [],
    // Archived for now, kept for future integration
    // oversupplyThreshold: config != null ? String(config.oversupplyThreshold) : '',
    // undersupplyThreshold: config != null ? String(config.undersupplyThreshold) : '',
    bfmImageConfidenceThreshold: config != null ? String(config.bfmImageConfidenceThreshold) : '',
    locationAffinityThreshold: config != null ? String(config.locationAffinityThreshold) : '',
  }
}

export function SystemConfigPage() {
  const { t } = useTranslation(['super-admin', 'common'])
  const { data: config, isLoading, isError } = useSystemConfigurationQuery()
  const saveMutation = useSaveSystemConfigurationMutation()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<ConfigDraft | null>(null)
  const toast = useToast()

  useEffect(() => {
    document.title = `${t('configuration.pageTitle')} | JalSoochak`
  }, [t])

  const handleEdit = () => {
    setDraft(buildDraft(config))
    setIsEditing(true)
  }

  const handleCancel = () => {
    setDraft(null)
    setIsEditing(false)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    void handleSave()
  }

  const handleSave = async () => {
    const current = draft ?? buildDraft(config)

    if (current.supportedChannels.length === 0) {
      toast.addToast(t('configuration.messages.validation.channelRequired'), 'error')
      return
    }

    try {
      await saveMutation.mutateAsync({
        supportedChannels: current.supportedChannels,
        // Archived for now, kept for future integration
        // oversupplyThreshold: Number(current.oversupplyThreshold) || 0,
        // undersupplyThreshold: Number(current.undersupplyThreshold) || 0,
        bfmImageConfidenceThreshold: Number(current.bfmImageConfidenceThreshold) || 0,
        locationAffinityThreshold: Number(current.locationAffinityThreshold) || 0,
      })
      setDraft(null)
      setIsEditing(false)
      toast.addToast(t('configuration.messages.saveSuccess'), 'success')
    } catch {
      toast.addToast(t('configuration.messages.saveFailed'), 'error')
    }
  }

  const handleChannelChange = (values: string[]) => {
    setDraft((prev) => ({
      ...(prev ?? buildDraft(config)),
      supportedChannels: values as SystemSupportedChannel[],
    }))
  }

  const updateDraftField =
    (field: keyof Omit<ConfigDraft, 'supportedChannels'>) => (value: string) => {
      setDraft((prev) => ({
        ...(prev ?? buildDraft(config)),
        [field]: value,
      }))
    }

  const hasChanges = useMemo(() => {
    if (!config || !draft) return false
    const compare = (a: string, b: string) => a.localeCompare(b)
    const channelsChanged =
      [...draft.supportedChannels].sort(compare).join() !==
      [...config.supportedChannels].sort(compare).join()
    return (
      channelsChanged ||
      // Archived for now, kept for future integration
      // Number(draft.oversupplyThreshold) !== config.oversupplyThreshold ||
      // Number(draft.undersupplyThreshold) !== config.undersupplyThreshold ||
      Number(draft.bfmImageConfidenceThreshold) !== config.bfmImageConfidenceThreshold ||
      Number(draft.locationAffinityThreshold) !== config.locationAffinityThreshold
    )
  }, [config, draft])

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

  const activeDraft = draft ?? buildDraft(config)
  const halfChannels = Math.ceil(SYSTEM_SUPPORTED_CHANNELS.length / 2)

  return (
    <Box w="full">
      <PageHeader>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={isEditing ? 2 : 0}>
          {t('configuration.pageTitle')}
        </Heading>
        <EditableBreadcrumb
          isEditing={isEditing}
          onCancel={handleCancel}
          viewLabel={t('configuration.breadcrumb.view')}
          editLabel={t('configuration.breadcrumb.edit')}
        />
      </PageHeader>

      <Box
        as="section"
        aria-labelledby="system-config-heading"
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
              id="system-config-heading"
              size="h3"
              textStyle="h8"
              fontWeight="400"
              fontSize={{ base: 'md', md: 'xl' }}
            >
              {t('configuration.sectionTitle')}
            </Heading>
            {!isEditing && (
              <Button
                variant="ghost"
                h={6}
                w={6}
                minW={6}
                pl="2px"
                pr="2px"
                onClick={handleEdit}
                color="neutral.600"
                _hover={{ bg: 'primary.50', color: 'primary.500' }}
                aria-label={t('configuration.aria.editConfiguration')}
              >
                <EditIcon h={5} w={5} aria-hidden="true" />
              </Button>
            )}
          </Flex>

          {/* View Mode */}
          {!isEditing ? (
            <ViewMode config={config} t={t} />
          ) : (
            /* Edit Mode */
            <Flex
              as="form"
              role="form"
              aria-label={t('configuration.aria.form')}
              onSubmit={handleSubmit}
              direction="column"
              w="full"
              justify="space-between"
              minH={{ base: 'auto', lg: 'calc(100vh - 250px)' }}
              gap={{ base: 6, lg: 0 }}
            >
              <VStack spacing={6} align="stretch">
                {/* 1. Supported Channels */}
                <Box>
                  <Flex align="center" gap={1} mb={3}>
                    <Text
                      fontSize={{ base: 'xs', md: 'sm' }}
                      fontWeight="medium"
                      color="neutral.950"
                    >
                      {t('configuration.sections.supportedChannels.title')}
                      <Text as="span" color="error.500" ml={1}>
                        *
                      </Text>
                    </Text>
                    <FieldInfoIcon tooltip={t('configuration.infoText.supportedChannels')} />
                  </Flex>
                  <CheckboxGroup
                    value={activeDraft.supportedChannels}
                    onChange={handleChannelChange}
                  >
                    <SimpleGrid columns={2} spacing={3} w={{ base: 'full', md: '360px' }}>
                      <VStack align="start" spacing={3}>
                        {SYSTEM_SUPPORTED_CHANNELS.slice(0, halfChannels).map((channel) => (
                          <Checkbox key={channel} value={channel}>
                            <Text fontSize="sm" color="neutral.950">
                              {channel}
                            </Text>
                          </Checkbox>
                        ))}
                      </VStack>
                      <VStack align="start" spacing={3}>
                        {SYSTEM_SUPPORTED_CHANNELS.slice(halfChannels).map((channel) => (
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

                {/* Archived for now, kept for future integration */}
                {/* 2. Quantity Thresholds */}
                {/* <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <ThresholdInput
                    id="water-qty-undersupply"
                    label={t('configuration.sections.undersupplyThreshold.title')}
                    infoTooltip={t('configuration.infoText.undersupplyThreshold')}
                    value={activeDraft.undersupplyThreshold}
                    onChange={updateDraftField('undersupplyThreshold')}
                    min={0}
                    max={100}
                    maxDecimals={4}
                  />
                  <ThresholdInput
                    id="water-qty-oversupply"
                    label={t('configuration.sections.oversupplyThreshold.title')}
                    infoTooltip={t('configuration.infoText.oversupplyThreshold')}
                    value={activeDraft.oversupplyThreshold}
                    onChange={updateDraftField('oversupplyThreshold')}
                    min={0}
                    max={1000}
                    maxDecimals={4}
                  />
                </SimpleGrid> */}

                {/* 3. BFM + Location Thresholds */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <ThresholdInput
                    id="bfm-confidence"
                    label={t('configuration.sections.bfmImageConfidence.title')}
                    infoTooltip={t('configuration.infoText.bfmImageConfidence')}
                    value={activeDraft.bfmImageConfidenceThreshold}
                    onChange={updateDraftField('bfmImageConfidenceThreshold')}
                    min={0}
                    max={100}
                    maxDecimals={4}
                  />
                  <ThresholdInput
                    id="location-affinity"
                    label={t('configuration.sections.locationAffinity.title')}
                    infoTooltip={t('configuration.infoText.locationAffinity')}
                    value={activeDraft.locationAffinityThreshold}
                    onChange={updateDraftField('locationAffinityThreshold')}
                    min={0}
                    max={1000}
                  />
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
                  type="submit"
                  variant="primary"
                  size="md"
                  width={{ base: 'full', sm: '174px' }}
                  isLoading={saveMutation.isPending}
                  isDisabled={!hasChanges || saveMutation.isPending}
                >
                  {t('common:button.saveChanges')}
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

// ─── Shared helpers ───────────────────────────────────────────────────────────

function FieldInfoIcon({ tooltip }: { tooltip: string }) {
  return (
    <ActionTooltip label={tooltip}>
      <Flex
        as="span"
        align="center"
        color="neutral.400"
        cursor="default"
        _hover={{ color: 'primary.500' }}
      >
        <IoInformation size={16} aria-label={tooltip} />
      </Flex>
    </ActionTooltip>
  )
}

// ─── Shared input ─────────────────────────────────────────────────────────────

function ThresholdInput({
  id,
  label,
  infoTooltip,
  value,
  onChange,
  min,
  max,
  maxDecimals,
}: {
  id: string
  label: string
  infoTooltip?: string
  value: string
  onChange: (v: string) => void
  min?: number
  max?: number
  maxDecimals?: number
}) {
  const step = maxDecimals != null ? String(Math.pow(10, -maxDecimals)) : 'any'

  return (
    <Box>
      <Flex align="center" gap={1} mb={1}>
        <Text
          as="label"
          htmlFor={id}
          fontSize={{ base: 'xs', md: 'sm' }}
          fontWeight="medium"
          color="neutral.950"
          display="block"
        >
          {label}
        </Text>
        {infoTooltip && <FieldInfoIcon tooltip={infoTooltip} />}
      </Flex>
      <Input
        id={id}
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onWheel={(e) => e.currentTarget.blur()}
        onChange={(e) => {
          const raw = e.target.value
          if (raw === '') {
            onChange(raw)
            return
          }
          if (maxDecimals != null) {
            const dotIndex = raw.indexOf('.')
            if (dotIndex !== -1 && raw.length - dotIndex - 1 > maxDecimals) return
          }
          if (Number(raw) >= (min ?? 0) && Number(raw) <= (max ?? Infinity)) {
            onChange(raw)
          }
        }}
        h="36px"
        w={{ base: 'full', xl: '486px' }}
        fontSize="sm"
        borderColor="neutral.300"
        borderRadius="6px"
        _hover={{ borderColor: 'neutral.400' }}
        _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
      />
    </Box>
  )
}

// ─── View Mode ────────────────────────────────────────────────────────────────

function ViewField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium" color="neutral.950" mb={1}>
        {label}
      </Text>
      <Text fontSize={{ base: 'xs', md: 'sm' }} color="neutral.950">
        {value || '-'}
      </Text>
    </Box>
  )
}

function ViewMode({
  config,
  t,
}: {
  config: SystemConfiguration
  t: ReturnType<typeof useTranslation<['super-admin', 'common']>>['t']
}) {
  return (
    <VStack spacing={6} align="stretch">
      {/* Supported Channels */}
      <Box>
        <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium" color="neutral.950" mb={1}>
          {t('configuration.sections.supportedChannels.title')}
        </Text>
        <Text fontSize={{ base: 'xs', md: 'sm' }} color="neutral.950">
          {config.supportedChannels.length > 0 ? config.supportedChannels.join(', ') : '-'}
        </Text>
      </Box>

      {/* Archived for now, kept for future integration */}
      {/* Quantity Thresholds */}
      {/* <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <ViewField
          label={t('configuration.sections.undersupplyThreshold.title')}
          value={String(config.undersupplyThreshold)}
        />
        <ViewField
          label={t('configuration.sections.oversupplyThreshold.title')}
          value={String(config.oversupplyThreshold)}
        />
      </SimpleGrid> */}

      {/* BFM + Location */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <ViewField
          label={t('configuration.sections.bfmImageConfidence.title')}
          value={String(config.bfmImageConfidenceThreshold)}
        />
        <ViewField
          label={t('configuration.sections.locationAffinity.title')}
          value={String(config.locationAffinityThreshold)}
        />
      </SimpleGrid>
    </VStack>
  )
}
