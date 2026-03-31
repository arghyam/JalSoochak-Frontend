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
}

export function ViewBySelect({
  value,
  onChange,
  ariaLabel,
  color = 'primary.500',
  borderColor = 'primary.500',
}: ViewBySelectProps) {
  const { t } = useTranslation('dashboard')
  const geographyLabel = t('performanceCharts.viewBy.geography', { defaultValue: 'Geography' })
  const timeLabel = t('performanceCharts.viewBy.time', { defaultValue: 'Time' })

  return (
    <Menu>
      <MenuButton
        as={Button}
        aria-label={ariaLabel}
        rightIcon={<LuChevronDown size={16} />}
        h="32px"
        minW="128px"
        px="12px"
        textStyle="bodyText5"
        fontWeight="500"
        justifyContent="space-between"
        textAlign="left"
        borderRadius="4px"
        borderColor={borderColor}
        borderWidth="1px"
        bg="white"
        color={color}
        _hover={{ borderColor, bg: 'white' }}
        _focus={{ borderColor, boxShadow: 'none' }}
        _active={{ bg: 'white' }}
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
