import { useMemo, useRef, useState } from 'react'
import {
  Box,
  Button,
  Flex,
  Input,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  useMediaQuery,
  VStack,
} from '@chakra-ui/react'
import type { ResponsiveValue } from '@chakra-ui/react'
import type { Property } from 'csstype'
import { useTranslation } from 'react-i18next'
import { CalendarIcon } from './calendar-icon'
import {
  DEFAULT_SCREEN_DATE_FORMAT,
  formatIsoDateForDisplay,
  getDateInputPlaceholder,
  isValidDisplayDate,
  normalizeDateFormat,
  parseDisplayDateToIso,
} from '@/shared/utils/date-format'

export type DateRange = {
  startDate: string
  endDate: string
  preset?: string
}

type PresetDefinition = {
  id: string
  label: string
  getRange: (baseDate: Date) => { startDate: string; endDate: string }
}

type PopoverPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end'

export interface DateRangePickerProps {
  value: DateRange | null
  onChange: (value: DateRange | null) => void
  dateFormat?: string
  placeholder?: string
  disabled?: boolean
  width?: ResponsiveValue<Property.Width>
  fontSize?: ResponsiveValue<Property.FontSize>
  textColor?: string
  height?: string
  borderRadius?: string
  borderColor?: string
  textStyle?: string
  isFilter?: boolean
  placeholderColor?: string
  iconOnly?: boolean
  iconAriaLabel?: string
  popoverPlacement?: PopoverPlacement
}

const formatISODate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toCompactDisplayRange = (startDate: string, endDate: string, format: string) =>
  `${formatIsoDateForDisplay(startDate, format, { shortYear: true })}-${formatIsoDateForDisplay(endDate, format, { shortYear: true })}`

const startOfWeek = (date: Date) => {
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const start = new Date(date)
  start.setDate(date.getDate() + diff)
  return start
}

const endOfWeek = (date: Date) => {
  const start = startOfWeek(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return end
}

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)

const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0)

const clampIsoDateToMax = (value: string, max: string) => {
  if (!value) return value
  return value > max ? max : value
}

