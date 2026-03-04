import { useState, useEffect } from 'react'
import {
  Box,
  Text,
  Button,
  Flex,
  HStack,
  Input,
  Heading,
  SimpleGrid,
  Stack,
} from '@chakra-ui/react'
import { EditIcon } from '@chakra-ui/icons'
import { useTranslation } from 'react-i18next'
import type { DistrictOverride } from '../../types/water-norms'
import { AVAILABLE_DISTRICTS } from '../../types/water-norms'
import { WaterNormsAlertThresholds } from './water-norms-alert-thresholds'
import { WaterNormsDistrictOverrides } from './water-norms-district-overrides'
import { useToast } from '@/shared/hooks/use-toast'
import { ToastContainer, PageLoadingState, PageErrorState } from '@/shared/components/common'
import {
  useSaveWaterNormsConfigurationMutation,
  useWaterNormsConfigurationQuery,
} from '../../services/query/use-state-admin-queries'

export function WaterNormsPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const { data: config, isLoading, isError } = useWaterNormsConfigurationQuery()
  const saveWaterNormsMutation = useSaveWaterNormsConfigurationMutation()
  const [isEditing, setIsEditing] = useState(false)
  const [stateQuantityDraft, setStateQuantityDraft] = useState<string | null>(null)
  const [maxQuantityDraft, setMaxQuantityDraft] = useState<string | null>(null)
  const [minQuantityDraft, setMinQuantityDraft] = useState<string | null>(null)
  const [regularityDraft, setRegularityDraft] = useState<string | null>(null)
  const [districtOverridesDraft, setDistrictOverridesDraft] = useState<DistrictOverride[] | null>(
    null
  )
  const toast = useToast()

  useEffect(() => {
    document.title = `${t('waterNorms.title')} | JalSoochak`
  }, [t])

  const effectiveIsEditing = isEditing || Boolean(config && !config.isConfigured)
  const stateQuantity =
    stateQuantityDraft ?? (config?.stateQuantity != null ? String(config.stateQuantity) : '')
  const maxQuantity =
    maxQuantityDraft ?? (config?.maxQuantity != null ? String(config.maxQuantity) : '')
  const minQuantity =
    minQuantityDraft ?? (config?.minQuantity != null ? String(config.minQuantity) : '')
  const regularity =
    regularityDraft ?? (config?.regularity != null ? String(config.regularity) : '')
  const districtOverrides = districtOverridesDraft ?? config?.districtOverrides ?? []

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setStateQuantityDraft(null)
    setMaxQuantityDraft(null)
    setMinQuantityDraft(null)
    setRegularityDraft(null)
    setDistrictOverridesDraft(null)
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!stateQuantity) {
      toast.addToast(t('waterNorms.messages.quantityRequired'), 'error')
      return
    }

    const quantity = Number(stateQuantity)
    if (isNaN(quantity) || quantity <= 0) {
      toast.addToast(t('waterNorms.messages.invalidQuantity'), 'error')
      return
    }

    const maxQty = Number(maxQuantity)
    const minQty = Number(minQuantity)
    const reg = Number(regularity)
    if (
      !maxQuantity ||
      !minQuantity ||
      !regularity ||
      isNaN(maxQty) ||
      isNaN(minQty) ||
      isNaN(reg) ||
      maxQty < 100 ||
      minQty < 0 ||
      reg < 0
    ) {
      toast.addToast(t('waterNorms.messages.invalidAlertThresholds'), 'error')
      return
    }

    // Validate district overrides
    for (const override of districtOverrides) {
      if (!override.districtName || override.quantity <= 0) {
        toast.addToast(t('waterNorms.messages.invalidOverrides'), 'error')
        return
      }
    }

    try {
      await saveWaterNormsMutation.mutateAsync({
        stateQuantity: quantity,
        maxQuantity: maxQty,
        minQuantity: minQty,
        regularity: reg,
        districtOverrides,
        isConfigured: true,
      })
      setStateQuantityDraft(null)
      setMaxQuantityDraft(null)
      setMinQuantityDraft(null)
      setRegularityDraft(null)
      setDistrictOverridesDraft(null)
      setIsEditing(false)
      toast.addToast(t('common:toast.changesSavedShort'), 'success')
    } catch (error) {
      console.error('Failed to save water norms configuration:', error)
      toast.addToast(t('common:toast.failedToSave'), 'error')
    }
  }

  const handleAddDistrict = () => {
    // Check if there's any unfilled district override
    const hasUnfilledOverride = districtOverrides.some(
      (override) => !override.districtName || override.quantity <= 0
    )

    if (hasUnfilledOverride) {
      toast.addToast(t('waterNorms.messages.fillExisting'), 'error')
      return
    }

    const newOverride: DistrictOverride = {
      id: `district-${Date.now()}`,
      districtName: '',
      quantity: 0,
    }
    setDistrictOverridesDraft([...districtOverrides, newOverride])
  }

  const handleRemoveDistrict = (id: string) => {
    setDistrictOverridesDraft(districtOverrides.filter((d) => d.id !== id))
  }

  const handleDistrictChange = (
    id: string,
    field: keyof DistrictOverride,
    value: string | number
  ) => {
    setDistrictOverridesDraft(
      districtOverrides.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    )
  }

  const getDistrictLabel = (value: string) => {
    const district = AVAILABLE_DISTRICTS.find((d) => d.value === value)
    return district ? district.label : value
  }

  const getAvailableDistricts = () => {
    const usedDistricts = new Set(districtOverrides.map((d) => d.districtName))
    return AVAILABLE_DISTRICTS.filter((d) => !usedDistricts.has(d.value))
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
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
          {t('waterNorms.title')}
        </Heading>
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
                      {t('waterNorms.alertThresholds.maxQuantity.title')}
                    </Text>
                    <Text fontSize={{ base: 'xs', md: 'sm' }} color="neutral.950">
                      {config.maxQuantity}%
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium" mb={1}>
                      {t('waterNorms.alertThresholds.minQuantity.title')}
                    </Text>
                    <Text fontSize={{ base: 'xs', md: 'sm' }} color="neutral.950">
                      {config.minQuantity}%
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium" mb={1}>
                      {t('waterNorms.alertThresholds.regularity.title')}
                    </Text>
                    <Text fontSize={{ base: 'xs', md: 'sm' }} color="neutral.950">
                      {config.regularity}%
                    </Text>
                  </Box>
                </SimpleGrid>
              </Box>

              {/* District-Level Overrides */}
              {districtOverrides.length > 0 && (
                <Box>
                  <Heading
                    as="h3"
                    size="h3"
                    fontWeight="400"
                    fontSize={{ base: 'md', md: 'xl' }}
                    mb={4}
                  >
                    {t('waterNorms.districtOverrides.title')}
                  </Heading>
                  <Stack spacing={4}>
                    {districtOverrides.map((override) => (
                      <SimpleGrid
                        key={override.id}
                        columns={{ base: 1, md: 2 }}
                        spacing={{ base: 3, md: 6 }}
                      >
                        <Box>
                          <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium" mb={1}>
                            {t('waterNorms.districtOverrides.districtName')}
                          </Text>
                          <Text fontSize={{ base: 'xs', md: 'sm' }} color="neutral.950">
                            {getDistrictLabel(override.districtName)}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium" mb={1}>
                            {t('waterNorms.districtOverrides.quantity')}
                          </Text>
                          <Text fontSize={{ base: 'xs', md: 'sm' }} color="neutral.950">
                            {override.quantity}
                          </Text>
                        </Box>
                      </SimpleGrid>
                    ))}
                  </Stack>
                </Box>
              )}
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
                <Box mb={6}>
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
                    onChange={(e) => setStateQuantityDraft(e.target.value)}
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
                </Box>

                {/* Alert Thresholds */}
                <WaterNormsAlertThresholds
                  maxQuantity={maxQuantity}
                  minQuantity={minQuantity}
                  regularity={regularity}
                  onMaxQuantityChange={setMaxQuantityDraft}
                  onMinQuantityChange={setMinQuantityDraft}
                  onRegularityChange={setRegularityDraft}
                />

                {/* District-Level Overrides */}
                <WaterNormsDistrictOverrides
                  districtOverrides={districtOverrides}
                  onAddDistrict={handleAddDistrict}
                  onRemoveDistrict={handleRemoveDistrict}
                  onDistrictChange={handleDistrictChange}
                  getDistrictLabel={getDistrictLabel}
                  getAvailableDistricts={getAvailableDistricts}
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
                  onClick={handleSave}
                  isLoading={saveWaterNormsMutation.isPending}
                  isDisabled={!stateQuantity || !maxQuantity || !minQuantity || !regularity}
                >
                  {config?.isConfigured ? t('common:button.saveChanges') : t('common:button.save')}
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
