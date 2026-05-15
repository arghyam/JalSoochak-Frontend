import { useState, useEffect, useMemo } from 'react'
import { Box, Text, Button, Flex, HStack, Heading, SimpleGrid, Spinner } from '@chakra-ui/react'
import { EditIcon } from '@chakra-ui/icons'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/shared/hooks/use-toast'
import { ToastContainer, EditableBreadcrumb, PageHeader } from '@/shared/components/common'
import {
  validateDescriptiveField,
  hasDuplicates,
  exceedsMaxLength,
} from '@/shared/utils/validation'
import { useAuthStore } from '@/app/store/auth-store'
import { INDIA_STATES } from '@/shared/constants/states'
import { ROUTES } from '@/shared/constants/routes'
import {
  useLgdHierarchyQuery,
  useDepartmentHierarchyQuery,
  useLgdEditConstraintsQuery,
  useDepartmentEditConstraintsQuery,
  useSaveLgdHierarchyMutation,
  useSaveDepartmentHierarchyMutation,
  useTenantStatusQuery,
} from '../../services/query/use-state-admin-queries'
import type { HierarchyLevel } from '../../types/hierarchy'
import { DEFAULT_LGD_HIERARCHY, DEFAULT_DEPARTMENT_HIERARCHY } from '../../types/hierarchy'
import { HierarchySection } from './hierarchy-section'

const MAX_LEVEL_NAME_LENGTH = 50

interface HierarchyDraft {
  lgd: HierarchyLevel[]
  department: HierarchyLevel[]
}

type EditIntent = 'none' | 'editing' | 'dismissed'

function buildHierarchyDraft(
  lgdData: { levels: HierarchyLevel[] } | undefined,
  deptData: { levels: HierarchyLevel[] } | undefined
): HierarchyDraft {
  return {
    lgd: lgdData?.levels.map((l) => ({ ...l })) ?? DEFAULT_LGD_HIERARCHY.map((l) => ({ ...l })),
    department:
      deptData?.levels.map((l) => ({ ...l })) ??
      DEFAULT_DEPARTMENT_HIERARCHY.map((l) => ({ ...l })),
  }
}

