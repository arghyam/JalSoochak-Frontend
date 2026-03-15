import { useState, useEffect } from 'react'
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
  IconButton,
  SimpleGrid,
  Stack,
} from '@chakra-ui/react'
import { EditIcon } from '@chakra-ui/icons'
import { MdDeleteOutline } from 'react-icons/md'
import { IoAddOutline } from 'react-icons/io5'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/shared/hooks/use-toast'
import { ToastContainer, SearchableSelect } from '@/shared/components/common'
import {
  useEscalationRulesQuery,
  useSaveEscalationRulesMutation,
} from '../../services/query/use-state-admin-queries'
import {
  ESCALATION_USER_TYPE_OPTIONS,
  ESCALATION_USER_TYPE_LABELS,
  type EscalationUserType,
  type EscalationRuleLevel,
} from '../../types/escalation-rules'

interface LevelDraft {
  /** Stable client-side key for React list rendering */
  key: string
  days: string
  userType: EscalationUserType | ''
}

function buildInitialDraft(levels: EscalationRuleLevel[]): LevelDraft[] {
  return levels.map((l, i) => ({
    key: `level-${i}-${l.userType}`,
    days: String(l.days),
    userType: l.userType,
  }))
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

const ROLE_OPTIONS = ESCALATION_USER_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))

export function EscalationsFormPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const { data: config, isLoading, isError } = useEscalationRulesQuery()
  const saveMutation = useSaveEscalationRulesMutation()
  const toast = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [scheduleDraft, setScheduleDraft] = useState<string | null>(null)
  const [levelsDraft, setLevelsDraft] = useState<LevelDraft[] | null>(null)

  useEffect(() => {
    document.title = `${t('escalations.title')} | JalSoochak`
  }, [t])

  const isConfigured = Boolean(config && config.levels.length > 0)
  const effectiveIsEditing = isEditing || (config !== undefined && !isConfigured)

  const activeSchedule =
    scheduleDraft ?? (config ? formatTime(config.schedule.hour, config.schedule.minute) : '')
  const activeLevels: LevelDraft[] = levelsDraft ?? (config ? buildInitialDraft(config.levels) : [])

  const handleEdit = () => {
    if (!config) return
    setScheduleDraft(formatTime(config.schedule.hour, config.schedule.minute))
    setLevelsDraft(buildInitialDraft(config.levels))
    setIsEditing(true)
  }

  const handleCancel = () => {
    setScheduleDraft(null)
    setLevelsDraft(null)
    setIsEditing(false)
  }

  const handleAddLevel = () => {
    const hasUnfilled = activeLevels.some((l) => !l.userType || !l.days || Number(l.days) < 1)
    if (hasUnfilled) {
      toast.addToast(t('escalations.messages.fillExistingRules'), 'error')
      return
    }
    setLevelsDraft([...activeLevels, { key: `level-new-${Date.now()}`, days: '', userType: '' }])
  }

  const handleRemoveLevel = (key: string) => {
    setLevelsDraft(activeLevels.filter((l) => l.key !== key))
  }

  const handleLevelChange = (key: string, field: 'days' | 'userType', value: string) => {
    setLevelsDraft(activeLevels.map((l) => (l.key === key ? { ...l, [field]: value } : l)))
  }

  const handleSave = async () => {
    for (const level of activeLevels) {
      if (!level.userType || !level.days || Number(level.days) < 1) {
        toast.addToast(t('escalations.messages.invalidRulesDays'), 'error')
        return
      }
    }

    const schedule = parseTime(activeSchedule)

    try {
      await saveMutation.mutateAsync({
        schedule,
        levels: activeLevels.map((l) => ({
          days: Number(l.days),
          userType: l.userType as EscalationUserType,
        })),
      })
      setScheduleDraft(null)
      setLevelsDraft(null)
      setIsEditing(false)
      toast.addToast(t('escalations.messages.rulesSaveSuccess'), 'success')
    } catch {
      toast.addToast(t('escalations.messages.rulesSaveFailed'), 'error')
    }
  }

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
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
          {t('escalations.title')}
        </Heading>
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
                <Box>
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
                    value={activeSchedule}
                    onChange={(e) => setScheduleDraft(e.target.value)}
                    h="36px"
                    w={{ base: '100%', lg: '350px', xl: '486px' }}
                    fontSize="sm"
                    borderColor="neutral.300"
                    borderRadius="6px"
                    _hover={{ borderColor: 'neutral.400' }}
                    _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
                  />
                </Box>

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
                        <Flex key={level.key} gap={3} align="center" direction="row">
                          <Text
                            fontSize={{ base: 'xs', md: 'sm' }}
                            fontWeight="medium"
                            color="neutral.950"
                            whiteSpace="nowrap"
                          >
                            {t('escalations.level', { number: index + 1 })}
                          </Text>
                          <SearchableSelect
                            options={ROLE_OPTIONS}
                            value={level.userType}
                            width={{ base: '100%', lg: '294px', xl: '430px' }}
                            onChange={(val) => handleLevelChange(level.key, 'userType', val)}
                            placeholder={t('common:select')}
                            ariaLabel={t('escalations.aria.selectRole', { number: index + 1 })}
                          />
                        </Flex>
                      ))}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleAddLevel}
                        w={{ base: 'auto', sm: '152px' }}
                        fontSize="14px"
                        fontWeight="400"
                        h="32px"
                        gap={1}
                        mt={1}
                      >
                        <IoAddOutline size={24} aria-hidden="true" />
                        {t('escalations.addNewLevel')}
                      </Button>
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
                        <Flex key={level.key} gap={2} align="center">
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={level.days}
                            onChange={(e) => handleLevelChange(level.key, 'days', e.target.value)}
                            aria-label={t('escalations.escalateAfterDays')}
                            h="36px"
                            w={{ base: '100%', lg: '294px', xl: '430px' }}
                            fontSize="sm"
                            borderColor="neutral.300"
                            borderRadius="6px"
                            _hover={{ borderColor: 'neutral.400' }}
                            _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
                          />
                          {activeLevels.length > 1 && (
                            <IconButton
                              aria-label={t('escalations.aria.deleteLevel', {
                                number: index + 1,
                              })}
                              icon={<MdDeleteOutline size={24} aria-hidden="true" />}
                              variant="ghost"
                              size="sm"
                              color="neutral.400"
                              onClick={() => handleRemoveLevel(level.key)}
                              h="36px"
                              minW="36px"
                              _hover={{ bg: 'error.50', color: 'error.500' }}
                            />
                          )}
                        </Flex>
                      ))}
                    </Stack>
                  </Box>
                </Flex>
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
              <HStack key={index} spacing={4}>
                <Text fontSize="sm" fontWeight="medium" color="neutral.600" minW="20px">
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
