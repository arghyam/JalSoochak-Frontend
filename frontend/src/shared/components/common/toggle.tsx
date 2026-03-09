import { Switch, forwardRef } from '@chakra-ui/react'

export interface ToggleProps {
  /**
   * Whether the toggle is checked
   */
  isChecked?: boolean
  /**
   * Whether the toggle is disabled
   */
  isDisabled?: boolean
  /**
   * Callback when toggle state changes
   */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  /**
   * Name attribute for the input
   */
  name?: string
  /**
   * ID attribute for the input
   */
  id?: string
  /**
   * Accessible label for assistive technologies
   */
  'aria-label'?: string
  /**
   * Keep track color primary in both checked and unchecked states
   */
  alwaysPrimaryTrack?: boolean
}

export const Toggle = forwardRef<ToggleProps, 'input'>((props, ref) => {
  const {
    isChecked,
    isDisabled,
    onChange,
    name,
    id,
    'aria-label': ariaLabel,
    alwaysPrimaryTrack,
  } = props

  return (
    <Switch
      ref={ref}
      isChecked={isChecked}
      isDisabled={isDisabled}
      onChange={onChange}
      name={name}
      id={id}
      aria-label={ariaLabel}
      sx={{
        '.chakra-switch__track': {
          bg: isDisabled ? 'neutral.200' : alwaysPrimaryTrack ? 'primary.500' : 'neutral.300',
          boxSizing: 'border-box',
          width: '43px',
          height: '24px',
          padding: '2px',
          _checked: {
            bg: isDisabled ? 'primary.200' : 'primary.500',
          },
        },
        '.chakra-switch__thumb': {
          boxSizing: 'border-box',
          width: '20px',
          height: '20px',
          bg: 'white',
          _checked: {
            transform: 'translateX(19px)',
          },
        },
      }}
    />
  )
})

Toggle.displayName = 'Toggle'
