import { useRef, useState } from 'react'
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
  clampIsoDateToMax,
  DEFAULT_SCREEN_DATE_FORMAT,
  formatIsoDateForDisplay,
  getDateInputPlaceholder,
  isoDateToLocalDate,
  isValidDisplayDate,
  normalizeDateFormat,
  parseDisplayDateToIso,
  toLocalIsoDate,
} from '@/shared/utils/date-format'
import {
  DATE_PRESET_IDS,
  DATE_PRESET_LABELS,
  resolveDatePresetRange,
  type DatePresetId,
} from '@/shared/utils/date-presets'
import { syncCurrentIsoDate, useCurrentIsoDate } from '@/shared/hooks/use-current-iso-date'

export type DateRange = {
  startDate: string
  endDate: string
  // Stable preset identity. The visible label is derived from this at render time so it
  // follows the active language and so a preset can be re-resolved when the day changes.
  presetId?: DatePresetId
}

type PresetOption = {
  id: DatePresetId
  label: string
  range: { startDate: string; endDate: string }
  // True when the whole range sits beyond maxDate, so it can never be applied.
  isUnavailable: boolean
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
  maxDate?: string
  defaultRange?: DateRange
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

const toCompactDisplayRange = (startDate: string, endDate: string, format: string) =>
  startDate === endDate
    ? formatIsoDateForDisplay(startDate, format)
    : `${formatIsoDateForDisplay(startDate, format)}-${formatIsoDateForDisplay(endDate, format)}`

const getDefaultRangeIso = (endDateIso: string): DateRange => {
  const endDate = isoDateToLocalDate(endDateIso)
  const startDate = new Date(endDate)
  startDate.setDate(endDate.getDate() - 29)
  return {
    startDate: toLocalIsoDate(startDate),
    endDate: endDateIso,
    presetId: undefined,
  }
}

export function DateRangePicker({
  value,
  onChange,
  dateFormat = DEFAULT_SCREEN_DATE_FORMAT,
  maxDate,
  defaultRange,
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
  // Live, not frozen at mount: a picker left open across a day rollover (or through a
  // clock correction) must not keep yesterday's ceiling.
  const currentIsoDate = useCurrentIsoDate()
  const maxDateIso = maxDate
    ? parseDisplayDateToIso(maxDate, resolvedDateFormat) || currentIsoDate
    : currentIsoDate
  const defaultRangeIso = defaultRange ?? getDefaultRangeIso(maxDateIso)
  const showDefaultRange = isFilter && !value
  const displayRange = value ?? (showDefaultRange ? defaultRangeIso : null)
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
    const resolvedValue = nextValue ?? (showDefaultRange ? defaultRangeIso : null)
    setDraft(
      resolvedValue
        ? {
            startDate: formatIsoDateForDisplay(
              parseDisplayDateToIso(resolvedValue.startDate, resolvedDateFormat),
              resolvedDateFormat
            ),
            endDate: formatIsoDateForDisplay(
              parseDisplayDateToIso(resolvedValue.endDate, resolvedDateFormat),
              resolvedDateFormat
            ),
            presetId: resolvedValue.presetId,
          }
        : null
    )
    setDraftIso(
      resolvedValue
        ? {
            startDate: parseDisplayDateToIso(resolvedValue.startDate, resolvedDateFormat),
            endDate: parseDisplayDateToIso(resolvedValue.endDate, resolvedDateFormat),
          }
        : null
    )
  }

  // Resolved against the live calendar day, so "Yesterday" means yesterday relative to
  // now — never relative to whenever this component happened to mount.
  const presets: PresetOption[] = DATE_PRESET_IDS.map((id) => {
    const range = resolveDatePresetRange(id, isoDateToLocalDate(currentIsoDate))
    return {
      id,
      label: t(DATE_PRESET_LABELS[id].key, DATE_PRESET_LABELS[id].defaultLabel),
      range,
      // A range that starts after the ceiling has nothing left to show once clamped.
      isUnavailable: range.startDate > maxDateIso,
    }
  })

  const displayPresetLabel = displayRange?.presetId
    ? t(
        DATE_PRESET_LABELS[displayRange.presetId].key,
        DATE_PRESET_LABELS[displayRange.presetId].defaultLabel
      )
    : ''
  const displayLabel = displayRange
    ? displayPresetLabel ||
      toCompactDisplayRange(
        parseDisplayDateToIso(displayRange.startDate, resolvedDateFormat),
        parseDisplayDateToIso(displayRange.endDate, resolvedDateFormat),
        resolvedDateFormat
      )
    : placeholder

  const hasActiveRange = Boolean(displayRange)
  const displayColor = isFilter
    ? hasActiveRange
      ? 'primary.500'
      : textColor || placeholderColor
    : textColor || (hasActiveRange ? 'neutral.950' : placeholderColor)

  const displayBorderColor = isFilter ? (hasActiveRange ? 'primary.500' : borderColor) : borderColor
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
      // Re-read the wall clock at the moment of use. Opening the picker and clicking a
      // preset are separate interactions with a render between them, so this guarantees
      // the ceiling and every preset are resolved against the real day on the popover's
      // first paint — even if a background tab's midnight timer never fired.
      syncCurrentIsoDate()

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

  const handlePreset = (preset: PresetOption) => {
    // Never silently substitute a different day: if the preset is entirely past the
    // ceiling it is surfaced as disabled instead of resolving to a wrong date.
    if (preset.isUnavailable) {
      return
    }

    // Only the end may be clamped — "this week"/"this month" legitimately run into the
    // future, and trimming their tail to the ceiling still yields the intended range.
    const clampedEndDate = clampIsoDateToMax(preset.range.endDate, maxDateIso)
    setDraft({
      startDate: formatIsoDateForDisplay(preset.range.startDate, resolvedDateFormat),
      endDate: formatIsoDateForDisplay(clampedEndDate, resolvedDateFormat),
      presetId: preset.id,
    })
    setDraftIso({ startDate: preset.range.startDate, endDate: clampedEndDate })
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
      maxDateIso
    )
    const end = clampIsoDateToMax(
      parseDisplayDateToIso(draft.endDate, resolvedDateFormat),
      maxDateIso
    )
    if (!start || !end) return
    if (start > end) {
      onChange({
        startDate: end,
        endDate: start,
        presetId: draft?.presetId,
      })
    } else {
      onChange({
        startDate: start,
        endDate: end,
        presetId: draft?.presetId,
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
  const normalizedDisplayStart = displayRange
    ? parseDisplayDateToIso(displayRange.startDate, resolvedDateFormat)
    : undefined
  const normalizedDisplayEnd = displayRange
    ? parseDisplayDateToIso(displayRange.endDate, resolvedDateFormat)
    : undefined

  const isApplyDisabled = (() => {
    if (
      !draft?.startDate ||
      !draft?.endDate ||
      !isValidDisplayDate(draft.startDate, resolvedDateFormat) ||
      !isValidDisplayDate(draft.endDate, resolvedDateFormat)
    ) {
      return true
    }
    if (!startIso || !endIso) {
      return true
    }
    if (startIso > maxDateIso || endIso > maxDateIso || endIso < startIso) {
      return true
    }
    if (displayRange && normalizedDisplayStart === startIso && normalizedDisplayEnd === endIso) {
      return true
    }
    return false
  })()

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
          pl={iconOnly ? '8px' : hasActiveRange ? '8px' : '12px'}
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
          _hover={
            !disabled
              ? { borderColor: hasActiveRange && isFilter ? 'primary.500' : 'neutral.400' }
              : undefined
          }
          _focus={{ borderColor: 'primary.500', outline: 'none' }}
          _disabled={{ cursor: 'not-allowed', opacity: 0.6, pointerEvents: 'none' }}
        >
          {iconOnly ? null : (
            <Text
              flex="1"
              minW={0}
              textAlign="left"
              fontSize={fontSize}
              lineHeight={hasActiveRange ? '16px' : undefined}
              color={displayColor}
              textStyle={textStyle}
              fontWeight={isFilter ? 'semibold' : '400'}
              letterSpacing={hasActiveRange ? '-0.02em' : undefined}
              noOfLines={1}
              sx={
                hasActiveRange
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
                  const isSelected = draft?.presetId === preset.id
                  return (
                    <Button
                      key={preset.id}
                      variant="ghost"
                      justifyContent="flex-start"
                      size="sm"
                      fontWeight={isSelected ? '600' : '500'}
                      color={isSelected ? 'primary.500' : 'neutral.600'}
                      isDisabled={preset.isUnavailable}
                      title={
                        preset.isUnavailable
                          ? t(
                              'filters.dateRangePicker.presetUnavailable',
                              'Not available within the allowed date range'
                            )
                          : undefined
                      }
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
                          parseDisplayDateToIso(rawValue, resolvedDateFormat) > maxDateIso
                            ? formatIsoDateForDisplay(maxDateIso, resolvedDateFormat)
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
                            presetId: undefined,
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
                      max={maxDateIso}
                      value={draftIso?.startDate ?? ''}
                      tabIndex={-1}
                      aria-hidden="true"
                      onChange={(event) => {
                        const nextValue = clampIsoDateToMax(event.target.value, maxDateIso)
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
                            presetId: undefined,
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
                            parseDisplayDateToIso(nextValue, resolvedDateFormat) > maxDateIso
                              ? formatIsoDateForDisplay(maxDateIso, resolvedDateFormat)
                              : nextValue,
                          presetId: undefined,
                        }))
                        setDraftIso((current) => ({
                          startDate: current?.startDate ?? '',
                          endDate: isValidDisplayDate(nextValue, resolvedDateFormat)
                            ? clampIsoDateToMax(
                                parseDisplayDateToIso(nextValue, resolvedDateFormat),
                                maxDateIso
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
                      max={maxDateIso}
                      value={draftIso?.endDate ?? ''}
                      tabIndex={-1}
                      aria-hidden="true"
                      onChange={(event) => {
                        const nextValue = clampIsoDateToMax(event.target.value, maxDateIso)
                        setDraftIso((current) => ({
                          startDate: current?.startDate ?? '',
                          endDate: nextValue,
                        }))
                        setDraft((current) => ({
                          startDate: current?.startDate ?? '',
                          endDate: formatIsoDateForDisplay(nextValue, resolvedDateFormat),
                          presetId: undefined,
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
