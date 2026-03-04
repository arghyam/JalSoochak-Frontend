import { type ChangeEvent, type ReactNode, forwardRef, useState } from 'react'
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Text,
  type InputProps,
  type ResponsiveValue,
} from '@chakra-ui/react'
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'

export interface FormInputProps {
  label: string
  value: string | number
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
  placeholder?: string
  name?: string

  isRequired?: boolean
  isInvalid?: boolean
  errorMessage?: string

  isDisabled?: boolean
  isReadOnly?: boolean

  labelTextStyle?: string
  maxW?: ResponsiveValue<string>

  leftElement?: ReactNode
  rightElement?: ReactNode

  inputProps?: Omit<InputProps, 'value' | 'onChange' | 'type'>
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      value,
      onChange,
      type = 'text',
      placeholder,
      name,
      isRequired,
      isInvalid,
      errorMessage,
      isDisabled,
      isReadOnly,
      labelTextStyle = 'h10',
      maxW,
      leftElement,
      rightElement,
      inputProps,
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)

    const isPassword = type === 'password'
    const needsGroup = !!leftElement || !!rightElement || isPassword

    const disabledStyles =
      isDisabled || isReadOnly
        ? {
            bg: 'neutral.50',
            borderColor: 'neutral.200',
            color: 'neutral.400',
          }
        : {}

    const resolvedType = isPassword && showPassword ? 'text' : type

    const passwordToggle = isPassword && !rightElement && (
      <InputRightElement h="36px">
        <Button
          variant="unstyled"
          size="sm"
          color="neutral.400"
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          _hover={{ bg: 'transparent' }}
          _active={{ bg: 'transparent' }}
        >
          {showPassword ? <AiOutlineEye size="16px" /> : <AiOutlineEyeInvisible size="16px" />}
        </Button>
      </InputRightElement>
    )

    const inputElement = (
      <Input
        ref={ref}
        type={resolvedType}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        h="36px"
        px="12px"
        py="8px"
        borderRadius="4px"
        borderColor="neutral.300"
        _placeholder={{ color: 'neutral.300' }}
        fontSize="sm"
        focusBorderColor="primary.500"
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
        maxW={maxW}
        {...disabledStyles}
        {...(isReadOnly ? { 'aria-readonly': 'true' as const } : {})}
        {...(isRequired ? { 'aria-required': 'true' as const } : {})}
        {...(isPassword ? { pr: '36px' } : {})}
        {...inputProps}
      />
    )

    return (
      <FormControl isInvalid={isInvalid} isRequired={isRequired}>
        <FormLabel requiredIndicator={<></>}>
          <Text textStyle={labelTextStyle} mb="4px">
            {label}
            {isRequired && (
              <Text as="span" color="error.500">
                {' '}
                *
              </Text>
            )}
          </Text>
        </FormLabel>

        {needsGroup ? (
          <InputGroup>
            {leftElement && <InputLeftElement h="36px">{leftElement}</InputLeftElement>}
            {inputElement}
            {rightElement ? (
              <InputRightElement h="36px">{rightElement}</InputRightElement>
            ) : (
              passwordToggle
            )}
          </InputGroup>
        ) : (
          inputElement
        )}

        {errorMessage && <FormErrorMessage>{errorMessage}</FormErrorMessage>}
      </FormControl>
    )
  }
)

FormInput.displayName = 'FormInput'
