import { useState } from 'react'
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Text,
} from '@chakra-ui/react'
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'

type SignupPageProps = {
  onSuccess: (email: string) => void
}

export function SignupPage({ onSuccess }: SignupPageProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  // Temporary hardcoded credentials until signup API is available.
  const HARD_CODED_USER = {
    userId: 'demo.user',
    password: '1234567',
  }

  const handleSignup = () => {
    setAuthError('')

    const isMatch =
      userId.trim() === HARD_CODED_USER.userId && password === HARD_CODED_USER.password

    if (!isMatch) {
      setAuthError('User ID or password is incorrect.')
      return
    }

    setIsSubmitting(true)
    onSuccess(email.trim())
  }

  return (
    <>
      <Text textStyle="h5" fontWeight="600" mb="0.25rem">
        Welcome
      </Text>
      <Text textStyle="bodyText5" fontWeight="400" mb="1.25rem">
        Please enter your details.
      </Text>

      <FormControl>
        <FormLabel>
          <Text textStyle="bodyText6" mb="4px">
            User ID
            <Text as="span" color="error.500">
              *
            </Text>
          </Text>
        </FormLabel>
        <Input
          placeholder="Enter your user ID"
          autoComplete="off"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          h="36px"
          px="12px"
          py="8px"
          borderRadius="4px"
          borderColor="neutral.300"
          _placeholder={{ color: 'neutral.300' }}
          fontSize="sm"
          focusBorderColor="primary.500"
        />
      </FormControl>

      <FormControl mt="1rem" isInvalid={!isEmailValid && !!email}>
        <FormLabel>
          <Text textStyle="bodyText6" mb="4px">
            Email address
            <Text as="span" color="error.500">
              *
            </Text>
          </Text>
        </FormLabel>
        <Input
          type="email"
          placeholder="Enter your email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          h="36px"
          px="12px"
          py="8px"
          borderRadius="4px"
          borderColor="neutral.300"
          _placeholder={{ color: 'neutral.300' }}
          fontSize="sm"
          focusBorderColor="primary.500"
        />
        <FormErrorMessage>Enter a valid email address.</FormErrorMessage>
      </FormControl>

      <FormControl mt="1rem">
        <FormLabel>
          <Text textStyle="bodyText6" mb="4px">
            Password sent via email
            <Text as="span" color="error.500">
              *
            </Text>
          </Text>
        </FormLabel>
        <InputGroup>
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            h="36px"
            px="12px"
            py="8px"
            borderRadius="4px"
            borderColor="neutral.300"
            fontSize="sm"
            _placeholder={{ color: 'neutral.300' }}
            focusBorderColor="primary.500"
            pr="36px"
          />
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
        </InputGroup>
      </FormControl>

      <FormControl mt="1rem" isInvalid={!!authError}>
        <FormErrorMessage>{authError}</FormErrorMessage>
      </FormControl>

      <Button
        w="full"
        mt="1.25rem"
        fontSize="16px"
        fontWeight="600"
        isDisabled={!userId || !email || !isEmailValid || !password || isSubmitting}
        isLoading={isSubmitting}
        loadingText="Signing up..."
        _loading={{ bg: 'primary.500', color: 'white' }}
        onClick={handleSignup}
      >
        Sign up
      </Button>
    </>
  )
}