export function HierarchyPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const navigate = useNavigate()
  const toast = useToast()
  const [editIntent, setEditIntent] = useState<EditIntent>('none')
  const [draftOverride, setDraftOverride] = useState<HierarchyDraft | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { user } = useAuthStore()
  const tenantCode = user?.tenantCode ?? ''
  const tenantName = useMemo(
    () => INDIA_STATES.find((s) => s.code.toUpperCase() === tenantCode.toUpperCase())?.name ?? '',
    [tenantCode]
  )
  const tenantCodeUnmatched = Boolean(tenantCode) && tenantName === ''
  const { data: tenantStatus } = useTenantStatusQuery(tenantName)
  const isOnboarded = tenantStatus === 'ONBOARDED'

  const { data: lgdData, isLoading: lgdLoading, isError: lgdError } = useLgdHierarchyQuery()
  const {
    data: deptData,
    isLoading: deptLoading,
    isError: deptError,
  } = useDepartmentHierarchyQuery()
  const {
    data: lgdConstraints,
    isLoading: lgdConstraintsLoading,
    isError: lgdConstraintsError,
  } = useLgdEditConstraintsQuery()
  const {
    data: deptConstraints,
    isLoading: deptConstraintsLoading,
    isError: deptConstraintsError,
  } = useDepartmentEditConstraintsQuery()

  const saveLgdMutation = useSaveLgdHierarchyMutation()
  const saveDeptMutation = useSaveDepartmentHierarchyMutation()

  const isLoading = lgdLoading || deptLoading || lgdConstraintsLoading || deptConstraintsLoading
  const isError = lgdError || deptError || lgdConstraintsError || deptConstraintsError

  const baseDraft = useMemo(() => buildHierarchyDraft(lgdData, deptData), [lgdData, deptData])

  const autoEditEligible = !isLoading && isOnboarded
  const isEditing = editIntent === 'editing' || (autoEditEligible && editIntent === 'none')
  const draft = isEditing ? (draftOverride ?? baseDraft) : null

  useEffect(() => {
    document.title = `${t('hierarchy.pageTitle')} | JalSoochak`
  }, [t])

  useEffect(() => {
    if (tenantCodeUnmatched) {
      console.warn(
        '[HierarchyPage] tenantCode did not match any INDIA_STATES entry:',
        tenantCode,
        '— validate backend tenantCode case consistency for state-admin entries'
      )
    }
  }, [tenantCode, tenantCodeUnmatched])

  const handleEdit = () => {
    setDraftOverride(buildHierarchyDraft(lgdData, deptData))
    setEditIntent('editing')
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
    setDraftOverride(null)
    setEditIntent('dismissed')
    setErrors({})
  }

  const validateHierarchy = (
    levels: HierarchyLevel[],
    sectionId: string,
    newErrors: Record<string, string>
  ) => {
    levels.forEach((level, index) => {
      const error = validateDescriptiveField(level.name)
      if (error) {
        newErrors[`${sectionId}.${index}`] = t(`state-admin:validation.${error}`)
      } else if (exceedsMaxLength(level.name, MAX_LEVEL_NAME_LENGTH)) {
        newErrors[`${sectionId}.${index}`] = t('state-admin:validation.maxLength', {
          max: MAX_LEVEL_NAME_LENGTH,
        })
      }
    })
    const names = levels.map((l) => l.name).filter((n) => n.trim().length > 0)
    if (hasDuplicates(names)) {
      // Mark the last duplicate
      const seen = new Set<string>()
      levels.forEach((level, index) => {
        const normalized = level.name.trim().toLowerCase()
        if (!normalized) return
        if (seen.has(normalized) && !newErrors[`${sectionId}.${index}`]) {
          newErrors[`${sectionId}.${index}`] = t('state-admin:validation.duplicateLevelName')
        }
        seen.add(normalized)
      })
    }
  }

  const handleSave = async () => {
    if (!draft) return

    const newErrors: Record<string, string> = {}
    validateHierarchy(draft.lgd, 'lgd', newErrors)
    validateHierarchy(draft.department, 'dept', newErrors)

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})

    const [lgdResult, deptResult] = await Promise.allSettled([
      saveLgdMutation.mutateAsync(draft.lgd),
      saveDeptMutation.mutateAsync(draft.department),
    ])

    const lgdFailed = lgdResult.status === 'rejected'
    const deptFailed = deptResult.status === 'rejected'

    if (!lgdFailed && !deptFailed) {
      setDraftOverride(null)
      setEditIntent('dismissed')
      toast.addToast(t('hierarchy.messages.saveSuccess'), 'success')
    } else {
      if (lgdFailed) {
        toast.addToast(`${t('hierarchy.lgdTitle')}: ${t('hierarchy.messages.saveFailed')}`, 'error')
      }
      if (deptFailed) {
        toast.addToast(
          `${t('hierarchy.departmentTitle')}: ${t('hierarchy.messages.saveFailed')}`,
          'error'
        )
      }
    }
  }

  const handleSaveAndNext = async () => {
    if (!draft) return

    const newErrors: Record<string, string> = {}
    validateHierarchy(draft.lgd, 'lgd', newErrors)
    validateHierarchy(draft.department, 'dept', newErrors)

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})

    const [lgdResult, deptResult] = await Promise.allSettled([
      saveLgdMutation.mutateAsync(draft.lgd),
      saveDeptMutation.mutateAsync(draft.department),
    ])

    const lgdFailed = lgdResult.status === 'rejected'
    const deptFailed = deptResult.status === 'rejected'

    if (!lgdFailed && !deptFailed) {
      navigate(ROUTES.STATE_ADMIN_CONFIGURATION)
    } else {
      if (lgdFailed) {
        toast.addToast(`${t('hierarchy.lgdTitle')}: ${t('hierarchy.messages.saveFailed')}`, 'error')
      }
      if (deptFailed) {
        toast.addToast(
          `${t('hierarchy.departmentTitle')}: ${t('hierarchy.messages.saveFailed')}`,
          'error'
        )
      }
    }
  }

  const isSaving = saveLgdMutation.isPending || saveDeptMutation.isPending

  const hasChanges = useMemo(() => {
    if (!draft) return false
    const compareNumeric = (a: { level: number | string }, b: { level: number | string }) =>
      Number(a.level) - Number(b.level)
    const lgdChanged =
      JSON.stringify([...draft.lgd].sort(compareNumeric)) !==
      JSON.stringify([...(lgdData?.levels ?? DEFAULT_LGD_HIERARCHY)].sort(compareNumeric))
    const deptChanged =
      JSON.stringify([...draft.department].sort(compareNumeric)) !==
      JSON.stringify([...(deptData?.levels ?? DEFAULT_DEPARTMENT_HIERARCHY)].sort(compareNumeric))
    return lgdChanged || deptChanged
  }, [draft, lgdData, deptData])

  if (isLoading) {
    return (
      <Box w="full">
        <PageHeader mb={6}>
          <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
            {t('hierarchy.pageTitle')}
          </Heading>
        </PageHeader>
        <Flex align="center" role="status" aria-live="polite" aria-busy="true">
          <Spinner size="md" color="primary.500" mr={3} />
          <Text color="neutral.600">{t('common:loading')}</Text>
        </Flex>
      </Box>
    )
  }

  if (isError) {
    return (
      <Box w="full">
        <PageHeader mb={6}>
          <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
            {t('hierarchy.pageTitle')}
          </Heading>
        </PageHeader>
        <Text color="error.500">{t('hierarchy.messages.failedToLoad')}</Text>
      </Box>
    )
  }

  const activeLgd = draft?.lgd ?? lgdData?.levels ?? DEFAULT_LGD_HIERARCHY
  const activeDept = draft?.department ?? deptData?.levels ?? DEFAULT_DEPARTMENT_HIERARCHY
  const lgdStructural = lgdConstraints?.structuralChangesAllowed ?? false
  const deptStructural = deptConstraints?.structuralChangesAllowed ?? false

  return (
    <Box w="full">
      <PageHeader>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={isEditing ? 2 : 0}>
          {t('hierarchy.pageTitle')}
        </Heading>
        <EditableBreadcrumb
          isEditing={isEditing}
          onCancel={handleCancel}
          viewLabel={t('hierarchy.breadcrumb.view')}
          editLabel={t('hierarchy.breadcrumb.edit')}
        />
      </PageHeader>

      {tenantCodeUnmatched && (
        <Text color="warning.500" mb={4} role="alert">
          {t('hierarchy.messages.tenantCodeMismatch', { tenantCode })}
        </Text>
      )}

      <Box
        as="section"
        aria-labelledby="hierarchy-heading"
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
              id="hierarchy-heading"
              size="h3"
              fontWeight="400"
              fontSize={{ base: 'md', md: 'xl' }}
            >
              {t('hierarchy.sectionTitle')}
            </Heading>
            {
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
                aria-label={t('hierarchy.aria.editConfiguration')}
              >
                <EditIcon h={5} w={5} aria-hidden="true" />
              </Button>
            }
          </Flex>

          {/* View Mode */}
          {!isEditing ? (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <ViewHierarchy title={t('hierarchy.lgdTitle')} levels={activeLgd} t={t} />
              <ViewHierarchy title={t('hierarchy.departmentTitle')} levels={activeDept} t={t} />
            </SimpleGrid>
          ) : (
            /* Edit Mode */
            <Flex
              direction="column"
              w="full"
              justify="space-between"
              minH={{ base: 'auto', lg: 'calc(100vh - 250px)' }}
              gap={{ base: 6, lg: 0 }}
            >
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <HierarchySection
                  sectionId="lgd"
                  title={t('hierarchy.lgdTitle')}
                  levels={activeLgd}
                  structuralChangesAllowed={lgdStructural}
                  errors={errors}
                  onClearError={clearError}
                  onChange={(levels) =>
                    setDraftOverride((prev) => ({
                      ...(prev ?? { lgd: activeLgd, department: activeDept }),
                      lgd: levels,
                    }))
                  }
                />
                <HierarchySection
                  sectionId="dept"
                  title={t('hierarchy.departmentTitle')}
                  levels={activeDept}
                  structuralChangesAllowed={deptStructural}
                  errors={errors}
                  onClearError={clearError}
                  onChange={(levels) =>
                    setDraftOverride((prev) => ({
                      ...(prev ?? { lgd: activeLgd, department: activeDept }),
                      department: levels,
                    }))
                  }
                />
              </SimpleGrid>

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
                  isDisabled={isSaving}
                >
                  {t('common:button.cancel')}
                </Button>
                <PrimaryActionButton
                  isOnboarded={isOnboarded}
                  hasChanges={hasChanges}
                  isSaving={isSaving}
                  onSaveAndNext={handleSaveAndNext}
                  onNext={() => navigate(ROUTES.STATE_ADMIN_CONFIGURATION)}
                  onSave={handleSave}
                  t={t}
                />
              </HStack>
            </Flex>
          )}
        </Flex>
      </Box>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </Box>
  )
}