export function DateRangePicker({
  value,
  onChange,
  dateFormat = DEFAULT_SCREEN_DATE_FORMAT,
  placeholder = 'Duration',
  disabled = false,
  width = '162px',
  fontSize = 'sm',
  textColor,
  height = '32px',
  borderRadius = '4px',
  borderColor = 'neutral.400',
  textStyle = 'h10',
  isFilter = false,
  placeholderColor = 'neutral.500',
  iconOnly = false,
  iconAriaLabel,
  popoverPlacement = 'bottom-start',
}: DateRangePickerProps) {
  const { t } = useTranslation('dashboard')
  const resolvedDateFormat = normalizeDateFormat(dateFormat)
  const dateInputPlaceholder = getDateInputPlaceholder(resolvedDateFormat)
  const [isTinyPicker] = useMediaQuery('(max-width: 599px)')
  const todayIso = useMemo(() => formatISODate(new Date()), [])
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState<DateRange | null>(value)
  const [tinyPopoverWidth, setTinyPopoverWidth] = useState<number | null>(null)
  const [tinyPopoverOffset, setTinyPopoverOffset] = useState(0)
  const [draftIso, setDraftIso] = useState<{ startDate: string; endDate: string } | null>(
    value
      ? {
          startDate: parseDisplayDateToIso(value.startDate, resolvedDateFormat),
          endDate: parseDisplayDateToIso(value.endDate, resolvedDateFormat),
        }
      : null
  )
  const startDateInputRef = useRef<HTMLInputElement | null>(null)
  const endDateInputRef = useRef<HTMLInputElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const syncDraftFromValue = (nextValue: DateRange | null) => {
    setDraft(nextValue)
    setDraftIso(
      nextValue
        ? {
            startDate: parseDisplayDateToIso(nextValue.startDate, resolvedDateFormat),
            endDate: parseDisplayDateToIso(nextValue.endDate, resolvedDateFormat),
          }
        : null
    )
  }

  const presets = useMemo<PresetDefinition[]>(
    () => [
      {
        id: 'today',
        label: t('filters.dateRangePicker.presets.today', 'Today'),
        getRange: (baseDate) => ({
          startDate: formatISODate(baseDate),
          endDate: formatISODate(baseDate),
        }),
      },
      {
        id: 'yesterday',
        label: t('filters.dateRangePicker.presets.yesterday', 'Yesterday'),
        getRange: (baseDate) => {
          const yesterday = new Date(baseDate)
          yesterday.setDate(baseDate.getDate() - 1)
          return {
            startDate: formatISODate(yesterday),
            endDate: formatISODate(yesterday),
          }
        },
      },
      {
        id: 'this-week',
        label: t('filters.dateRangePicker.presets.thisWeek', 'This week'),
        getRange: (baseDate) => ({
          startDate: formatISODate(startOfWeek(baseDate)),
          endDate: formatISODate(endOfWeek(baseDate)),
        }),
      },
      {
        id: 'last-week',
        label: t('filters.dateRangePicker.presets.lastWeek', 'Last week'),
        getRange: (baseDate) => {
          const lastWeek = new Date(baseDate)
          lastWeek.setDate(baseDate.getDate() - 7)
          return {
            startDate: formatISODate(startOfWeek(lastWeek)),
            endDate: formatISODate(endOfWeek(lastWeek)),
          }
        },
      },
      {
        id: 'this-month',
        label: t('filters.dateRangePicker.presets.thisMonth', 'This month'),
        getRange: (baseDate) => ({
          startDate: formatISODate(startOfMonth(baseDate)),
          endDate: formatISODate(endOfMonth(baseDate)),
        }),
      },
      {
        id: 'last-month',
        label: t('filters.dateRangePicker.presets.lastMonth', 'Last month'),
        getRange: (baseDate) => {
          const lastMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1)
          return {
            startDate: formatISODate(startOfMonth(lastMonth)),
            endDate: formatISODate(endOfMonth(lastMonth)),
          }
        },
      },
    ],
    [t]
  )

  const displayLabel = value
    ? value.preset ||
      toCompactDisplayRange(
        parseDisplayDateToIso(value.startDate, resolvedDateFormat),
        parseDisplayDateToIso(value.endDate, resolvedDateFormat),
        resolvedDateFormat
      )
    : placeholder

  const displayColor = isFilter
    ? value
      ? 'primary.500'
      : textColor || placeholderColor
    : textColor || (value ? 'neutral.950' : placeholderColor)

  const displayBorderColor = isFilter ? (value ? 'primary.500' : borderColor) : borderColor
  const triggerAriaLabel = iconAriaLabel || placeholder
  const placement = isTinyPicker ? 'bottom-start' : popoverPlacement
  const modifiers = isTinyPicker
    ? [
        { name: 'offset', options: { offset: [tinyPopoverOffset, 8] } },
        { name: 'flip', enabled: true },
        {
          name: 'preventOverflow',
          options: { mainAxis: true, altAxis: true, tether: true, padding: 8 },
        },
      ]
    : [
        { name: 'offset', options: { offset: [0, 8] } },
        { name: 'flip', enabled: false },
        { name: 'preventOverflow', options: { mainAxis: false, altAxis: false, tether: false } },
      ]

  const handleOpen = () => {
    if (!disabled) {
      if (isTinyPicker && triggerRef.current) {
        const dashboardContent = document.getElementById('main-content')
        if (dashboardContent instanceof HTMLElement) {
          const searchLayoutRect = dashboardContent.getBoundingClientRect()
          const triggerRect = triggerRef.current.getBoundingClientRect()

          setTinyPopoverWidth(searchLayoutRect.width)
          setTinyPopoverOffset(searchLayoutRect.left - triggerRect.left)
        }
      }
      syncDraftFromValue(value)
      setIsOpen(true)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const handlePreset = (preset: PresetDefinition) => {
    const range = preset.getRange(new Date())
    const clampedEndDate = clampIsoDateToMax(range.endDate, todayIso)
    setDraft({
      startDate: formatIsoDateForDisplay(range.startDate, resolvedDateFormat),
      endDate: formatIsoDateForDisplay(clampedEndDate, resolvedDateFormat),
      preset: preset.label,
    })
    setDraftIso({ startDate: range.startDate, endDate: clampedEndDate })
  }

  const handleApply = () => {
    if (!draft?.startDate || !draft?.endDate) return
    if (
      !isValidDisplayDate(draft.startDate, resolvedDateFormat) ||
      !isValidDisplayDate(draft.endDate, resolvedDateFormat)
    ) {
      return
    }
    const start = clampIsoDateToMax(
      parseDisplayDateToIso(draft.startDate, resolvedDateFormat),
      todayIso
    )
    const end = clampIsoDateToMax(
      parseDisplayDateToIso(draft.endDate, resolvedDateFormat),
      todayIso
    )
    if (!start || !end) return
    if (start > end) {
      onChange({
        startDate: end,
        endDate: start,
        preset: draft?.preset,
      })
    } else {
      onChange({
        startDate: start,
        endDate: end,
        preset: draft?.preset,
      })
    }
    handleClose()
  }

  const handleClear = () => {
    setDraft(null)
    onChange(null)
    handleClose()
  }

  const startIso = draft?.startDate
    ? parseDisplayDateToIso(draft.startDate, resolvedDateFormat)
    : undefined
  const endIso = draft?.endDate
    ? parseDisplayDateToIso(draft.endDate, resolvedDateFormat)
    : undefined

  const isApplyDisabled =
    !draft?.startDate ||
    !draft?.endDate ||
    !isValidDisplayDate(draft.startDate, resolvedDateFormat) ||
    !isValidDisplayDate(draft.endDate, resolvedDateFormat) ||
    startIso > todayIso ||
    endIso > todayIso ||
    endIso < startIso

  const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    if (!ref.current) return
    if (typeof ref.current.showPicker === 'function') {
      ref.current.showPicker()
    } else {
      ref.current.focus()
      ref.current.click()
    }
  }

  return (
    <Popover
      isOpen={isOpen}
      onOpen={handleOpen}
      onClose={handleClose}
      placement={placement}
      modifiers={modifiers}
    >
      <PopoverTrigger>
        <Flex
          as="button"
          ref={triggerRef}
          type="button"
          aria-label={triggerAriaLabel}
          w={width}
          maxW={width}
          h={height}
          maxH={height}
          pl={iconOnly ? '8px' : value ? '8px' : '12px'}
          pr={iconOnly ? '8px' : '10px'}
          py="6px"
          bg="white"
          borderWidth="1px"
          borderColor={displayBorderColor}
          borderRadius={borderRadius}
          align="center"
          justify={iconOnly ? 'center' : 'space-between'}
          cursor={disabled ? 'not-allowed' : 'pointer'}
          opacity={disabled ? 0.6 : 1}
          _hover={!disabled ? { borderColor: 'neutral.400' } : undefined}
          _focus={{ borderColor: 'primary.500', outline: 'none' }}
          _disabled={{ cursor: 'not-allowed', opacity: 0.6, pointerEvents: 'none' }}
        >
          {iconOnly ? null : (
            <Text
              flex="1"
              minW={0}
              textAlign="left"
              fontSize={fontSize}
              lineHeight={value ? '16px' : undefined}
              color={displayColor}
              textStyle={textStyle}
              fontWeight={isFilter ? 'semibold' : '400'}
              letterSpacing={value ? '-0.02em' : undefined}
              noOfLines={1}
              sx={
                value
                  ? {
                      fontSize: '11px',
                    }
                  : undefined
              }
            >
              {displayLabel}
            </Text>
          )}
          <CalendarIcon boxSize="16px" color={displayColor} />
        </Flex>
      </PopoverTrigger>
      <PopoverContent
        w={isTinyPicker && tinyPopoverWidth ? `${tinyPopoverWidth}px` : 'full'}
        minW={isTinyPicker ? 'auto' : '250'}
        maxW="min(420px, calc(100vw - 32px))"
        borderColor="neutral.100"
        boxShadow="md"
        mt="16px"
      >
        <PopoverBody p="16px" w="full" maxW="full">
          <Flex direction="row" gap="16px" align="flex-start" w="full" maxW="full">
            {isTinyPicker ? null : (
              <VStack align="stretch" spacing="6px" minW="160px" flex="0 0 160px">
                <Text textStyle="h10" color="neutral.500">
                  {t('filters.dateRangePicker.quickRanges', 'Quick ranges')}
                </Text>
                {presets.map((preset) => {
                  const isSelected = draft?.preset === preset.label
                  return (
                    <Button
                      key={preset.id}
                      variant="ghost"
                      justifyContent="flex-start"
                      size="sm"
                      fontWeight={isSelected ? '600' : '500'}
                      color={isSelected ? 'primary.500' : 'neutral.600'}
                      onClick={() => handlePreset(preset)}
                    >
                      {preset.label}
                    </Button>
                  )
                })}
              </VStack>
            )}
            <Box flex="1" minW={0}>
              <Flex direction="column" gap="12px">
                <Box w="full" minW={0}>
                  <Text textStyle="h10" color="neutral.500" mb="6px">
                    {t('filters.dateRangePicker.startDate', 'Start date')}
                  </Text>
                  <Box position="relative">
                    <Input
                      type="text"
                      placeholder={dateInputPlaceholder}
                      value={draft?.startDate ?? ''}
                      onFocus={() => openPicker(startDateInputRef)}
                      onChange={(event) => {
                        const rawValue = event.target.value
                        const nextValue =
                          isValidDisplayDate(rawValue, resolvedDateFormat) &&
                          parseDisplayDateToIso(rawValue, resolvedDateFormat) > todayIso
                            ? formatIsoDateForDisplay(todayIso, resolvedDateFormat)
                            : rawValue
                        setDraft((current) => {
                          const currentEnd = current?.endDate ?? ''
                          const shouldAdjustEnd =
                            isValidDisplayDate(nextValue, resolvedDateFormat) &&
                            isValidDisplayDate(currentEnd, resolvedDateFormat) &&
                            parseDisplayDateToIso(currentEnd, resolvedDateFormat) <
                              parseDisplayDateToIso(nextValue, resolvedDateFormat)
                          return {
                            startDate: nextValue,
                            endDate: shouldAdjustEnd ? nextValue : currentEnd,
                            preset: undefined,
                          }
                        })
                        setDraftIso((current) => {
                          const currentEnd = current?.endDate ?? ''
                          if (!isValidDisplayDate(nextValue, resolvedDateFormat)) {
                            return { startDate: '', endDate: currentEnd }
                          }
                          const nextStart = parseDisplayDateToIso(nextValue, resolvedDateFormat)
                          const shouldAdjustEnd = currentEnd && currentEnd < nextStart
                          return {
                            startDate: nextStart,
                            endDate: shouldAdjustEnd ? nextStart : currentEnd,
                          }
                        })
                      }}
                      borderColor="neutral.200"
                      _hover={{ borderColor: 'neutral.300' }}
                      _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
                    />
                    <Input
                      ref={startDateInputRef}
                      type="date"
                      max={todayIso}
                      value={draftIso?.startDate ?? ''}
                      tabIndex={-1}
                      aria-hidden="true"
                      onChange={(event) => {
                        const nextValue = clampIsoDateToMax(event.target.value, todayIso)
                        setDraftIso((current) => {
                          const currentEnd = current?.endDate ?? ''
                          const nextEnd =
                            currentEnd && currentEnd < nextValue ? nextValue : currentEnd
                          return {
                            startDate: nextValue,
                            endDate: nextEnd,
                          }
                        })
                        setDraft((current) => {
                          const currentEnd = current?.endDate ?? ''
                          const nextEnd =
                            currentEnd &&
                            parseDisplayDateToIso(currentEnd, resolvedDateFormat) < nextValue
                              ? formatIsoDateForDisplay(nextValue, resolvedDateFormat)
                              : currentEnd
                          return {
                            startDate: formatIsoDateForDisplay(nextValue, resolvedDateFormat),
                            endDate: nextEnd,
                            preset: undefined,
                          }
                        })
                      }}
                      position="absolute"
                      top={0}
                      left={0}
                      w="full"
                      h="full"
                      opacity={0}
                      pointerEvents="none"
                    />
                  </Box>
                </Box>
                <Box w="full" minW={0}>
                  <Text textStyle="h10" color="neutral.500" mb="6px">
                    {t('filters.dateRangePicker.endDate', 'End date')}
                  </Text>
                  <Box position="relative">
                    <Input
                      type="text"
                      placeholder={dateInputPlaceholder}
                      value={draft?.endDate ?? ''}
                      onFocus={() => openPicker(endDateInputRef)}
                      onChange={(event) => {
                        const nextValue = event.target.value
                        setDraft((current) => ({
                          startDate: current?.startDate ?? '',
                          endDate:
                            isValidDisplayDate(nextValue, resolvedDateFormat) &&
                            parseDisplayDateToIso(nextValue, resolvedDateFormat) > todayIso
                              ? formatIsoDateForDisplay(todayIso, resolvedDateFormat)
                              : nextValue,
                          preset: undefined,
                        }))
                        setDraftIso((current) => ({
                          startDate: current?.startDate ?? '',
                          endDate: isValidDisplayDate(nextValue, resolvedDateFormat)
                            ? clampIsoDateToMax(
                                parseDisplayDateToIso(nextValue, resolvedDateFormat),
                                todayIso
                              )
                            : '',
                        }))
                      }}
                      borderColor="neutral.200"
                      _hover={{ borderColor: 'neutral.300' }}
                      _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
                    />
                    <Input
                      ref={endDateInputRef}
                      type="date"
                      min={draftIso?.startDate || undefined}
                      max={todayIso}
                      value={draftIso?.endDate ?? ''}
                      tabIndex={-1}
                      aria-hidden="true"
                      onChange={(event) => {
                        const nextValue = clampIsoDateToMax(event.target.value, todayIso)
                        setDraftIso((current) => ({
                          startDate: current?.startDate ?? '',
                          endDate: nextValue,
                        }))
                        setDraft((current) => ({
                          startDate: current?.startDate ?? '',
                          endDate: formatIsoDateForDisplay(nextValue, resolvedDateFormat),
                          preset: undefined,
                        }))
                      }}
                      position="absolute"
                      top={0}
                      left={0}
                      w="full"
                      h="full"
                      opacity={0}
                      pointerEvents="none"
                    />
                  </Box>
                </Box>
              </Flex>
              <Flex justify="flex-end" gap="8px" mt="16px">
                <Button variant="outline" size="sm" onClick={handleClear}>
                  {t('filters.dateRangePicker.clear', 'Clear')}
                </Button>
                <Button
                  colorScheme="teal"
                  size="sm"
                  onClick={handleApply}
                  isDisabled={isApplyDisabled}
                >
                  {t('filters.dateRangePicker.apply', 'Apply')}
                </Button>
              </Flex>
            </Box>
          </Flex>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}
