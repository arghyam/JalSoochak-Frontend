import { useState, useRef, useEffect } from 'react'
import { Box, Flex, Text, Button, HStack, useOutsideClick } from '@chakra-ui/react'
import type { ResponsiveValue } from '@chakra-ui/react'
import { TimeIcon } from '@chakra-ui/icons'

export interface TimePickerProps {
  value: string // HH:mm (24-hour)
  onChange: (value: string) => void
  isInvalid?: boolean
  id?: string
  w?: ResponsiveValue<string | number>
  isDisabled?: boolean
}

type AmPm = 'AM' | 'PM'

interface Time12 {
  hour: string // '01'–'12'
  minute: string // '00'–'59'
  ampm: AmPm
}

const HOURS: readonly string[] = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, '0')
)
const MINUTES: readonly string[] = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
const AMPM_OPTIONS: readonly string[] = ['AM', 'PM']
const ITEM_HEIGHT = 40
const COLUMNS = [HOURS, MINUTES, AMPM_OPTIONS] as const
const COLUMN_KEYS = ['hour', 'minute', 'ampm'] as const

export function to12Hour(value: string): Time12 {
  if (!value) return { hour: '12', minute: '00', ampm: 'AM' }
  const parts = value.split(':')
  const h = parseInt(parts[0] ?? '0', 10)
  const minuteNum = parseInt(parts[1] ?? '00', 10)
  const m =
    Number.isFinite(minuteNum) && minuteNum >= 0 && minuteNum <= 59
      ? String(minuteNum).padStart(2, '0')
      : '00'
  if (!Number.isFinite(h) || h < 0 || h > 23) return { hour: '12', minute: m, ampm: 'AM' }
  if (h === 0) return { hour: '12', minute: m, ampm: 'AM' }
  if (h < 12) return { hour: String(h).padStart(2, '0'), minute: m, ampm: 'AM' }
  if (h === 12) return { hour: '12', minute: m, ampm: 'PM' }
  return { hour: String(h - 12).padStart(2, '0'), minute: m, ampm: 'PM' }
}

export function to24Hour({ hour, minute, ampm }: Time12): string {
  const h12 = parseInt(hour, 10)
  const m = parseInt(minute, 10)
  if (!Number.isFinite(h12) || h12 < 1 || h12 > 12 || !Number.isFinite(m) || m < 0 || m > 59) {
    return '00:00'
  }
  let h24: number
  if (ampm === 'AM') {
    h24 = h12 === 12 ? 0 : h12
  } else {
    h24 = h12 === 12 ? 12 : h12 + 12
  }
  return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

interface TimePickerColumnProps {
  items: readonly string[]
  selected: string
  onSelect: (value: string) => void
  'aria-label': string
}

function TimePickerColumn({
  items,
  selected,
  onSelect,
  'aria-label': ariaLabel,
}: TimePickerColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const idx = items.indexOf(selected)
    if (idx === -1 || !containerRef.current) return
    const container = containerRef.current
    const scrollTo = idx * ITEM_HEIGHT - container.clientHeight / 2 + ITEM_HEIGHT / 2
    container.scrollTop = Math.max(0, scrollTo)
  }, [items, selected])

  return (
    <Box
      ref={containerRef}
      role="listbox"
      aria-label={ariaLabel}
      h={`${ITEM_HEIGHT * 5}px`}
      overflowY="auto"
      sx={{
        '&::-webkit-scrollbar': { width: '4px' },
        '&::-webkit-scrollbar-track': { bg: 'neutral.50' },
        '&::-webkit-scrollbar-thumb': { bg: 'neutral.300', borderRadius: '2px' },
      }}
    >
      {items.map((item) => {
        const isSelected = item === selected
        return (
          <Box
            key={item}
            role="option"
            aria-selected={isSelected}
            h={`${ITEM_HEIGHT}px`}
            display="flex"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            bg={isSelected ? 'primary.25' : 'transparent'}
            color={isSelected ? 'primary.500' : 'neutral.700'}
            fontWeight={isSelected ? 'semibold' : 'normal'}
            fontSize="sm"
            borderRadius="6px"
            _hover={{ bg: 'primary.25', color: 'primary.700' }}
            onClick={() => onSelect(item)}
          >
            {item}
          </Box>
        )
      })}
    </Box>
  )
}