// ─── Primary Action Button ────────────────────────────────────────────────────

interface PrimaryActionButtonProps {
  isOnboarded: boolean
  hasChanges: boolean
  isSaving: boolean
  onSaveAndNext: () => void
  onNext: () => void
  onSave: () => void
  t: ReturnType<typeof useTranslation<['state-admin', 'common']>>['t']
}

function PrimaryActionButton({
  isOnboarded,
  hasChanges,
  isSaving,
  onSaveAndNext,
  onNext,
  onSave,
  t,
}: Readonly<PrimaryActionButtonProps>) {
  if (isOnboarded && hasChanges) {
    return (
      <Button
        variant="primary"
        size="md"
        width={{ base: 'full', sm: '174px' }}
        onClick={onSaveAndNext}
        isLoading={isSaving}
        isDisabled={isSaving}
      >
        {t('common:button.saveAndNext')}
      </Button>
    )
  }
  if (isOnboarded) {
    return (
      <Button
        variant="primary"
        size="md"
        width={{ base: 'full', sm: '174px' }}
        onClick={onNext}
        isDisabled={isSaving}
      >
        {t('common:button.next')}
      </Button>
    )
  }
  return (
    <Button
      variant="primary"
      size="md"
      width={{ base: 'full', sm: '174px' }}
      onClick={onSave}
      isLoading={isSaving}
      isDisabled={!hasChanges || isSaving}
    >
      {t('common:button.saveChanges')}
    </Button>
  )
}

// ─── View Mode ────────────────────────────────────────────────────────────────

function ViewHierarchy({
  title,
  levels,
  t,
}: {
  title: string
  levels: HierarchyLevel[]
  t: ReturnType<typeof useTranslation<['state-admin', 'common']>>['t']
}) {
  return (
    <Box>
      <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium" color="neutral.950" mb={3}>
        {title}
      </Text>
      <Flex direction="column" gap={3}>
        {levels.map((level) => (
          <Box key={level.level}>
            <Text
              fontSize={{ base: 'xs', md: 'sm' }}
              fontWeight="medium"
              color="neutral.600"
              mb={0.5}
            >
              {t('hierarchy.levelLabel', { level: level.level })}
            </Text>
            <Text fontSize={{ base: 'xs', md: 'sm' }} color="neutral.950">
              {level.name || '-'}
            </Text>
          </Box>
        ))}
      </Flex>
    </Box>
  )
}
