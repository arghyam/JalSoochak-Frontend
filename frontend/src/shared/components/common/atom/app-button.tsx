import { forwardRef } from 'react'
import {
  Button,
  IconButton,
  ButtonGroup,
  Spinner,
  type ButtonProps,
  type IconButtonProps,
} from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'split'
type ButtonSize = 'sm' | 'md' | 'lg'

interface BaseProps extends Omit<ButtonProps, 'size' | 'variant'> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  isDisabled?: boolean
}

interface StandardButtonProps extends BaseProps {
  iconOnly?: never
  leftIcon?: React.ReactElement
  rightIcon?: React.ReactElement
  children: React.ReactNode
  onClick?: ButtonProps['onClick']
  onDropdownClick?: () => void
}

interface IconOnlyButtonProps extends BaseProps {
  iconOnly: React.ReactElement
  ariaLabel: string
  children?: never
  leftIcon?: never
  rightIcon?: never
  onClick?: IconButtonProps['onClick']
  onDropdownClick?: never
}

export type AppButtonProps = StandardButtonProps | IconOnlyButtonProps

const SPLIT_DIVIDER_STYLE = {
  content: '""',
  position: 'absolute' as const,
  left: 0,
  top: '25%',
  bottom: '25%',
  width: '1px',
  bg: 'whiteAlpha.400',
}

export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>((props, ref) => {
  const { variant = 'primary', size = 'md', isLoading, isDisabled, ...rest } = props

  if ('iconOnly' in props && props.iconOnly) {
    const { iconOnly, ariaLabel, onClick } = props
    const resolvedVariant = variant === 'split' ? 'primary' : variant

    return (
      <IconButton
        ref={ref}
        aria-label={ariaLabel}
        icon={iconOnly}
        variant={resolvedVariant}
        size={size}
        isLoading={isLoading}
        isDisabled={isDisabled}
        onClick={onClick}
        {...rest}
      />
    )
  }

  const { leftIcon, rightIcon, children, onClick, onDropdownClick } = props as StandardButtonProps

  if (variant === 'split') {
    return (
      <SplitButton
        ref={ref}
        size={size}
        isLoading={isLoading}
        isDisabled={isDisabled}
        leftIcon={leftIcon}
        onClick={onClick}
        onDropdownClick={onDropdownClick}
      >
        {children}
      </SplitButton>
    )
  }

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      leftIcon={leftIcon}
      rightIcon={rightIcon}
      isLoading={isLoading}
      isDisabled={isDisabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </Button>
  )
})

AppButton.displayName = 'AppButton'

interface SplitButtonProps {
  size?: ButtonSize
  isLoading?: boolean
  isDisabled?: boolean
  leftIcon?: React.ReactElement
  children: React.ReactNode
  onClick?: ButtonProps['onClick']
  onDropdownClick?: () => void
}

const SplitButton = forwardRef<HTMLButtonElement, SplitButtonProps>(
  ({ size = 'md', isLoading, isDisabled, leftIcon, children, onClick, onDropdownClick }, ref) => {
    return (
      <ButtonGroup isAttached>
        <Button
          ref={ref}
          variant="primary"
          size={size}
          leftIcon={leftIcon}
          isDisabled={isDisabled}
          isLoading={isLoading}
          onClick={onClick}
          borderRightRadius={0}
          spinner={<Spinner size="sm" color="primary.300" />}
        >
          {children}
        </Button>
        <IconButton
          aria-label="More options"
          icon={<ChevronDownIcon />}
          variant="primary"
          size={size}
          isDisabled={isDisabled || isLoading}
          onClick={onDropdownClick}
          borderLeftRadius={0}
          _before={SPLIT_DIVIDER_STYLE}
          position="relative"
          _hover={{
            bg: 'primary.600',
            _disabled: { bg: 'neutral.300' },
          }}
          _active={{
            bg: 'primary.700',
          }}
        />
      </ButtonGroup>
    )
  }
)

SplitButton.displayName = 'SplitButton'
