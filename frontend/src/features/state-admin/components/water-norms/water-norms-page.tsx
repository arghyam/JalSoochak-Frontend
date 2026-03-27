import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Text,
  Button,
  Flex,
  HStack,
  Input,
  Heading,
  SimpleGrid,
  FormControl,
  FormErrorMessage,
} from '@chakra-ui/react'
import { EditIcon } from '@chakra-ui/icons'
import { useTranslation } from 'react-i18next'
import type { DistrictOverride } from '../../types/water-norms'
import { WaterNormsAlertThresholds } from './water-norms-alert-thresholds'
import { useToast } from '@/shared/hooks/use-toast'
import { ToastContainer, PageLoadingState, PageErrorState } from '@/shared/components/common'
import { ROUTES } from '@/shared/constants/routes'
import {
  useSaveWaterNormsConfigurationMutation,
  useWaterNormsConfigurationQuery,
} from '../../services/query/use-state-admin-queries'

const MAX_WATER_QUANTITY = 1000

export function WaterNormsPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const navigate = useNavigate()
  const { data: config, isLoading, isError } = useWaterNormsConfigurationQuery()
  const saveWaterNormsMutation = useSaveWaterNormsConfigurationMutation()
  const [isEditing, setIsEditing] = useState(false)
  const [stateQuantityDraft, setStateQuantityDraft] = useState<string | null>(null)
  const [oversupplyThresholdDraft, setOversupplyThresholdDraft] = useState<string | null>(null)
  const [undersupplyThresholdDraft, setUndersupplyThresholdDraft] = useState<string | null>(null)
  const [districtOverridesDraft, setDistrictOverridesDraft] = useState<DistrictOverride[] | null>(
    null
  )
  const toast = useToast()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  useEffect(() => {
    document.title = `${t('waterNorms.title')} | JalSoochak`
  }, [t])

  const effectiveIsEditing = isEditing || Boolean(config && !config.isConfigured)
  const stateQuantity =
    stateQuantityDraft ?? (config?.stateQuantity != null ? String(config.stateQuantity) : '')
  const oversupplyThreshold =
    oversupplyThresholdDraft ??
    (config?.oversupplyThreshold != null ? String(config.oversupplyThreshold) : '')
  const undersupplyThreshold =
    undersupplyThresholdDraft ??
    (config?.undersupplyThreshold != null ? String(config.undersupplyThreshold) : '')
  const districtOverrides = districtOverridesDraft ?? config?.districtOverrides ?? []

  const hasChanges = useMemo(
    () =>
      Boolean(config?.isConfigured) &&
      (stateQuantity !== String(config?.stateQuantity) ||
        oversupplyThreshold !== String(config?.oversupplyThreshold) ||
        undersupplyThreshold !== String(config?.undersupplyThreshold) ||
        (districtOverridesDraft !== null &&
          JSON.stringify(districtOverridesDraft) !== JSON.stringify(config?.districtOverrides))),
    [stateQuantity, oversupplyThreshold, undersupplyThreshold, districtOverridesDraft, config]
  )

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setStateQuantityDraft(null)
    setOversupplyThresholdDraft(null)
    setUndersupplyThresholdDraft(null)
    setDistrictOverridesDraft(null)
    setIsEditing(false)
    setErrors({})
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    const quantity = Number(stateQuantity)
    if (!stateQuantity || Number.isNaN(quantity) || quantity <= 0) {
      newErrors.stateQuantity = t('state-admin:validation.mustBePositive')
    } else if (quantity > MAX_WATER_QUANTITY) {
      newErrors.stateQuantity = t('state-admin:validation.mustBeInRange', {
        min: 1,
        max: MAX_WATER_QUANTITY,
      })
    }

    const oversupply = Number(oversupplyThreshold)
    if (!oversupplyThreshold || Number.isNaN(oversupply) || oversupply < 0 || oversupply > 1000) {
      newErrors.oversupplyThreshold = t('state-admin:validation.mustBeInRange', {
        min: 0,
        max: 1000,
      })
    }

    const undersupply = Number(undersupplyThreshold)
    if (
      !undersupplyThreshold ||
      Number.isNaN(undersupply) ||
      undersupply < 0 ||
      undersupply > 100
    ) {
      newErrors.undersupplyThreshold = t('state-admin:validation.mustBeInRange', {
        min: 0,
        max: 100,
      })
    }

    // Validate district overrides
    const seenDistricts = new Set<string>()
    districtOverrides.forEach((override, i) => {
      if (!override.districtName) {
        newErrors[`override.${i}.districtName`] = t('state-admin:validation.required')
      } else if (seenDistricts.has(override.districtName)) {
        newErrors[`override.${i}.districtName`] = t('state-admin:validation.duplicateDistrict')
      } else {
        seenDistricts.add(override.districtName)
      }
      if (override.quantity <= 0) {
        newErrors[`override.${i}.quantity`] = t('state-admin:validation.mustBePositive')
      } else if (override.quantity > MAX_WATER_QUANTITY) {
        newErrors[`override.${i}.quantity`] = t('state-admin:validation.mustBeInRange', {
          min: 1,
          max: MAX_WATER_QUANTITY,
        })
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async (andNavigate = false) => {
    if (!validateForm()) return

    try {
      await saveWaterNormsMutation.mutateAsync({
        stateQuantity: Number(stateQuantity),
        oversupplyThreshold: Number(oversupplyThreshold),
        undersupplyThreshold: Number(undersupplyThreshold),
        districtOverrides,
        isConfigured: true,
      })
      setStateQuantityDraft(null)
      setOversupplyThresholdDraft(null)
      setUndersupplyThresholdDraft(null)
      setDistrictOverridesDraft(null)
      setIsEditing(false)
      setErrors({})
      toast.addToast(t('common:toast.changesSavedShort'), 'success')
      if (andNavigate) navigate(ROUTES.STATE_ADMIN_INTEGRATION)
    } catch (error) {
      console.error('Failed to save water norms configuration:', error)
      toast.addToast(t('common:toast.failedToSave'), 'error')
    }
  }

  if (isLoading) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={6}>
          {t('waterNorms.title')}
        </Heading>
        <PageLoadingState message={t('common:loading')} />
      </Box>
    )
  }

  if (isError || !config) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={6}>
          {t('waterNorms.title')}
        </Heading>
        <PageErrorState message={t('waterNorms.messages.failedToLoad')} />
      </Box>
    )
  }

  return (
    <Box w="full">
      {/* Page Header */}
      <Box mb={5}>
        <Heading
          as="h1"
          size={{ base: 'h2', md: 'h1' }}
          mb={effectiveIsEditing && config?.isConfigured ? 2 : 0}
        >
          {t('waterNorms.title')}
        </Heading>
        {effectiveIsEditing && config?.isConfigured && (
          <Flex as="nav" aria-label="Breadcrumb" gap={2} flexWrap="wrap">
            <Text
              as="a"
              fontSize="14px"
              lineHeight="21px"
              color="neutral.500"
              cursor="pointer"
              _hover={{ textDecoration: 'underline' }}
              onClick={handleCancel}
              tabIndex={0}
              onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleCancel()}
            >
              {t('waterNorms.breadcrumb.view')}
            </Text>
            <Text fontSize="14px" lineHeight="21px" color="neutral.500" aria-hidden="true">
              /
            </Text>
            <Text fontSize="14px" lineHeight="21px" color="#26272B" aria-current="page">
              {t('waterNorms.breadcrumb.edit')}
            </Text>
          </Flex>
        )}
      </Box>

      {/* Water Norms Configuration Card */}
      <Box
        as="section"
        aria-labelledby="water-norms-heading"
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
              id="water-norms-heading"
              size="h3"
              fontWeight="400"
              fontSize={{ base: 'md', md: 'xl' }}
            >
              {t('waterNorms.stateUtWaterNorms')}
            </Heading>
            {config?.isConfigured && !effectiveIsEditing && (
              <Button
                variant="ghost"
                h={6}
                w={6}
                minW={6}
                pl="2px"
                pr="2px"
                onClick={handleEdit}
                color="neutral.500"
                _hover={{ bg: 'primary.50', color: 'primary.500' }}
                aria-label={t('waterNorms.aria.editConfiguration')}
              >
                <EditIcon h={5} w={5} aria-hidden="true" />
              </Button>
            )}
          </Flex>

          {/* View Mode */}
          {!effectiveIsEditing && config?.isConfigured ? (
            <Box w="full" h="full" minH={{ base: 'auto', lg: 'calc(100vh - 250px)' }}>
              {/* State Quantity */}
              <Box mb={7}>
                <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium" mb={1}>
                  {t('waterNorms.currentQuantity')}
                </Text>
                <Text fontSize={{ base: 'xs', md: 'sm' }} color="neutral.950">
                  {config.stateQuantity}
                </Text>
              </Box>

              {/* Alert Thresholds */}
              <Box mb={7}>
                <Heading
                  as="h3"
                  size="h3"
                  fontWeight="400"
                  fontSize={{ base: 'md', md: 'xl' }}
                  mb={4}
                >
                  {t('waterNorms.alertThresholds.title')}
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 3, md: 6 }}>
                  <Box>
                    <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium" mb={1}>
                      {t('waterNorms.alertThresholds.undersupplyThreshold.title')}
                    </Text>
                    <Text fontSize={{ base: 'xs', md: 'sm' }} color="neutral.950">
                      {config.undersupplyThreshold}%
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium" mb={1}>
                      {t('waterNorms.alertThresholds.oversupplyThreshold.title')}
                    </Text>
                    <Text fontSize={{ base: 'xs', md: 'sm' }} color="neutral.950">
                      {config.oversupplyThreshold}%
                    </Text>
                  </Box>
                </SimpleGrid>
              </Box>
            </Box>
          ) : (
            /* Edit Mode */
            <Flex
              as="form"
              role="form"
              aria-label={t('waterNorms.stateUtWaterNorms')}
              direction="column"
              w="full"
              h="full"
              justify="space-between"
              minH={{ base: 'auto', lg: 'calc(100vh - 250px)' }}
              gap={{ base: 6, lg: 0 }}
            >
              <Box>
                {/* State Quantity Input */}
                <FormControl isInvalid={!!errors.stateQuantity} mb={6}>
                  <Text
                    as="label"
                    htmlFor="state-quantity"
                    fontSize={{ base: 'xs', md: 'sm' }}
                    fontWeight="medium"
                    color="neutral.950"
                    mb={1}
                    display="block"
                  >
                    {t('waterNorms.currentQuantity')}
                    <Text as="span" color="error.500" ml={1}>
                      *
                    </Text>
                  </Text>
                  <Input
                    id="state-quantity"
                    placeholder={t('common:enter')}
                    value={stateQuantity}
                    onChange={(e) => {
                      setStateQuantityDraft(e.target.value)
                      clearError('stateQuantity')
                    }}
                    type="number"
                    w={{ base: 'full', lg: '319px', xl: '486px' }}
                    h="36px"
                    fontSize="sm"
                    borderColor="neutral.300"
                    borderRadius="6px"
                    aria-label={t('waterNorms.aria.enterQuantity')}
                    _hover={{ borderColor: 'neutral.400' }}
                    _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
                  />
                  <FormErrorMessage>{errors.stateQuantity}</FormErrorMessage>
                </FormControl>

                {/* Alert Thresholds */}
                <WaterNormsAlertThresholds
                  oversupplyThreshold={oversupplyThreshold}
                  undersupplyThreshold={undersupplyThreshold}
                  onOversupplyThresholdChange={(v) => {
                    setOversupplyThresholdDraft(v)
                    clearError('oversupplyThreshold')
                  }}
                  onUndersupplyThresholdChange={(v) => {
                    setUndersupplyThresholdDraft(v)
                    clearError('undersupplyThreshold')
                  }}
                  errors={errors}
                />
              </Box>

              {/* Action Buttons */}
              <HStack
                spacing={3}
                justify={{ base: 'stretch', sm: 'flex-end' }}
                flexDirection={{ base: 'column-reverse', sm: 'row' }}
                mt={{ base: 4, lg: 0 }}
              >
                <Button
                  variant="secondary"
                  size="md"
                  width={{ base: 'full', sm: '174px' }}
                  onClick={handleCancel}
                  isDisabled={saveWaterNormsMutation.isPending}
                >
                  {t('common:button.cancel')}
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  width={{ base: 'full', sm: '174px' }}
                  onClick={() => handleSave(!config?.isConfigured)}
                  isLoading={saveWaterNormsMutation.isPending}
                  isDisabled={
                    (!!config?.isConfigured && !hasChanges) || saveWaterNormsMutation.isPending
                  }
                >
                  {config?.isConfigured
                    ? t('common:button.saveChanges')
                    : t('common:button.saveAndNext')}
                </Button>
              </HStack>
            </Flex>
          )}
        </Flex>
      </Box>

      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </Box>
  )
}
