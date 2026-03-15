import { useState, useEffect } from 'react'
import { Box, Text, Button, Flex, HStack, Input, Heading, SimpleGrid } from '@chakra-ui/react'
import { EditIcon } from '@chakra-ui/icons'
import { useTranslation } from 'react-i18next'
import type { DistrictOverride } from '../../types/water-norms'
import { WaterNormsAlertThresholds } from './water-norms-alert-thresholds'
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
  const [oversupplyThresholdDraft, setOversupplyThresholdDraft] = useState<string | null>(null)
  const [undersupplyThresholdDraft, setUndersupplyThresholdDraft] = useState<string | null>(null)
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
  const oversupplyThreshold =
    oversupplyThresholdDraft ??
    (config?.oversupplyThreshold != null ? String(config.oversupplyThreshold) : '')
  const undersupplyThreshold =
    undersupplyThresholdDraft ??
    (config?.undersupplyThreshold != null ? String(config.undersupplyThreshold) : '')
  const districtOverrides = districtOverridesDraft ?? config?.districtOverrides ?? []

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setStateQuantityDraft(null)
    setOversupplyThresholdDraft(null)
    setUndersupplyThresholdDraft(null)
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

    const oversupply = Number(oversupplyThreshold)
    const undersupply = Number(undersupplyThreshold)
    if (
      !oversupplyThreshold ||
      !undersupplyThreshold ||
      isNaN(oversupply) ||
      isNaN(undersupply) ||
      oversupply < 0 ||
      oversupply > 1000 ||
      undersupply < 0 ||
      undersupply > 100
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
        oversupplyThreshold: oversupply,
        undersupplyThreshold: undersupply,
        districtOverrides,
        isConfigured: true,
      })
      setStateQuantityDraft(null)
      setOversupplyThresholdDraft(null)
      setUndersupplyThresholdDraft(null)
      setDistrictOverridesDraft(null)
      setIsEditing(false)
      toast.addToast(t('common:toast.changesSavedShort'), 'success')
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
                  oversupplyThreshold={oversupplyThreshold}
                  undersupplyThreshold={undersupplyThreshold}
                  onOversupplyThresholdChange={(v) => setOversupplyThresholdDraft(v)}
                  onUndersupplyThresholdChange={(v) => setUndersupplyThresholdDraft(v)}
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
                  isDisabled={!stateQuantity || !oversupplyThreshold || !undersupplyThreshold}
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
