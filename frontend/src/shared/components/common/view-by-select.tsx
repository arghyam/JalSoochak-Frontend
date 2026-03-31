import { Button, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { LuChevronDown } from 'react-icons/lu'

export type ViewByValue = 'geography' | 'time'

type ViewBySelectProps = {
  value: ViewByValue
  onChange: (value: ViewByValue) => void
  ariaLabel: string
  color?: string
  borderColor?: string
  disabled?: boolean
}

export function ViewBySelect({
  value,
  onChange,
  ariaLabel,
  color = 'primary.500',
  borderColor = 'primary.500',
  disabled = false,
}: ViewBySelectProps) {
  const { t } = useTranslation('dashboard')
  const geographyLabel = t('performanceCharts.viewBy.geography', { defaultValue: 'Geography' })
  const timeLabel = t('performanceCharts.viewBy.time', { defaultValue: 'Time' })
  const resolvedColor = disabled ? 'neutral.500' : color
  const resolvedBorderColor = disabled ? 'neutral.300' : borderColor

  return (
    <Menu>
      <MenuButton
        as={Button}
        aria-label={ariaLabel}
        isDisabled={disabled}
        rightIcon={<LuChevronDown size={16} />}
        h="32px"
        minW="128px"
        px="12px"
        textStyle="bodyText5"
        fontWeight="500"
        justifyContent="space-between"
        textAlign="left"
        borderRadius="4px"
        borderColor={resolvedBorderColor}
        borderWidth="1px"
        bg="white"
        color={resolvedColor}
        _hover={{ borderColor: resolvedBorderColor, bg: 'white' }}
        _focus={{ borderColor: resolvedBorderColor, boxShadow: 'none' }}
        _active={{ bg: 'white' }}
        _disabled={{
          opacity: 1,
          cursor: 'not-allowed',
          bg: 'white',
          color: resolvedColor,
          borderColor: resolvedBorderColor,
        }}
      >
        {value === 'geography' ? geographyLabel : timeLabel}
      </MenuButton>
      <MenuList minW="128px" py={1}>
        <MenuItem
          onClick={() => onChange('geography')}
          textStyle="bodyText5"
          bg="white"
          color="neutral.900"
          fontWeight="500"
          _hover={{ bg: 'neutral.100' }}
          _focus={{ bg: 'neutral.100' }}
        >
          {geographyLabel}
        </MenuItem>
        <MenuItem
          onClick={() => onChange('time')}
          textStyle="bodyText5"
          bg="white"
          color="neutral.900"
          fontWeight="500"
          _hover={{ bg: 'neutral.100' }}
          _focus={{ bg: 'neutral.100' }}
        >
          {timeLabel}
        </MenuItem>
      </MenuList>
    </Menu>
  )
}