export function TimePicker({
  value,
  onChange,
  isInvalid = false,
  id,
  w,
  isDisabled = false,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [pending, setPending] = useState<Time12>(() => to12Hour(value))
  const [focusedColumn, setFocusedColumn] = useState(0)
  const [focusedIndex, setFocusedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useOutsideClick({
    ref: containerRef,
    handler: () => setIsOpen(false),
  })

  const handleOpen = () => {
    if (isDisabled) return
    const t = to12Hour(value)
    setPending(t)
    setFocusedColumn(0)
    setFocusedIndex(HOURS.indexOf(t.hour))
    setIsOpen(true)
  }

  const handleSave = () => {
    onChange(to24Hour(pending))
    setIsOpen(false)
  }

  const handleCancel = () => {
    setIsOpen(false)
  }

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape': {
          e.preventDefault()
          setIsOpen(false)
          break
        }
        case 'ArrowDown': {
          e.preventDefault()
          const items = COLUMNS[focusedColumn]
          const newIndex = (focusedIndex + 1) % items.length
          const val = items[newIndex]
          if (val === undefined) break
          setFocusedIndex(newIndex)
          if (focusedColumn === 0) setPending((p) => ({ ...p, hour: val }))
          else if (focusedColumn === 1) setPending((p) => ({ ...p, minute: val }))
          else setPending((p) => ({ ...p, ampm: val as AmPm }))
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          const items = COLUMNS[focusedColumn]
          const newIndex = (focusedIndex - 1 + items.length) % items.length
          const val = items[newIndex]
          if (val === undefined) break
          setFocusedIndex(newIndex)
          if (focusedColumn === 0) setPending((p) => ({ ...p, hour: val }))
          else if (focusedColumn === 1) setPending((p) => ({ ...p, minute: val }))
          else setPending((p) => ({ ...p, ampm: val as AmPm }))
          break
        }
        case 'ArrowRight': {
          e.preventDefault()
          const nextCol = Math.min(focusedColumn + 1, 2)
          if (nextCol !== focusedColumn) {
            const colKey = COLUMN_KEYS[nextCol]
            const colItems = COLUMNS[nextCol]
            if (colKey !== undefined && colItems !== undefined) {
              setFocusedColumn(nextCol)
              setFocusedIndex(colItems.indexOf(pending[colKey]))
            }
          }
          break
        }
        case 'ArrowLeft': {
          e.preventDefault()
          const prevCol = Math.max(focusedColumn - 1, 0)
          if (prevCol !== focusedColumn) {
            const colKey = COLUMN_KEYS[prevCol]
            const colItems = COLUMNS[prevCol]
            if (colKey !== undefined && colItems !== undefined) {
              setFocusedColumn(prevCol)
              setFocusedIndex(colItems.indexOf(pending[colKey]))
            }
          }
          break
        }
        case 'Enter':
        case ' ': {
          e.preventDefault()
          onChange(to24Hour(pending))
          setIsOpen(false)
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, focusedColumn, focusedIndex, pending, onChange])

  const displayTime = value
    ? (() => {
        const t = to12Hour(value)
        return `${t.hour}:${t.minute} ${t.ampm}`
      })()
    : ''

  return (
    <Box position="relative" ref={containerRef} w={w}>
      <Flex
        as="button"
        type="button"
        id={id}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Select time"
        disabled={isDisabled}
        aria-disabled={isDisabled}
        tabIndex={isDisabled ? -1 : 0}
        w="full"
        h="36px"
        px="12px"
        bg="white"
        borderWidth="1px"
        borderColor={isInvalid ? 'red.500' : isOpen ? 'primary.500' : 'neutral.300'}
        borderRadius="6px"
        align="center"
        justify="space-between"
        cursor={isDisabled ? 'not-allowed' : 'pointer'}
        opacity={isDisabled ? 0.6 : 1}
        onClick={handleOpen}
        _hover={!isDisabled ? { borderColor: 'neutral.400' } : undefined}
        _focus={{ borderColor: 'primary.500', outline: 'none', boxShadow: 'none' }}
        _disabled={{ cursor: 'not-allowed', opacity: 0.6 }}
      >
        <Text fontSize="sm" color={displayTime ? 'neutral.950' : 'neutral.500'}>
          {displayTime || 'Select time'}
        </Text>
        <TimeIcon boxSize={4} color="neutral.500" />
      </Flex>

      {isOpen && (
        <Box
          position="absolute"
          top="calc(100% + 4px)"
          left={0}
          zIndex={1000}
          bg="white"
          borderWidth="1px"
          borderColor="neutral.100"
          borderRadius="8px"
          boxShadow="0px 4px 6px -2px rgba(10, 13, 18, 0.03), 0px 12px 16px -4px rgba(10, 13, 18, 0.08)"
          w="240px"
          p="12px"
          role="dialog"
          aria-label="Time picker"
        >
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="neutral.500"
            textAlign="center"
            mb="8px"
            textTransform="uppercase"
            letterSpacing="0.05em"
          >
            Select time
          </Text>

          <HStack spacing={0} align="stretch">
            <Box flex={1}>
              <TimePickerColumn
                items={HOURS}
                selected={pending.hour}
                onSelect={(h) => setPending((p) => ({ ...p, hour: h }))}
                aria-label="Hour"
              />
            </Box>
            <Box w="1px" bg="neutral.100" mx="4px" />
            <Box flex={1}>
              <TimePickerColumn
                items={MINUTES}
                selected={pending.minute}
                onSelect={(m) => setPending((p) => ({ ...p, minute: m }))}
                aria-label="Minute"
              />
            </Box>
            <Box w="1px" bg="neutral.100" mx="4px" />
            <Box flex={1}>
              <TimePickerColumn
                items={AMPM_OPTIONS}
                selected={pending.ampm}
                onSelect={(a) => setPending((p) => ({ ...p, ampm: a as AmPm }))}
                aria-label="AM or PM"
              />
            </Box>
          </HStack>

          <HStack mt="12px" justify="flex-end" spacing="8px">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              color="neutral.700"
              _hover={{ bg: 'neutral.50' }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} colorScheme="primary">
              Save
            </Button>
          </HStack>
        </Box>
      )}
    </Box>
  )
}
