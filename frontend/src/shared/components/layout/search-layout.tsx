import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FocusEvent, ReactNode } from 'react'
import type { ButtonProps, InputProps } from '@chakra-ui/react'
import {
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  IconButton,
  Box,
  Text,
  Icon,
  useOutsideClick,
  useBreakpointValue,
  useMediaQuery,
  Tabs,
  TabList,
  Tab,
} from '@chakra-ui/react'
import { CloseIcon, SearchIcon } from '@chakra-ui/icons'
import { FiChevronDown, FiDownload } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'

export type SearchStateOption = {
  value: string
  label: string
}

interface BreadcrumbPanelProps {
  stateOptions: SearchStateOption[]
  totalStatesCount: number
  onPanelOpenChange?: (isOpen: boolean) => void
  onStateSelect?: (stateValue: string) => void
  options?: SearchStateOption[]
  optionsLabel?: string
  totalOptionsCount?: number
  noOptionsText?: string
  onOptionSelect?: (value: string) => void
  closeOnOptionSelect?: boolean
  onTrailSelect?: (trailIndex: number) => void
  showTabs?: boolean
  tabsDisabled?: boolean
  tabs?: string[]
  activeTab?: number
  onTabChange?: (index: number) => void
}

interface SearchLayoutProps {
  placeholder?: string
  actionLabel?: string
  onActionClick?: () => void
  inputProps?: InputProps
  actionProps?: ButtonProps
  filterSlot?: ReactNode
  rightSlot?: ReactNode
  breadcrumbPanelProps?: BreadcrumbPanelProps
  selectionTrail?: string[]
  activeTrailIndex?: number | null
}

