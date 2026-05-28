import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Heading,
  Text,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  NumberInput,
  NumberInputField,
  FormControl,
  FormLabel,
  Button,
  Spinner,
  SimpleGrid,
  useOutsideClick,
} from '@chakra-ui/react'
import { SearchIcon, CloseIcon } from '@chakra-ui/icons'
import { useDebounce } from '@/shared/hooks/use-debounce'
import { useToast } from '@/shared/hooks/use-toast'
import { PageHeader, ToastContainer } from '@/shared/components/common'
import {
  useYesterdayFinalReadingsQuery,
  useUpdateFinalReadingMutation,
} from '../../services/query/use-fix-readings-queries'
import type { YesterdayFinalReadingItem } from '../../types/fix-readings'

export function FixReadingsPage() {
  const { t } = useTranslation('section-officer')
  const toast = useToast()

  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 400)
  const [selectedScheme, setSelectedScheme] = useState<YesterdayFinalReadingItem | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [updateReading, setUpdateReading] = useState('')

  const dropdownRef = useRef<HTMLDivElement>(null)
  useOutsideClick({
    ref: dropdownRef,
    handler: () => setIsDropdownOpen(false),
  })

  const { data, isLoading: isSearching } = useYesterdayFinalReadingsQuery(
    selectedScheme ? '' : debouncedSearch
  )

  const { mutate: updateFinalReading, isPending } = useUpdateFinalReadingMutation()

  const results = data?.content ?? []
  const showDropdown = isDropdownOpen && !selectedScheme && debouncedSearch.length >= 1

  function handleInputChange(value: string) {
    setSearchQuery(value)
    if (value.length >= 1) {
      setIsDropdownOpen(true)
    } else {
      setIsDropdownOpen(false)
    }
  }

  function handleSelectScheme(scheme: YesterdayFinalReadingItem) {
    setSelectedScheme(scheme)
    setSearchQuery(scheme.schemeName)
    setIsDropdownOpen(false)
    setUpdateReading('')
  }

  function handleClearSearch() {
    setSelectedScheme(null)
    setSearchQuery('')
    setIsDropdownOpen(false)
    setUpdateReading('')
  }

  const parsedReading = parseFloat(updateReading)
  const isReadingValid = updateReading.trim() !== '' && !isNaN(parsedReading) && parsedReading >= 0

  function handleUpdate() {
    if (!selectedScheme || !isReadingValid) return
    updateFinalReading(
      {
        schemeId: selectedScheme.schemeId,
        payload: {
          phoneNumber: selectedScheme.phoneNumber,
          reading: parsedReading,
        },
      },
      {
        onSuccess: () => {
          toast.success(t('pages.fixReadings.successMessage'))
          handleClearSearch()
        },
        onError: () => {
          toast.error(
            t('common.errorMessage', { defaultValue: 'Something went wrong. Please try again.' })
          )
        },
      }
    )
  }

  return (
    <Box>
      <PageHeader>
        <Heading as="h1" size="lg" fontWeight="semibold">
          {t('pages.fixReadings.title')}
        </Heading>
      </PageHeader>

      {/* Search area */}
      <Box
        bg="white"
        borderRadius="12px"
        py={4}
        px={{ base: 3, md: 6 }}
        mb={6}
        h="64px"
        borderWidth="0.5px"
        borderColor="neutral.200"
      >
        <Box position="relative" w={{ base: 'full', md: '320px' }} ref={dropdownRef}>
          <InputGroup>
            <InputLeftElement pointerEvents="none" h={8}>
              <SearchIcon color="neutral.400" boxSize={3.5} />
            </InputLeftElement>
            <Input
              h={8}
              pl={8}
              pr={selectedScheme ? 8 : 4}
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={t('pages.fixReadings.searchPlaceholder')}
              borderRadius="4px"
              borderColor="neutral.300"
              _hover={{ borderColor: 'neutral.400' }}
              _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
              fontSize="sm"
              isReadOnly={!!selectedScheme}
              aria-label={t('pages.fixReadings.searchPlaceholder')}
              aria-expanded={showDropdown}
              aria-haspopup="listbox"
              autoComplete="off"
            />
            {selectedScheme ? (
              <InputRightElement h={8}>
                <IconButton
                  aria-label={t('pages.fixReadings.clearSearch')}
                  icon={<CloseIcon boxSize={2.5} />}
                  size="xs"
                  variant="ghost"
                  colorScheme="gray"
                  onClick={handleClearSearch}
                />
              </InputRightElement>
            ) : null}
          </InputGroup>

          {/* Async dropdown */}
          {showDropdown ? (
            <Box
              position="absolute"
              top="calc(100% + 4px)"
              left={0}
              w="full"
              bg="white"
              border="1px solid"
              borderColor="neutral.200"
              borderRadius="8px"
              boxShadow="md"
              zIndex={10}
              maxH="240px"
              overflowY="auto"
              role="listbox"
            >
              {isSearching ? (
                <Flex justify="center" align="center" p={4}>
                  <Spinner size="sm" color="primary.500" role="status" />
                </Flex>
              ) : results.length === 0 ? (
                <Text px={4} py={3} fontSize="sm" color="neutral.500">
                  {t('pages.fixReadings.noResults')}
                </Text>
              ) : (
                results.map((scheme) => (
                  <Box
                    key={scheme.schemeId}
                    px={4}
                    py={2.5}
                    fontSize="sm"
                    cursor="pointer"
                    role="option"
                    _hover={{ bg: 'primary.50', color: 'primary.700' }}
                    onClick={() => handleSelectScheme(scheme)}
                  >
                    {scheme.schemeName}
                  </Box>
                ))
              )}
            </Box>
          ) : null}
        </Box>
      </Box>

      {/* Selected scheme details */}
      {selectedScheme ? (
        <Box bg="white" borderRadius="12px" p={6}>
          <Text fontSize="lg" fontWeight="semibold" color="neutral.800" mb={5}>
            {selectedScheme.schemeName}
          </Text>

          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} maxW="600px" mb={6}>
            <FormControl>
              <FormLabel fontSize="sm" mb={1} color="neutral.700">
                {t('pages.fixReadings.yesterdayReading')}
              </FormLabel>
              <Input
                h="36px"
                value={selectedScheme.yesterdayFinalReading}
                isReadOnly
                borderColor="neutral.300"
                _hover={{ borderColor: 'neutral.300' }}
                bg="neutral.50"
                fontSize="sm"
                aria-label={t('pages.fixReadings.yesterdayReading')}
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" mb={1} color="neutral.700">
                {t('pages.fixReadings.updateReading')}
              </FormLabel>
              <NumberInput
                h="36px"
                value={updateReading}
                onChange={(valueString) => setUpdateReading(valueString)}
                min={0}
              >
                <NumberInputField
                  h="36px"
                  borderColor="neutral.300"
                  _hover={{ borderColor: 'neutral.400' }}
                  _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
                  fontSize="sm"
                  placeholder="0"
                  aria-label={t('pages.fixReadings.updateReading')}
                />
              </NumberInput>
            </FormControl>
          </SimpleGrid>

          <Button
            variant="primary"
            onClick={handleUpdate}
            isLoading={isPending}
            isDisabled={!isReadingValid || isPending}
            size="md"
          >
            {t('pages.fixReadings.updateButton')}
          </Button>
        </Box>
      ) : null}

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </Box>
  )
}
