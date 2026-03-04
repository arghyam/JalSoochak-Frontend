import { useState } from 'react'
import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
  Box,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { HiOutlineMail } from 'react-icons/hi'
import { ROUTES } from '@/shared/constants/routes'

type ForgotPasswordModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')

  const handleClose = () => {
    setEmail('')
    setEmailError('')
    onClose()
  }

  const handleSendResetLink = () => {
    const trimmedEmail = email.trim()
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)

    if (!trimmedEmail) {
      setEmailError('Email is required.')
      return
    }

    if (!isEmailValid) {
      setEmailError('Enter a valid email address.')
      return
    }

    setEmail('')
    setEmailError('')
    onClose()
    navigate(ROUTES.RESET_PASSWORD)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered>
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent maxW="408px" h="328px" borderRadius="12px" p="24px">
        <ModalBody p="0">
          <Flex direction="column" align="center" gap="20px">
            <Box
              w="48px"
              h="48px"
              borderRadius="full"
              bg="primary.50"
              border="1px solid"
              borderColor="primary.25"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <HiOutlineMail size="24px" color="var(--chakra-colors-primary-500)" />
            </Box>
            <Text textAlign="center" textStyle="bodyText3">
              Please enter your email id associated
              <br />
              with this account
            </Text>
          </Flex>

          <FormControl mt="20px" isInvalid={!!emailError}>
            <FormLabel textStyle="bodyText6" mb="4px">
              Email{' '}
              <Text as="span" color="error.500">
                *
              </Text>
            </FormLabel>
            <Input
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (emailError) {
                  setEmailError('')
                }
              }}
              h="36px"
              px="12px"
              py="8px"
              borderRadius="4px"
              borderColor="neutral.300"
              _placeholder={{ color: 'neutral.300' }}
              fontSize="sm"
              focusBorderColor="primary.500"
            />
            <FormErrorMessage>{emailError}</FormErrorMessage>
          </FormControl>

          <Flex mt={emailError ? '0' : '32px'} gap="20px" justify="space-between">
            <Button variant="secondary" w="full" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              w="full"
              _hover={{ bg: 'primary.600' }}
              onClick={handleSendResetLink}
            >
              Send Reset Link
            </Button>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
