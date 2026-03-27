import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  Heading,
  IconButton,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react'
import { MdDeleteOutline } from 'react-icons/md'
import { useTranslation } from 'react-i18next'
import type { DistrictOverride } from '../../types/water-norms'
import { SearchableSelect } from '@/shared/components/common'

export interface WaterNormsDistrictOverridesProps {
  districtOverrides: DistrictOverride[]
  onAddDistrict: () => void
  onRemoveDistrict: (id: string) => void
  onDistrictChange: (id: string, field: keyof DistrictOverride, value: string | number) => void
  getDistrictLabel: (value: string) => string
  getAvailableDistricts: () => { value: string; label: string }[]
  errors?: Record<string, string>
  onClearError?: (field: string) => void
}

export function WaterNormsDistrictOverrides({
  districtOverrides,
  onAddDistrict,
  onRemoveDistrict,
  onDistrictChange,
  getDistrictLabel,
  getAvailableDistricts,
  errors,
  onClearError,
}: Readonly<WaterNormsDistrictOverridesProps>) {
  const { t } = useTranslation(['state-admin', 'common'])

  return (
    <Box>
      <Heading as="h3" size="h3" fontWeight="400" fontSize={{ base: 'md', md: 'xl' }} mb={4}>
        {t('waterNorms.districtOverrides.title')}
      </Heading>

      <Stack spacing={3} mb={districtOverrides.length > 0 ? 3 : 0}>
        {districtOverrides.map((override, index) => {
          const districtNameError = errors?.[`override.${index}.districtName`]
          const quantityError = errors?.[`override.${index}.quantity`]

          return (
            <Flex
              key={override.id}
              direction={{ base: 'column', lg: 'row' }}
              gap={{ base: 3, lg: 6 }}
              align={{ base: 'stretch', lg: 'flex-end' }}
            >
              <FormControl
                isInvalid={!!districtNameError}
                w={{ base: 'full', lg: '319px', xl: '486px' }}
              >
                <Text
                  fontSize={{ base: 'xs', md: 'sm' }}
                  fontWeight="medium"
                  color="neutral.950"
                  mb={1}
                >
                  {t('waterNorms.districtOverrides.districtName')}
                </Text>
                <SearchableSelect
                  options={[
                    ...getAvailableDistricts(),
                    ...(override.districtName
                      ? [
                          {
                            value: override.districtName,
                            label: getDistrictLabel(override.districtName),
                          },
                        ]
                      : []),
                  ]}
                  value={override.districtName}
                  onChange={(value) => {
                    onDistrictChange(override.id, 'districtName', value)
                    onClearError?.(`override.${index}.districtName`)
                  }}
                  placeholder={t('common:select')}
                  width="100%"
                  ariaLabel={t('waterNorms.aria.selectDistrict')}
                />
                <FormErrorMessage>{districtNameError}</FormErrorMessage>
              </FormControl>
              <Box flex={{ base: 'none', lg: 1 }}>
                <FormControl isInvalid={!!quantityError}>
                  <Text
                    fontSize={{ base: 'xs', md: 'sm' }}
                    fontWeight="medium"
                    color="neutral.950"
                    mb={1}
                  >
                    {t('waterNorms.districtOverrides.quantity')}
                  </Text>
                  <Flex gap={2}>
                    <Input
                      placeholder={t('common:enter')}
                      value={override.quantity || ''}
                      onChange={(e) => {
                        onDistrictChange(override.id, 'quantity', Number(e.target.value))
                        onClearError?.(`override.${index}.quantity`)
                      }}
                      type="number"
                      fontSize="sm"
                      w={{ base: 'full', lg: '319px', xl: '486px' }}
                      h="36px"
                      borderColor="neutral.300"
                      borderRadius="6px"
                      aria-label={t('waterNorms.aria.enterDistrictQuantity')}
                      _hover={{ borderColor: 'neutral.400' }}
                      _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
                    />
                    <IconButton
                      aria-label={t('waterNorms.aria.deleteDistrict', {
                        name: getDistrictLabel(override.districtName) || '',
                      })}
                      icon={<MdDeleteOutline size={24} aria-hidden="true" />}
                      variant="ghost"
                      size="sm"
                      color="neutral.400"
                      onClick={() => onRemoveDistrict(override.id)}
                      h="36px"
                      _hover={{ bg: 'error.50', color: 'error.500' }}
                    />
                  </Flex>
                  <FormErrorMessage>{quantityError}</FormErrorMessage>
                </FormControl>
              </Box>
            </Flex>
          )
        })}
      </Stack>

      <Button
        variant="secondary"
        size="sm"
        onClick={onAddDistrict}
        w={{ base: 'full', sm: 'auto' }}
      >
        {t('waterNorms.districtOverrides.addNew')}
      </Button>
    </Box>
  )
}
