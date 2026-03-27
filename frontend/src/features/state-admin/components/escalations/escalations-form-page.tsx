import { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Text,
  Button,
  Flex,
  HStack,
  VStack,
  Heading,
  Spinner,
  Input,
  SimpleGrid,
  Stack,
  FormControl,
  FormErrorMessage,
} from '@chakra-ui/react'
import { EditIcon } from '@chakra-ui/icons'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/shared/hooks/use-toast'
import { ToastContainer } from '@/shared/components/common'

const MAX_ESCALATION_DAYS = 365
import {
  useEscalationRulesQuery,
  useSaveEscalationRulesMutation,
} from '../../services/query/use-state-admin-queries'
import {
  ESCALATION_USER_TYPE_LABELS,
  type EscalationUserType,
  type EscalationRuleLevel,
} from '../../types/escalation-rules'

/** Fixed role order: Level 1 = Section Officer, Level 2 = Sub Divisional Officer */
const FIXED_LEVEL_ROLES: EscalationUserType[] = ['SECTION_OFFICER', 'SUB_DIVISIONAL_OFFICER']

interface LevelDraft {
  /** Stable client-side key for React list rendering */
  key: string
  days: string
  userType: EscalationUserType
}

function buildInitialDraft(levels: EscalationRuleLevel[]): LevelDraft[] {
  return FIXED_LEVEL_ROLES.map((role, i) => {
    const existing = levels.find((l) => l.userType === role)
    return {
      key: `level-${i}-${role}`,
      days: existing ? String(existing.days) : '',
      userType: role,
    }
  })
}

/** Convert "HH:mm" → { hour, minute } */
function parseTime(value: string): { hour: number; minute: number } {
  const [h, m] = value.split(':').map(Number)
  return { hour: isNaN(h) ? 0 : h, minute: isNaN(m) ? 0 : m }
}

