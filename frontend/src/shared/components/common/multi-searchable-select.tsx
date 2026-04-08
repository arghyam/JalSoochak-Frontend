import { useState, useRef, useId } from 'react'
import { Box, Checkbox, Text, VStack, useOutsideClick, Flex } from '@chakra-ui/react'
import type { ResponsiveValue } from '@chakra-ui/react'
import type { Property } from 'csstype'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { useTranslation } from 'react-i18next'
import type { SearchableSelectOption } from './searchable-select'

export interface MultiSearchableSelectProps {
  options: SearchableSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
  width?: ResponsiveValue<Property.Width>
  fontSize?: string
  textColor?: string
  height?: string
  borderRadius?: string
  borderColor?: string
  textStyle?: string
  required?: boolean
  isFilter?: boolean
  id?: string
  'aria-labelledby'?: string
  ariaLabel?: string
  placeholderColor?: string
}

export function MultiSearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select',
  disabled = false,
  width = '486px',
  fontSize = 'sm',
  textColor,
  height = '36px',
  borderRadius = '6px',
  borderColor = 'neutral.300',
  textStyle = 'h10',
  required = false,
  isFilter = false,
  id,
  'aria-labelledby': ariaLabelledBy,
  ariaLabel,
  placeholderColor = 'neutral.500',
}: MultiSearchableSelectProps) {
  const { t } = useTranslation('common')
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const listboxRef = useRef<HTMLDivElement>(null)

  useOutsideClick({
    ref: containerRef,
    handler: () => setIsOpen(false),
  })

  const handleToggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen((prev) => !prev)
      if (!isOpen) setFocusedIndex(-1)
    }
  }

  const handleListboxKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev))
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      }
      case 'Enter':
      case ' ': {
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          handleToggleOption(options[focusedIndex].value)
        }
        break
      }
      case 'Escape': {
        e.preventDefault()
        setIsOpen(false)
        setFocusedIndex(-1)
        break
      }
      default:
        break
    }
  }

  const getDisplayLabel = (): string => {
    if (value.length === 0) return ''
    if (value.length === 1) return options.find((o) => o.value === value[0])?.label ?? value[0]
    return `${value.length} selected`
  }

  const hasSelection = value.length > 0
  const displayLabel = getDisplayLabel()

  const displayColor = isFilter
    ? hasSelection
      ? 'primary.500'
      : (textColor ?? placeholderColor)
    : (textColor ?? (hasSelection ? 'neutral.950' : placeholderColor))
  const displayBorderColor = isFilter ? (hasSelection ? 'primary.500' : borderColor) : borderColor

  return (
    <Box position="relative" ref={containerRef} w={width}>
      <Flex
        as="button"
        type="button"
        id={id}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-multiselectable="true"
        aria-labelledby={ariaLabelledBy}
        aria-label={ariaLabel}
        aria-disabled={disabled}
        disabled={disabled}
        w="full"
        h={height}
        px="12px"
        py="6px"
        bg="white"
        borderWidth="1px"
        borderColor={displayBorderColor}
        borderRadius={borderRadius}
        align="center"
        justify="space-between"
        cursor={disabled ? 'not-allowed' : 'pointer'}
        opacity={disabled ? 0.6 : 1}
        onClick={handleToggle}
        _hover={!disabled ? { borderColor: 'neutral.400' } : undefined}
        _focus={{ borderColor: 'primary.500', outline: 'none' }}
        _disabled={{ cursor: 'not-allowed', opacity: 0.6, pointerEvents: 'none' }}
      >
        <Text
          fontSize={fontSize}
          color={displayColor}
          textStyle={textStyle}
          fontWeight={isFilter ? 'semibold' : '400'}
          noOfLines={1}
        >
          {hasSelection ? (
            displayLabel
          ) : (
            <>
              {placeholder}
              {required && (
                <Text as="span" color="#D92D20">
                  {' '}
                  *
                </Text>
              )}
            </>
          )}
        </Text>
        <ChevronDownIcon
          boxSize={5}
          color={isFilter && hasSelection ? 'primary.500' : 'neutral.500'}
          transform={isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
          transition="transform 0.2s"
        />
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
          boxShadow="0px 4px 6px -2px rgba(10, 13, 18, 0.03)"
          w="full"
          overflow="hidden"
        >
          <VStack
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            aria-activedescendant={
              focusedIndex >= 0 ? `option-${options[focusedIndex]?.value}` : undefined
            }
            align="stretch"
            spacing={0}
            maxH="233px"
            overflowY="auto"
            onKeyDown={handleListboxKeyDown}
            tabIndex={isOpen ? 0 : -1}
            sx={{
              '&::-webkit-scrollbar': { width: '4px' },
              '&::-webkit-scrollbar-track': { bg: 'neutral.50' },
              '&::-webkit-scrollbar-thumb': { bg: 'neutral.300', borderRadius: '2px' },
            }}
          >
            {options.length > 0 ? (
              options.map((option, index) => {
                const isSelected = value.includes(option.value)
                const isFocused = focusedIndex === index
                return (
                  <Box
                    key={option.value}
                    id={`option-${option.value}`}
                    role="option"
                    aria-selected={isSelected}
                    px="12px"
                    py="10px"
                    cursor="pointer"
                    bg={isFocused ? 'primary.100' : isSelected ? 'primary.50' : 'white'}
                    _hover={{ bg: isSelected ? 'primary.50' : 'neutral.50' }}
                    onClick={() => handleToggleOption(option.value)}
                  >
                    <Checkbox
                      isChecked={isSelected}
                      onChange={() => handleToggleOption(option.value)}
                      colorScheme="blue"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Text
                        fontSize="sm"
                        color={isSelected ? 'primary.600' : 'neutral.950'}
                        fontWeight={isSelected ? 'medium' : 'normal'}
                      >
                        {option.label}
                      </Text>
                    </Checkbox>
                  </Box>
                )
              })
            ) : (
              <Box px="12px" py="10px" role="status">
                <Text fontSize="sm" color="neutral.500">
                  {t('searchableSelect.noResults')}
                </Text>
              </Box>
            )}
          </VStack>
        </Box>
      )}
    </Box>
  )
}