export function SearchLayout({
  placeholder,
  actionLabel,
  onActionClick,
  inputProps,
  actionProps,
  filterSlot,
  rightSlot,
  breadcrumbPanelProps,
  selectionTrail,
  activeTrailIndex,
}: SearchLayoutProps) {
  const { t } = useTranslation('dashboard')
  const isCompactLayout = useBreakpointValue({ base: false, lg: false }) ?? false
  const isBelowLgLayout = useBreakpointValue({ base: true, lg: false }) ?? true
  const isBelowMdLayout = useBreakpointValue({ base: true, md: false }) ?? true
  const [isVeryCompactLayout] = useMediaQuery('(max-width: 569px)')
  const [searchValue, setSearchValue] = useState('')
  const [isBreadcrumbPanelOpen, setIsBreadcrumbPanelOpen] = useState(false)
  const [selectedStateValue, setSelectedStateValue] = useState('')
  const panelContainerRef = useRef<HTMLDivElement>(null)

  const showBreadcrumbPanel = Boolean(breadcrumbPanelProps)
  const hasExternalSelectionTrail = selectionTrail !== undefined
  const panelOptions = breadcrumbPanelProps?.options ?? breadcrumbPanelProps?.stateOptions ?? []
  const breadcrumbTabs = breadcrumbPanelProps?.tabs ?? [
    t('searchLayout.tabs.administrative', 'Administrative'),
    t('searchLayout.tabs.departmental', 'Departmental'),
  ]
  const isTabsDisabled = Boolean(breadcrumbPanelProps?.tabsDisabled)
  const panelOptionsLabel =
    breadcrumbPanelProps?.optionsLabel ?? t('searchLayout.options.states', 'States')
  const panelOptionsCount =
    breadcrumbPanelProps?.totalOptionsCount ?? breadcrumbPanelProps?.totalStatesCount ?? 0
  const noOptionsText =
    breadcrumbPanelProps?.noOptionsText ??
    t('searchLayout.noOptionsFound', {
      label: panelOptionsLabel,
      defaultValue: `No ${panelOptionsLabel} found`,
    })
  const resolvedPlaceholder =
    placeholder ??
    t('searchLayout.placeholder', 'Search by state/UT, district, block, gram panchayat, village')
  const inputPlaceholder = isBelowMdLayout
    ? t('searchLayout.search', 'Search')
    : resolvedPlaceholder
  const resolvedActionLabel = actionLabel ?? t('searchLayout.downloadReport', 'Download Report')
  const inputValue = inputProps?.value !== undefined ? String(inputProps.value ?? '') : searchValue
  const selectedState = useMemo(
    () => breadcrumbPanelProps?.stateOptions.find((option) => option.value === selectedStateValue),
    [breadcrumbPanelProps?.stateOptions, selectedStateValue]
  )
  const effectiveSelectionTrail = useMemo(() => {
    if (hasExternalSelectionTrail) {
      return selectionTrail ?? []
    }

    return selectedState ? [selectedState.label] : []
  }, [hasExternalSelectionTrail, selectionTrail, selectedState])
  const effectiveActiveTrailIndex = useMemo(() => {
    if (effectiveSelectionTrail.length === 0) {
      return -1
    }

    const fallbackIndex = effectiveSelectionTrail.length - 1
    if (activeTrailIndex === null || activeTrailIndex === undefined) {
      return fallbackIndex
    }

    return Math.max(-1, Math.min(activeTrailIndex, fallbackIndex))
  }, [activeTrailIndex, effectiveSelectionTrail.length])
  const filteredStateOptions = useMemo(() => {
    if (!panelOptions.length) {
      return []
    }

    const query = inputValue.trim().toLowerCase()
    if (!query) {
      return panelOptions
    }

    return panelOptions.filter((option) => option.label.toLowerCase().includes(query))
  }, [panelOptions, inputValue])
  const closedSelectionTrail = useMemo(() => {
    if (effectiveActiveTrailIndex < 0) {
      return []
    }

    return effectiveSelectionTrail.slice(0, effectiveActiveTrailIndex + 1)
  }, [effectiveActiveTrailIndex, effectiveSelectionTrail])

  const setBreadcrumbPanelOpen = (isOpen: boolean) => {
    if (isBreadcrumbPanelOpen === isOpen) {
      return
    }

    setIsBreadcrumbPanelOpen(isOpen)
    breadcrumbPanelProps?.onPanelOpenChange?.(isOpen)
  }

  useOutsideClick({
    ref: panelContainerRef,
    handler: () => {
      setBreadcrumbPanelOpen(false)
    },
  })

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    if (showBreadcrumbPanel) {
      setBreadcrumbPanelOpen(true)
    }
    inputProps?.onFocus?.(event)
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (inputProps?.value === undefined) {
      setSearchValue(event.target.value)
    }
    inputProps?.onChange?.(event)
  }

  const handleStateSelect = (stateValue: string) => {
    setSelectedStateValue(stateValue)
    setSearchValue('')
    breadcrumbPanelProps?.onOptionSelect?.(stateValue)
    breadcrumbPanelProps?.onStateSelect?.(stateValue)
    if (breadcrumbPanelProps?.closeOnOptionSelect) {
      setBreadcrumbPanelOpen(false)
    }
  }

  const handleTrailSelect = (trailIndex: number) => {
    setSearchValue('')
    breadcrumbPanelProps?.onTrailSelect?.(trailIndex)
  }

  const handleCloseBreadcrumbPanel = () => {
    setBreadcrumbPanelOpen(false)
  }

  const closedTrailContent =
    closedSelectionTrail.length > 0 && !isBreadcrumbPanelOpen ? (
      <Flex
        mt={{ base: '8px', lg: '12px' }}
        align="center"
        gap="8px"
        wrap="wrap"
        data-testid="search-trail-closed"
      >
        {closedSelectionTrail.map((item, index) => {
          const isActive = index === effectiveActiveTrailIndex

          if (isActive) {
            return (
              <Flex key={`${item}-${index}`} align="center" gap="8px">
                {index > 0 ? (
                  <Icon
                    as={FiChevronDown}
                    color="neutral.500"
                    boxSize="14px"
                    transform="rotate(-90deg)"
                  />
                ) : null}
                <Button
                  h="26px"
                  minW="66px"
                  px="8px"
                  py="4px"
                  borderRadius="16px"
                  borderColor="neutral.300"
                  bg="primary.25"
                  color="primary.600"
                  fontSize="14px"
                  fontWeight="400"
                  variant="ghost"
                  onClick={() => handleTrailSelect(index)}
                  _hover={{ bg: 'neutral.100' }}
                  _active={{ bg: 'neutral.100' }}
                  aria-label={t('searchLayout.aria.breadcrumb', {
                    item,
                    defaultValue: `Breadcrumb: ${item}`,
                  })}
                  aria-current="page"
                >
                  {item}
                </Button>
              </Flex>
            )
          }

          return (
            <Flex key={`${item}-${index}`} align="center" gap="8px">
              {index > 0 ? (
                <Icon
                  as={FiChevronDown}
                  color="neutral.500"
                  boxSize="14px"
                  transform="rotate(-90deg)"
                />
              ) : null}
              <Button
                variant="unstyled"
                h="auto"
                minH="auto"
                fontSize="14px"
                color="neutral.500"
                fontWeight="400"
                onClick={() => handleTrailSelect(index)}
                _hover={{ color: 'primary.500' }}
                _active={{ color: 'primary.500' }}
                aria-label={t('searchLayout.aria.breadcrumb', {
                  item,
                  defaultValue: `Breadcrumb: ${item}`,
                })}
              >
                {item}
              </Button>
            </Flex>
          )
        })}
      </Flex>
    ) : null

  return (
    <Box
      as="section"
      w="full"
      borderRadius="12px"
      p="16px"
      mb="24px"
      bg="neutral.25"
      border="0.5px solid"
      borderColor="neutral.200"
      position="relative"
      ref={panelContainerRef}
    >
      <Flex w="full" direction="column" gap={{ base: 3, lg: '24px' }}>
        {isCompactLayout ? (
          <>
            <InputGroup w="full" minW={0}>
              <InputLeftElement pointerEvents="none" p="12px" w="auto" h="32px" alignItems="center">
                <SearchIcon mr="4px" color="neutral.300" />
              </InputLeftElement>
              <Input
                px="12px"
                pl="32px"
                placeholder={inputPlaceholder}
                fontSize="14px"
                h="32px"
                borderColor="neutral.300"
                _placeholder={{ color: 'neutral.300' }}
                value={inputValue}
                onFocus={handleFocus}
                onChange={handleInputChange}
                {...inputProps}
              />
            </InputGroup>
            {closedTrailContent}
            <Flex w="full" align="center" justify="space-between" gap={3}>
              <Box minW={0} flex="1 1 auto">
                {filterSlot}
              </Box>
              {rightSlot ?? (
                <Button
                  onClick={onActionClick}
                  h="32px"
                  w="full"
                  maxW="160px"
                  minW="112px"
                  flex="0 1 160px"
                  fontSize={isVeryCompactLayout ? '11px' : '14px'}
                  variant="primary"
                  leftIcon={<FiDownload size="16" />}
                  {...actionProps}
                >
                  {resolvedActionLabel}
                </Button>
              )}
            </Flex>
          </>
        ) : (
          <Flex w="full" align="center" justify="space-between" gap={{ base: 2, lg: '24px' }}>
            <InputGroup w="full" flex="1 1 auto" minW={{ base: 0, lg: '300px' }}>
              <InputLeftElement pointerEvents="none" p="12px" w="auto" h="32px" alignItems="center">
                <SearchIcon mr="4px" color="neutral.300" />
              </InputLeftElement>
              <Input
                px="12px"
                pl="32px"
                placeholder={inputPlaceholder}
                fontSize="14px"
                h="32px"
                borderColor="neutral.300"
                _placeholder={{ color: 'neutral.300' }}
                value={inputValue}
                onFocus={handleFocus}
                onChange={handleInputChange}
                {...inputProps}
              />
            </InputGroup>
            <Flex align="center" gap={{ base: 2, lg: '24px' }} flex="0 0 auto" minW={0}>
              {filterSlot}
              {rightSlot ??
                (isBelowLgLayout ? (
                  <IconButton
                    aria-label={resolvedActionLabel}
                    onClick={onActionClick}
                    h="32px"
                    minW="32px"
                    w="32px"
                    icon={<FiDownload size="16" />}
                    variant="primary"
                    {...actionProps}
                  />
                ) : (
                  <Button
                    onClick={onActionClick}
                    h="32px"
                    w="full"
                    maxW="160px"
                    minW="112px"
                    flex="0 1 160px"
                    fontSize={isVeryCompactLayout ? '11px' : '14px'}
                    variant="primary"
                    leftIcon={<FiDownload size="16" />}
                    {...actionProps}
                  >
                    {resolvedActionLabel}
                  </Button>
                ))}
            </Flex>
          </Flex>
        )}
      </Flex>
      {!isCompactLayout ? closedTrailContent : null}
      {showBreadcrumbPanel && isBreadcrumbPanelOpen ? (
        <Box
          position="absolute"
          top="56px"
          left="0"
          mt="16px"
          width="798px"
          maxW="100%"
          minH="375px"
          borderRadius="12px"
          border="1px solid"
          borderColor="neutral.200"
          bg="white"
          zIndex={10}
          overflow="hidden"
          boxShadow="0px 8px 24px rgba(0, 0, 0, 0.08)"
        >
          <IconButton
            aria-label={t('searchLayout.aria.closeDropdown', 'Close search dropdown')}
            icon={<CloseIcon boxSize="10px" />}
            size="sm"
            variant="ghost"
            color="neutral.950"
            bg="transparent"
            _hover={{ bg: 'transparent' }}
            _active={{ bg: 'transparent' }}
            _focus={{ bg: 'transparent' }}
            _focusVisible={{ boxShadow: 'none' }}
            position="absolute"
            top="8px"
            right="8px"
            zIndex={1}
            onClick={handleCloseBreadcrumbPanel}
            data-testid="search-dropdown-close"
          />
          {breadcrumbPanelProps?.showTabs ? (
            <Box px="16px" py="8px" data-testid="search-dropdown-tabs">
              <Tabs
                index={breadcrumbPanelProps.activeTab}
                onChange={isTabsDisabled ? undefined : breadcrumbPanelProps.onTabChange}
              >
                <TabList w="fit-content" borderBottomWidth="0">
                  {breadcrumbTabs.map((tab) => (
                    <Tab
                      key={tab}
                      isDisabled={isTabsDisabled}
                      py="4px"
                      color={isTabsDisabled ? 'neutral.300' : 'neutral.400'}
                      borderBottomWidth="2px"
                      width="128px"
                      height="30px"
                      borderColor="neutral.200"
                      _selected={
                        isTabsDisabled
                          ? { color: 'neutral.300', borderColor: 'neutral.200' }
                          : { color: 'primary.500', borderColor: 'primary.500' }
                      }
                    >
                      <Text textStyle="h10" color="inherit">
                        {tab}
                      </Text>
                    </Tab>
                  ))}
                </TabList>
              </Tabs>
            </Box>
          ) : null}
          <Box bg="neutral.100" px="16px" py="8px">
            <Flex align="center">
              <Button
                variant="unstyled"
                onClick={() => handleTrailSelect(-1)}
                h="auto"
                minH="auto"
                textStyle="bodyText4"
                color="neutral.500"
                fontWeight="400"
                _hover={{ color: 'primary.500' }}
                _active={{ color: 'primary.500' }}
                aria-label={t('searchLayout.aria.breadcrumb', {
                  item: t('searchLayout.allStatesUTs', 'All States/UTs'),
                  defaultValue: 'Breadcrumb: All States/UTs',
                })}
              >
                {t('searchLayout.allStatesUTs', 'All States/UTs')}
              </Button>
              {effectiveSelectionTrail.map((item, index) => (
                <Flex key={`${item}-${index}`} align="center">
                  <Icon
                    as={FiChevronDown}
                    color="neutral.500"
                    boxSize="20px"
                    transform="rotate(-90deg)"
                  />
                  <Button
                    variant="unstyled"
                    onClick={() => handleTrailSelect(index)}
                    h="auto"
                    minH="auto"
                    textStyle="bodyText4"
                    color={index === effectiveActiveTrailIndex ? 'neutral.800' : 'neutral.500'}
                    fontWeight={index === effectiveActiveTrailIndex ? '500' : '400'}
                    _hover={{
                      color: index === effectiveActiveTrailIndex ? 'neutral.800' : 'primary.500',
                    }}
                    _active={{
                      color: index === effectiveActiveTrailIndex ? 'neutral.800' : 'primary.500',
                    }}
                    aria-current={index === effectiveActiveTrailIndex ? 'page' : undefined}
                    aria-label={t('searchLayout.aria.breadcrumb', {
                      item,
                      defaultValue: `Breadcrumb: ${item}`,
                    })}
                  >
                    {item}
                  </Button>
                </Flex>
              ))}
            </Flex>
          </Box>
          <Box px="16px" mt="12px">
            <Text textStyle="bodyText5" fontWeight="500" color="neutral.950" mb="8px">
              {panelOptionsLabel} ({panelOptionsCount})
            </Text>
            <Box
              display="grid"
              gridTemplateColumns={{
                base: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))',
                lg: 'repeat(5, minmax(0, 1fr))',
              }}
              gridTemplateRows={{ lg: 'repeat(15, minmax(20px, auto))' }}
              gridAutoFlow={{ lg: 'column' }}
              columnGap={{ base: '12px', lg: '24px' }}
              rowGap="8px"
              alignItems="start"
              alignContent="start"
              pb="16px"
              data-testid="search-options-grid"
            >
              {filteredStateOptions.map((state) => (
                <Button
                  key={state.value}
                  variant="ghost"
                  justifyContent="flex-start"
                  fontWeight="400"
                  textStyle="bodyText5"
                  color="neutral.950"
                  p={0}
                  h="auto"
                  fontSize="14px"
                  onClick={() => handleStateSelect(state.value)}
                  _hover={{ bg: 'transparent', color: 'primary.500' }}
                  _active={{ bg: 'transparent', color: 'primary.500' }}
                >
                  {state.label}
                </Button>
              ))}
              {filteredStateOptions.length === 0 ? (
                <Text fontSize="14px" color="neutral.300">
                  {noOptionsText}
                </Text>
              ) : null}
            </Box>
          </Box>
        </Box>
      ) : null}
    </Box>
  )
}
