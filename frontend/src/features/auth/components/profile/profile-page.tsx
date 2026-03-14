import { useState, useEffect } from 'react'
import {
  Box,
  Heading,
  Text,
  Flex,
  SimpleGrid,
  IconButton,
  FormControl,
  FormLabel,
  Input,
  Button,
  HStack,
  Skeleton,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import { EditIcon } from '@chakra-ui/icons'
import { useTranslation } from 'react-i18next'
import {
  useMyProfileQuery,
  useUpdateMyProfileMutation,
} from '@/features/auth/services/query/use-auth-queries'
import { useToast } from '@/shared/hooks/use-toast'
import { ToastContainer } from '@/shared/components/common'

interface ProfileFormState {
  firstName: string
  lastName: string
  phoneNumber: string
}

export function ProfilePage() {
  const { t } = useTranslation('common')
  const { data: profile, isLoading, isError } = useMyProfileQuery()
  const updateMutation = useUpdateMyProfileMutation()
  const toast = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<ProfileFormState>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
  })

  useEffect(() => {
    document.title = `${t('profile.title')} | JalSoochak`
  }, [t])

  const handleEdit = () => {
    if (profile) {
      setForm({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber,
      })
    }
    setIsEditing(true)
  }

  const handleCancel = () => {
    if (profile) {
      setForm({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber,
      })
    }
    setIsEditing(false)
  }

  const isFormValid = form.firstName.trim().length > 0

  const hasChanges =
    form.firstName !== (profile?.firstName ?? '') ||
    form.lastName !== (profile?.lastName ?? '') ||
    form.phoneNumber !== (profile?.phoneNumber ?? '')

  const handleSave = () => {
    if (!isFormValid || updateMutation.isPending) return
    updateMutation.mutate(
      {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phoneNumber.trim(),
      },
      {
        onSuccess: () => {
          toast.addToast(t('toast.profileUpdated'), 'success')
          setIsEditing(false)
        },
        onError: (err) => {
          const message = err instanceof Error ? err.message : t('toast.profileUpdateFailed')
          toast.addToast(message, 'error')
        },
      }
    )
  }

  return (
    <Box w="full">
      <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={5}>
        {t('profile.title')}
      </Heading>

      <Box
        bg="white"
        borderWidth="0.5px"
        borderColor="neutral.200"
        borderRadius="12px"
        w="full"
        minH={{ base: 'auto', lg: 'calc(100vh - 180px)' }}
        py={6}
        px={{ base: 3, md: 4 }}
      >
        {isError && (
          <Alert status="error" borderRadius="md" mb={4}>
            <AlertIcon />
            {t('toast.profileLoadFailed')}
          </Alert>
        )}

        <Flex
          direction="column"
          h="full"
          justify="space-between"
          minH={{ base: 'auto', lg: 'calc(100vh - 232px)' }}
        >
          <Box>
            <Flex justify="space-between" align="flex-start" mb={4}>
              <Heading as="h2" size="h3" fontWeight="400" id="profile-details-heading">
                {t('profile.details')}
              </Heading>
              {!isEditing && !isLoading && !isError && (
                <IconButton
                  aria-label={t('profile.editProfile')}
                  icon={<EditIcon boxSize={5} />}
                  variant="ghost"
                  size="sm"
                  color="neutral.600"
                  _hover={{ color: 'primary.500', bg: 'transparent' }}
                  onClick={handleEdit}
                />
              )}
            </Flex>

            {isLoading ? (
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                {[0, 1, 2, 3].map((i) => (
                  <Box key={i}>
                    <Skeleton height="14px" width="80px" mb={2} />
                    <Skeleton height="18px" width="160px" />
                  </Box>
                ))}
              </SimpleGrid>
            ) : isEditing ? (
              <SimpleGrid
                columns={{ base: 1, lg: 2 }}
                spacing={3}
                aria-labelledby="profile-details-heading"
              >
                <FormControl isRequired>
                  <FormLabel textStyle="h10" mb={1}>
                    {t('profile.firstName')}
                  </FormLabel>
                  <Input
                    value={form.firstName}
                    onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                    placeholder={t('enter')}
                    h={9}
                    maxW={{ base: '100%', lg: '486px' }}
                    borderColor="neutral.200"
                    _placeholder={{ color: 'neutral.300' }}
                    aria-required="true"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel textStyle="h10" mb={1}>
                    {t('profile.lastName')}
                  </FormLabel>
                  <Input
                    value={form.lastName}
                    onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                    placeholder={t('enter')}
                    h={9}
                    maxW={{ base: '100%', lg: '486px' }}
                    borderColor="neutral.200"
                    _placeholder={{ color: 'neutral.300' }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel textStyle="h10" mb={1} color="neutral.400">
                    {t('profile.email')}
                  </FormLabel>
                  <Input
                    type="email"
                    value={profile?.email ?? ''}
                    isReadOnly
                    isDisabled
                    bg="neutral.50"
                    color="neutral.400"
                    h={9}
                    maxW={{ base: '100%', lg: '486px' }}
                    borderColor="neutral.200"
                    aria-readonly="true"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel textStyle="h10" mb={1}>
                    {t('profile.phone')}
                  </FormLabel>
                  <Input
                    type="tel"
                    value={form.phoneNumber}
                    onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                    placeholder={t('enter')}
                    h={9}
                    maxW={{ base: '100%', lg: '486px' }}
                    borderColor="neutral.200"
                    _placeholder={{ color: 'neutral.300' }}
                    inputMode="numeric"
                  />
                </FormControl>
              </SimpleGrid>
            ) : (
              <SimpleGrid
                columns={{ base: 1, lg: 2 }}
                spacing={6}
                aria-labelledby="profile-details-heading"
              >
                <Box>
                  <Text textStyle="h10" fontWeight="500" mb={1}>
                    {t('profile.firstName')}
                  </Text>
                  <Text textStyle="h10" fontWeight="400">
                    {profile?.firstName || t('na')}
                  </Text>
                </Box>
                <Box>
                  <Text textStyle="h10" fontWeight="500" mb={1}>
                    {t('profile.lastName')}
                  </Text>
                  <Text textStyle="h10" fontWeight="400">
                    {profile?.lastName || t('na')}
                  </Text>
                </Box>
                <Box>
                  <Text textStyle="h10" fontWeight="500" mb={1}>
                    {t('profile.email')}
                  </Text>
                  <Text textStyle="h10" fontWeight="400">
                    {profile?.email || t('na')}
                  </Text>
                </Box>
                <Box>
                  <Text textStyle="h10" fontWeight="500" mb={1}>
                    {t('profile.phone')}
                  </Text>
                  <Text textStyle="h10" fontWeight="400">
                    {profile?.phoneNumber || t('na')}
                  </Text>
                </Box>
              </SimpleGrid>
            )}
          </Box>

          {isEditing && (
            <HStack
              spacing={3}
              justify={{ base: 'stretch', sm: 'flex-end' }}
              mt={6}
              flexDirection={{ base: 'column-reverse', sm: 'row' }}
            >
              <Button
                variant="secondary"
                size="md"
                width={{ base: 'full', sm: '174px' }}
                onClick={handleCancel}
                isDisabled={updateMutation.isPending}
              >
                {t('button.cancel')}
              </Button>
              <Button
                variant="primary"
                size="md"
                width={{ base: 'full', sm: '174px' }}
                isLoading={updateMutation.isPending}
                isDisabled={!isFormValid || !hasChanges}
                onClick={handleSave}
              >
                {t('button.saveChanges')}
              </Button>
            </HStack>
          )}
        </Flex>
      </Box>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </Box>
  )
}
