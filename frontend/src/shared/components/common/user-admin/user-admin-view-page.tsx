import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Heading,
  Text,
  Flex,
  SimpleGrid,
  IconButton,
  Spinner,
  Button,
  Link,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { EditIcon } from '@chakra-ui/icons'
import { StatusChip, ToastContainer } from '../index'
import { useToast } from '@/shared/hooks/use-toast'
import type { UserAdminData, UserAdminRoutes, UserAdminViewLabels } from './types'

export interface UserAdminViewPageProps {
  readonly id?: string
  readonly data: UserAdminData | null
  readonly isLoading: boolean
  readonly isError: boolean
  readonly error?: Error | null
  readonly onRefetch: () => void
  readonly routes: UserAdminRoutes
  readonly labels: UserAdminViewLabels
}

export function UserAdminViewPage({
  id,
  data,
  isLoading,
  isError,
  error,
  onRefetch,
  routes,
  labels,
}: UserAdminViewPageProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  useEffect(() => {
    const state = location.state as { successToast?: string } | null
    if (state?.successToast) {
      toast.addToast(state.successToast, 'success')
      // Clear the state so a refresh doesn't re-show the toast
      navigate(location.pathname, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={5}>
          {labels.pageTitle}
        </Heading>
        <Flex role="status" aria-live="polite" align="center" minH="200px" gap={3}>
          <Spinner size="md" color="primary.500" />
          <Text color="neutral.600">{t('loading')}</Text>
        </Flex>
      </Box>
    )
  }

  if (isError) {
    const errorMessage = error instanceof Error ? error.message : t('toast.failedToLoad')
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={5}>
          {labels.pageTitle}
        </Heading>
        <Flex direction="column" align="flex-start" mt={4} gap={3}>
          <Text color="red.500">{errorMessage}</Text>
          <Button size="sm" variant="outline" onClick={onRefetch}>
            {t('retry')}
          </Button>
        </Flex>
      </Box>
    )
  }

  if (data === null) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={5}>
          {labels.pageTitle}
        </Heading>
        <Text color="neutral.600" mt={4}>
          {labels.messages.notFound}
        </Text>
      </Box>
    )
  }

  const handleEdit = () => {
    if (id) navigate(routes.edit(id))
  }

  return (
    <Box w="full">
      {/* Page Header with Breadcrumb */}
      <Box mb={5}>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={2}>
          {labels.pageTitle}
        </Heading>
        <Flex as="nav" aria-label="Breadcrumb" gap={2} flexWrap="wrap">
          <Link
            fontSize="14px"
            lineHeight="21px"
            color="neutral.500"
            _hover={{ textDecoration: 'underline' }}
            onClick={() => navigate(routes.list)}
          >
            {labels.breadcrumb.manage}
          </Link>
          <Text fontSize="14px" lineHeight="21px" color="neutral.500" aria-hidden="true">
            /
          </Text>
          <Text fontSize="14px" lineHeight="21px" color="#26272B" aria-current="page">
            {labels.breadcrumb.view}
          </Text>
        </Flex>
      </Box>

      {/* Details Card */}
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
        {/* User Details Section */}
        <Flex justify="space-between" align="flex-start" mb={4}>
          <Heading as="h2" size="h3" fontWeight="400" id="user-details-heading">
            {labels.form.userDetails}
          </Heading>
          <IconButton
            aria-label={`${labels.aria.edit} ${data.firstName} ${data.lastName}`}
            icon={<EditIcon boxSize={5} />}
            variant="ghost"
            size="sm"
            color="neutral.600"
            _hover={{ color: 'primary.500', bg: 'transparent' }}
            onClick={handleEdit}
            isDisabled={!id}
          />
        </Flex>

        <SimpleGrid
          columns={{ base: 1, lg: 2 }}
          spacing={6}
          mb={7}
          aria-labelledby="user-details-heading"
        >
          <Box>
            <Text textStyle="h10" fontWeight="500" mb={1}>
              {labels.form.firstName}
            </Text>
            <Text textStyle="h10" fontWeight="400">
              {data.firstName}
            </Text>
          </Box>
          <Box>
            <Text textStyle="h10" fontWeight="500" mb={1}>
              {labels.form.lastName}
            </Text>
            <Text textStyle="h10" fontWeight="400">
              {data.lastName}
            </Text>
          </Box>
          <Box>
            <Text textStyle="h10" fontWeight="500" mb={1}>
              {labels.form.emailAddress}
            </Text>
            <Text textStyle="h10" fontWeight="400">
              {data.email}
            </Text>
          </Box>
          <Box>
            <Text textStyle="h10" fontWeight="500" mb={1}>
              {labels.form.phoneNumber}
            </Text>
            <Text textStyle="h10" fontWeight="400">
              +91 {data.phone.replace(/(\d{5})(\d{5})/, '$1-$2')}
            </Text>
          </Box>
        </SimpleGrid>

        {/* Status Section */}
        <Heading as="h2" size="h3" fontWeight="400" mb={4} id="status-heading">
          {labels.form.statusSection}
        </Heading>
        <StatusChip
          status={data.status}
          label={data.status === 'active' ? t('status.active') : t('status.inactive')}
        />
      </Box>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </Box>
  )
}
