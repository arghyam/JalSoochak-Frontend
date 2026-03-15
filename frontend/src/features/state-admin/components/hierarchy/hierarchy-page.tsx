import { useState, useEffect } from 'react'
import { Box, Text, Button, Flex, HStack, Heading, SimpleGrid, Spinner } from '@chakra-ui/react'
import { EditIcon } from '@chakra-ui/icons'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/shared/hooks/use-toast'
import { ToastContainer } from '@/shared/components/common'
import {
  useLgdHierarchyQuery,
  useDepartmentHierarchyQuery,
  useLgdEditConstraintsQuery,
  useDepartmentEditConstraintsQuery,
  useSaveLgdHierarchyMutation,
  useSaveDepartmentHierarchyMutation,
} from '../../services/query/use-state-admin-queries'
import type { HierarchyLevel } from '../../types/hierarchy'
import { DEFAULT_LGD_HIERARCHY, DEFAULT_DEPARTMENT_HIERARCHY } from '../../types/hierarchy'
import { HierarchySection } from './hierarchy-section'

interface HierarchyDraft {
  lgd: HierarchyLevel[]
  department: HierarchyLevel[]
}

export function HierarchyPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const toast = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<HierarchyDraft | null>(null)

  const { data: lgdData, isLoading: lgdLoading, isError: lgdError } = useLgdHierarchyQuery()
  const {
    data: deptData,
    isLoading: deptLoading,
    isError: deptError,
  } = useDepartmentHierarchyQuery()
  const { data: lgdConstraints, isLoading: lgdConstraintsLoading } = useLgdEditConstraintsQuery()
  const { data: deptConstraints, isLoading: deptConstraintsLoading } =
    useDepartmentEditConstraintsQuery()

  const saveLgdMutation = useSaveLgdHierarchyMutation()
  const saveDeptMutation = useSaveDepartmentHierarchyMutation()

  const isLoading = lgdLoading || deptLoading || lgdConstraintsLoading || deptConstraintsLoading
  const isError = lgdError || deptError

  useEffect(() => {
    document.title = `${t('hierarchy.pageTitle')} | JalSoochak`
  }, [t])

  const handleEdit = () => {
    setDraft({
      lgd: lgdData?.levels.map((l) => ({ ...l })) ?? DEFAULT_LGD_HIERARCHY.map((l) => ({ ...l })),
      department:
        deptData?.levels.map((l) => ({ ...l })) ??
        DEFAULT_DEPARTMENT_HIERARCHY.map((l) => ({ ...l })),
    })
    setIsEditing(true)
  }

  const handleCancel = () => {
    setDraft(null)
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!draft) return

    const emptyLgd = draft.lgd.some((l) => !l.name.trim())
    const emptyDept = draft.department.some((l) => !l.name.trim())
    if (emptyLgd || emptyDept) {
      toast.addToast(t('hierarchy.messages.emptyLevelName'), 'error')
      return
    }

    try {
      await Promise.all([
        saveLgdMutation.mutateAsync(draft.lgd),
        saveDeptMutation.mutateAsync(draft.department),
      ])
      setDraft(null)
      setIsEditing(false)
      toast.addToast(t('hierarchy.messages.saveSuccess'), 'success')
    } catch {
      toast.addToast(t('hierarchy.messages.saveFailed'), 'error')
    }
  }

  const isSaving = saveLgdMutation.isPending || saveDeptMutation.isPending

  if (isLoading) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={6}>
          {t('hierarchy.pageTitle')}
        </Heading>
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
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={6}>
          {t('hierarchy.pageTitle')}
        </Heading>
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
      <Box mb={5}>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
          {t('hierarchy.pageTitle')}
        </Heading>
      </Box>

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
            {!isEditing && (
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
            )}
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
                  onChange={(levels) =>
                    setDraft((prev) => ({
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
                  onChange={(levels) =>
                    setDraft((prev) => ({
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
                <Button
                  variant="primary"
                  size="md"
                  width={{ base: 'full', sm: '174px' }}
                  onClick={handleSave}
                  isLoading={isSaving}
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
