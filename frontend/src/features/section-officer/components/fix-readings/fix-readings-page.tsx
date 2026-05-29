import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Heading,
  Text,
  Flex,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  NumberInput,
  NumberInputField,
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
import { sectionOfficerQueryKeys } from '../../services/query/section-officer-query-keys'
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

  const {
    data,
    isLoading: isSearching,
    isError,
  } = useYesterdayFinalReadingsQuery(selectedScheme ? '' : debouncedSearch)

  const { mutate: updateFinalReading, isPending } = useUpdateFinalReadingMutation()
  const queryClient = useQueryClient()

  const results = data?.content ?? []
  const hasResults = (data?.content?.length ?? 0) > 0
  const showDropdown = isDropdownOpen && !selectedScheme && debouncedSearch.length >= 1 && !isError
  const showSearchError =
    isDropdownOpen && !selectedScheme && debouncedSearch.length >= 1 && isError

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
          setUpdateReading('')
          setSelectedScheme((prev) =>
            prev ? { ...prev, yesterdayFinalReading: parsedReading } : prev
          )
          queryClient.invalidateQueries({
            queryKey: [...sectionOfficerQueryKeys.all, 'yesterday-final-readings'],
          })
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
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
          {t('pages.fixReadings.title')}
        </Heading>
      </PageHeader>

      {/* Search area */}
      <Flex
        as="section"
        aria-label={t('pages.fixReadings.searchPlaceholder')}
        justify="flex-start"
        align="center"
        mb={6}
        py={3}
        px={{ base: 3, md: 6 }}
        h={{ base: 'auto', md: 16 }}
        gap={{ base: 3, md: 4 }}
        flexDirection={{ base: 'column', md: 'row' }}
        borderWidth="0.5px"
        borderColor="neutral.200"
        borderRadius="12px"
        bg="white"
      >
        <Box position="relative" w={{ base: 'full', md: '260px' }} flexShrink={0} ref={dropdownRef}>
          <InputGroup>
            <InputLeftElement pointerEvents="none" h={8}>
              <SearchIcon color="neutral.300" aria-hidden="true" />
            </InputLeftElement>
            <Input
              h={8}
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={t('pages.fixReadings.searchPlaceholder')}
              borderWidth="1px"
              borderRadius="4px"
              borderColor="neutral.300"
              _placeholder={{ color: 'neutral.300' }}
              _hover={{ borderColor: 'neutral.400' }}
              _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
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
              ) : hasResults ? (
                results.map((scheme) => (
                  <Box
                    key={scheme.schemeId}
                    px={4}
                    py={2.5}
                    fontSize="sm"
                    cursor="pointer"
                    role="option"
                    tabIndex={0}
                    aria-selected={false}
                    _hover={{ bg: 'primary.50', color: 'primary.700' }}
                    _focus={{
                      bg: 'primary.50',
                      color: 'primary.700',
                      outline: '2px solid',
                      outlineColor: 'primary.500',
                    }}
                    onClick={() => handleSelectScheme(scheme)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSelectScheme(scheme)
                      }
                    }}
                  >
                    {scheme.schemeName}
                  </Box>
                ))
              ) : (
                <Text px={4} py={3} fontSize="sm" color="neutral.500">
                  {t('pages.fixReadings.noResults')}
                </Text>
              )}
            </Box>
          ) : null}

          {showSearchError ? (
            <Box
              position="absolute"
              top="calc(100% + 4px)"
              left={0}
              w="full"
              bg="white"
              border="1px solid"
              borderColor="red.200"
              borderRadius="8px"
              boxShadow="md"
              zIndex={10}
              px={4}
              py={3}
              role="alert"
            >
              <Text fontSize="sm" color="red.600">
                {t('pages.fixReadings.searchError', {
                  defaultValue: 'Failed to search schemes. Please try again.',
                })}
              </Text>
            </Box>
          ) : null}
        </Box>
      </Flex>

      {/* Selected scheme details */}
      {selectedScheme ? (
        <Box
          as="section"
          bg="white"
          borderWidth="0.5px"
          borderColor="neutral.100"
          borderRadius={{ base: 'lg', md: 'xl' }}
          w="full"
          minH={{ base: 'auto', lg: 'calc(100vh - 250px)' }}
          py={{ base: 4, md: 6 }}
          px={4}
        >
          <Flex
            direction="column"
            w="full"
            h="full"
            justify="space-between"
            minH={{ base: 'auto', lg: 'calc(100vh - 300px)' }}
            gap={{ base: 6, lg: 0 }}
          >
            <Box>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading
                  as="h2"
                  size="h3"
                  textStyle="h8"
                  fontWeight="400"
                  fontSize={{ base: 'md', md: 'xl' }}
                >
                  {selectedScheme.schemeName}
                </Heading>
              </Flex>

              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                <Box w={{ base: 'full', xl: '486px' }}>
                  <Text
                    as="label"
                    fontSize={{ base: 'xs', md: 'sm' }}
                    fontWeight="medium"
                    color="neutral.950"
                    mb={1}
                    display="block"
                  >
                    {t('pages.fixReadings.yesterdayReading')}
                  </Text>
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
                </Box>

                <Box w={{ base: 'full', xl: '486px' }}>
                  <Text
                    as="label"
                    fontSize={{ base: 'xs', md: 'sm' }}
                    fontWeight="medium"
                    color="neutral.950"
                    mb={1}
                    display="block"
                  >
                    {t('pages.fixReadings.updateReading')}
                  </Text>
                  <NumberInput
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
                </Box>
              </SimpleGrid>
            </Box>

            <HStack
              spacing={3}
              justify={{ base: 'stretch', sm: 'flex-end' }}
              flexDirection={{ base: 'column-reverse', sm: 'row' }}
              mt={{ base: 4, lg: 0 }}
            >
              <Button
                variant="primary"
                onClick={handleUpdate}
                isLoading={isPending}
                isDisabled={!isReadingValid || isPending}
                size="md"
                width={{ base: 'full', sm: '174px' }}
              >
                {t('pages.fixReadings.updateButton')}
              </Button>
            </HStack>
          </Flex>
        </Box>
      ) : null}

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </Box>
  )
}