/** { hour, minute } → "HH:mm" */
function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function EscalationsFormPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const { data: config, isLoading, isError } = useEscalationRulesQuery()
  const saveMutation = useSaveEscalationRulesMutation()
  const toast = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [scheduleDraft, setScheduleDraft] = useState<string | null>(null)
  const [levelsDraft, setLevelsDraft] = useState<LevelDraft[] | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    document.title = `${t('escalations.title')} | JalSoochak`
  }, [t])

  const isConfigured = Boolean(config && config.levels.length > 0)
  const effectiveIsEditing = isEditing || (config !== undefined && !isConfigured)

  const activeSchedule =
    scheduleDraft ?? (config ? formatTime(config.schedule.hour, config.schedule.minute) : '')
  const activeLevels: LevelDraft[] =
    levelsDraft ?? (config ? buildInitialDraft(config.levels) : buildInitialDraft([]))

  const handleEdit = () => {
    if (!config) return
    setScheduleDraft(formatTime(config.schedule.hour, config.schedule.minute))
    setLevelsDraft(buildInitialDraft(config.levels))
    setIsEditing(true)
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
    setScheduleDraft(null)
    setLevelsDraft(null)
    setIsEditing(false)
    setErrors({})
  }

  const handleDaysChange = (key: string, value: string) => {
    setLevelsDraft(activeLevels.map((l) => (l.key === key ? { ...l, days: value } : l)))
    const index = activeLevels.findIndex((l) => l.key === key)
    if (index >= 0) clearError(`levels.${index}.days`)
    clearError('levels.cross')
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!activeSchedule) {
      newErrors.scheduleTime = t('state-admin:validation.timeRequired')
    }

    activeLevels.forEach((level, i) => {
      const daysNum = Number(level.days)
      if (!level.days || Number.isNaN(daysNum) || daysNum < 1) {
        newErrors[`levels.${i}.days`] = t('state-admin:validation.daysMinimum')
      } else if (daysNum > MAX_ESCALATION_DAYS) {
        newErrors[`levels.${i}.days`] = t('state-admin:validation.daysMaximum', {
          max: MAX_ESCALATION_DAYS,
        })
      }
    })

    // SDO escalate-after days must be >= SO escalate-after days
    const soDays = Number(activeLevels[0].days)
    const sdoDays = Number(activeLevels[1].days)
    if (
      soDays >= 1 &&
      soDays <= MAX_ESCALATION_DAYS &&
      sdoDays >= 1 &&
      sdoDays <= MAX_ESCALATION_DAYS &&
      sdoDays < soDays
    ) {
      newErrors['levels.cross'] = t('state-admin:validation.sdoDaysNotLessThanSo')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    const schedule = parseTime(activeSchedule)

    try {
      await saveMutation.mutateAsync({
        schedule,
        levels: activeLevels.map((l) => ({
          days: Number(l.days),
          userType: l.userType,
        })),
      })
      setScheduleDraft(null)
      setLevelsDraft(null)
      setIsEditing(false)
      setErrors({})
      toast.addToast(t('escalations.messages.rulesSaveSuccess'), 'success')
    } catch {
      toast.addToast(t('escalations.messages.rulesSaveFailed'), 'error')
    }
  }

  const hasChanges = useMemo(() => {
    if (!isConfigured || !config) return false
    const scheduleChanged =
      activeSchedule !== formatTime(config.schedule.hour, config.schedule.minute)
    const levelsChanged = activeLevels.some((l) => {
      const original = config.levels.find((cl) => cl.userType === l.userType)
      return l.days !== (original ? String(original.days) : '')
    })
    return scheduleChanged || levelsChanged
  }, [isConfigured, config, activeSchedule, activeLevels])

  if (isLoading) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={6}>
          {t('escalations.title')}
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
          {t('escalations.title')}
        </Heading>
        <Text color="error.500">{t('escalations.messages.failedToLoad')}</Text>
      </Box>
    )
  }

  return (
    <Box w="full">
      <Box mb={5}>
        <Heading
          as="h1"
          size={{ base: 'h2', md: 'h1' }}
          mb={effectiveIsEditing && isConfigured ? 2 : 0}
        >
          {t('escalations.title')}
        </Heading>
        {effectiveIsEditing && isConfigured && (
          <Flex as="nav" aria-label="Breadcrumb" gap={2} flexWrap="wrap">
            <Text
              as="button"
              type="button"
              fontSize="14px"
              lineHeight="21px"
              color="neutral.500"
              cursor="pointer"
              _hover={{ textDecoration: 'underline' }}
              onClick={handleCancel}
            >
              {t('escalations.breadcrumb.view')}
            </Text>
            <Text fontSize="14px" lineHeight="21px" color="neutral.500" aria-hidden="true">
              /
            </Text>
            <Text fontSize="14px" lineHeight="21px" color="#26272B" aria-current="page">
              {t('escalations.breadcrumb.edit')}
            </Text>
          </Flex>
        )}
      </Box>

      <Box
        as="section"
        aria-labelledby="escalation-rules-heading"
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
              id="escalation-rules-heading"
              size="h3"
              fontWeight="400"
              fontSize={{ base: 'md', md: 'xl' }}
            >
              {t('escalations.escalationRules')}
            </Heading>
            {isConfigured && !effectiveIsEditing && (
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
                aria-label={t('escalations.aria.editMode')}
              >
                <EditIcon h={5} w={5} aria-hidden="true" />
              </Button>
            )}
          </Flex>

          {/* View Mode */}
          {!effectiveIsEditing && isConfigured ? (
            <ViewMode config={config} t={t} />
          ) : (
            /* Edit Mode */
            <Flex
              as="form"
              role="form"
              aria-label={t('escalations.aria.formLabel')}
              direction="column"
              w="full"
              justify="space-between"
              minH={{ base: 'auto', lg: 'calc(100vh - 250px)' }}
              gap={{ base: 6, lg: 0 }}
            >
              <Flex direction="column" gap={3}>
                {/* Schedule Time */}
                <FormControl isInvalid={!!errors.scheduleTime}>
                  <Text
                    as="label"
                    htmlFor="escalation-schedule-time"
                    fontSize={{ base: 'xs', md: 'sm' }}
                    fontWeight="medium"
                    color="neutral.950"
                    mb={1}
                    display="block"
                  >
                    {t('escalations.scheduleTime')}
                  </Text>
                  <Input
                    id="escalation-schedule-time"
                    type="time"
                    lang="en-GB"
                    value={activeSchedule}
                    onChange={(e) => {
                      setScheduleDraft(e.target.value)
                      clearError('scheduleTime')
                    }}
                    h="36px"
                    w={{ base: '100%', lg: '350px', xl: '486px' }}
                    fontSize="sm"
                    borderColor="neutral.300"
                    borderRadius="6px"
                    _hover={{ borderColor: 'neutral.400' }}
                    _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
                    sx={{ '&::-webkit-datetime-edit-ampm-field': { display: 'none' } }}
                  />
                  <FormErrorMessage>{errors.scheduleTime}</FormErrorMessage>
                </FormControl>

                {/* Levels — two-column layout */}
                <Flex
                  justify="space-between"
                  align="flex-start"
                  direction="row"
                  gap={{ base: 4, lg: 6 }}
                >
                  {/* Left: Level of Escalation */}
                  <Box flex={1}>
                    <Text
                      as="label"
                      fontSize={{ base: 'xs', md: 'sm' }}
                      fontWeight="medium"
                      color="neutral.950"
                      mb={1}
                      display="block"
                    >
                      {t('escalations.levelOfEscalation')}
                      <Text as="span" color="error.500" ml={1}>
                        *
                      </Text>
                    </Text>
                    <Stack spacing={3}>
                      {activeLevels.map((level, index) => (
                        <Flex key={level.key} gap={3} align="center" h="36px">
                          <Text
                            fontSize={{ base: 'xs', md: 'sm' }}
                            fontWeight="medium"
                            color="neutral.950"
                            whiteSpace="nowrap"
                          >
                            {t('escalations.level', { number: index + 1 })}
                          </Text>
                          <Text
                            fontSize="sm"
                            color="neutral.950"
                            w={{ base: '100%', lg: '294px', xl: '430px' }}
                          >
                            {ESCALATION_USER_TYPE_LABELS[level.userType]}
                          </Text>
                        </Flex>
                      ))}
                    </Stack>
                  </Box>

                  {/* Right: Escalate after (days) */}
                  <Box flex={1}>
                    <Text
                      as="label"
                      fontSize={{ base: 'xs', md: 'sm' }}
                      fontWeight="medium"
                      color="neutral.950"
                      mb={1}
                      display="block"
                    >
                      {t('escalations.escalateAfterDays')}
                      <Text as="span" color="error.500" ml={1}>
                        *
                      </Text>
                    </Text>
                    <Stack spacing={3}>
                      {activeLevels.map((level, index) => (
                        <FormControl key={level.key} isInvalid={!!errors[`levels.${index}.days`]}>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={level.days}
                            onChange={(e) => handleDaysChange(level.key, e.target.value)}
                            aria-label={t('escalations.aria.escalateAfterDays', {
                              role: ESCALATION_USER_TYPE_LABELS[level.userType],
                            })}
                            h="36px"
                            w={{ base: '100%', lg: '294px', xl: '430px' }}
                            fontSize="sm"
                            borderColor="neutral.300"
                            borderRadius="6px"
                            _hover={{ borderColor: 'neutral.400' }}
                            _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
                          />
                          <FormErrorMessage>{errors[`levels.${index}.days`]}</FormErrorMessage>
                        </FormControl>
                      ))}
                    </Stack>
                  </Box>
                </Flex>

                {/* Cross-level validation error */}
                {errors['levels.cross'] && (
                  <Text fontSize="sm" color="error.500" role="alert">
                    {errors['levels.cross']}
                  </Text>
                )}
              </Flex>

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
                  isDisabled={(isConfigured && !hasChanges) || saveMutation.isPending}
                >
                  {isConfigured ? t('common:button.saveChanges') : t('common:button.save')}
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

function ViewMode({
  config,
  t,
}: {
  config: NonNullable<ReturnType<typeof useEscalationRulesQuery>['data']>
  t: ReturnType<typeof useTranslation<['state-admin', 'common']>>['t']
}) {
  return (
    <VStack spacing={6} align="stretch">
      {/* Schedule */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <Box>
          <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium" color="neutral.950" mb={1}>
            {t('escalations.scheduleTime')}
          </Text>
          <Text fontSize="sm" color="neutral.950">
            {formatTime(config.schedule.hour, config.schedule.minute)}
          </Text>
        </Box>
      </SimpleGrid>

      {/* Levels */}
      <Box>
        <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium" color="neutral.950" mb={3}>
          {t('escalations.levelOfEscalation')}
        </Text>
        {config.levels.length === 0 ? (
          <Text fontSize="sm" color="neutral.500">
            -
          </Text>
        ) : (
          <VStack align="stretch" spacing={2} maxW={{ base: 'full', md: '500px' }}>
            {config.levels.map((level, index) => (
              <HStack key={index} spacing={2}>
                <Text fontSize="sm" fontWeight="medium" color="neutral.600">
                  {index + 1}.
                </Text>
                <Text fontSize="sm" color="neutral.950" flex={1}>
                  {ESCALATION_USER_TYPE_LABELS[level.userType]}
                </Text>
                <Text fontSize="sm" color="neutral.600">
                  {t('escalations.escalateAfterDaysValue', { days: level.days })}
                </Text>
              </HStack>
            ))}
          </VStack>
        )}
      </Box>
    </VStack>
  )
}
