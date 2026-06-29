import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  SimpleGrid,
  Stack,
  Heading,
  Spinner,
  Text,
} from '@chakra-ui/react'

import { useTranslation } from 'react-i18next'
import i18n from '@/app/i18n'
import { useAuthStore } from '@/app/store'
import { INDIA_STATES } from '@/shared/constants/states'
import { StatCard, PageHeader } from '@/shared/components/common'
import { ToastContainer } from '@/shared/components/common/toast-container'
import { useToast } from '@/shared/hooks/use-toast'
import {
  useSchemeCountsQuery,
  useStaffCountsQuery,
  useGenerateApiTokenMutation,
} from '../../services/query/use-state-admin-queries'
import { BsDroplet, BsEye, BsEyeSlash, BsClipboard } from 'react-icons/bs'
import { TotalStaffIcon, PumpOperatorIcon, TotalAdminsIcon } from './overview-icons'
import { ConfigSetupWizard } from './config-setup-wizard'

export function OverviewPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const user = useAuthStore((state) => state.user)
  const tenantCode = user?.tenantCode ?? ''
  const toast = useToast()
  const {
    data: staffCountsData,
    isLoading: isStaffCountsLoading,
    isError: isStaffCountsError,
  } = useStaffCountsQuery()
  const {
    data: schemeCountsData,
    isLoading: isSchemeCountsLoading,
    isError: isSchemeCountsError,
  } = useSchemeCountsQuery(tenantCode)
  const generateTokenMutation = useGenerateApiTokenMutation()
  const [generatedToken, setGeneratedToken] = useState<string | null>(null)
  const [isTokenVisible, setIsTokenVisible] = useState(false)

  const handleGenerateToken = () => {
    generateTokenMutation.mutate(undefined, {
      onSuccess: (token) => {
        setGeneratedToken(token)
        setIsTokenVisible(false)
        toast.success(t('overview.generateToken.generated'))
      },
      onError: () => {
        toast.error(t('overview.generateToken.error'))
      },
    })
  }

  const handleCopyToken = () => {
    if (!generatedToken) return
    if (!globalThis.isSecureContext || !navigator.clipboard) {
      toast.error(t('overview.generateToken.clipboardError'))
      return
    }
    navigator.clipboard
      .writeText(generatedToken)
      .then(() => {
        toast.success(t('overview.generateToken.copied'))
      })
      .catch(() => {
        toast.error(t('overview.generateToken.clipboardError'))
      })
  }

  const stateName =
    INDIA_STATES.find((s) => s.code === user?.tenantCode?.toUpperCase())?.name ??
    user?.tenantCode ??
    null

  useEffect(() => {
    const pageTitle = stateName
      ? t('overview.title', { state: stateName })
      : t('overview.titleFallback')
    document.title = `${pageTitle} | JalSoochak`
  }, [t, stateName])

  if (isStaffCountsLoading || isSchemeCountsLoading) {
    return (
      <Flex
        h="64"
        align="center"
        justify="center"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <Spinner size="lg" color="primary.500" mr={3} />
        <Text color="neutral.600">{t('common:loading')}</Text>
      </Flex>
    )
  }

  if (isStaffCountsError || isSchemeCountsError) {
    return (
      <Flex h="64" align="center" justify="center">
        <Text color="error.500">{t('common:toast.failedToLoad')}</Text>
      </Flex>
    )
  }

  const formatStatValue = (value: string | number): string =>
    typeof value === 'number' ? value.toLocaleString(i18n.language) : value

  const statsCards = [
    {
      title: t('overview.stats.totalStaff'),
      value: formatStatValue(staffCountsData?.totalStaff ?? 0),
      icon: TotalStaffIcon,
      iconBg: '#EBF4FA',
      iconColor: '#3291D1',
      tooltip: t('overview.tooltips.totalStaff'),
    },
    {
      title: t('overview.stats.pumpOperators'),
      value: formatStatValue(staffCountsData?.pumpOperators ?? 0),
      icon: PumpOperatorIcon,
      iconBg: '#F1EEFF',
      iconColor: '#584C93',
    },
    {
      title: t('overview.stats.totalAdmins'),
      value: formatStatValue(staffCountsData?.totalAdmins ?? 0),
      icon: TotalAdminsIcon,
      iconBg: '#FBEAFF',
      iconColor: '#DC72F2',
      tooltip: t('overview.tooltips.totalAdmins'),
    },
    {
      title: t('overview.stats.activeSchemes'),
      value: formatStatValue(schemeCountsData?.activeSchemes ?? 0),
      icon: BsDroplet,
      iconBg: '#EBF4FA',
      iconColor: '#3291D1',
      tooltip: t('overview.tooltips.activeSchemes'),
    },
  ]

  return (
    <Box w="full">
      <PageHeader>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
          {stateName ? t('overview.title', { state: stateName }) : t('overview.titleFallback')}
        </Heading>
      </PageHeader>

      <Stack gap={{ base: 4, md: 6 }}>
        {/* Stats Cards */}
        <SimpleGrid
          as="section"
          aria-label={t('overview.aria.statsSection')}
          columns={{ base: 1, sm: 2, md: 2, lg: 4 }}
          spacing={{ base: 4, md: 7 }}
        >
          {statsCards.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              // height="172px"
              icon={stat.icon}
              iconBg={stat.iconBg}
              iconColor={stat.iconColor}
              tooltip={stat.tooltip}
            />
          ))}
        </SimpleGrid>

        {/* Configuration Setup Wizard */}
        <ConfigSetupWizard />

        {/* API Token Section */}
        <Box
          as="section"
          aria-labelledby="api-token-heading"
          bg="white"
          borderWidth="1px"
          borderColor="neutral.100"
          borderRadius="xl"
          boxShadow="default"
          py={{ base: 4, md: 6 }}
          px={{ base: 4, md: 6 }}
        >
          <Heading
            as="h2"
            id="api-token-heading"
            size="h3"
            fontWeight="400"
            mb={1}
            fontSize={{ base: 'md', md: 'xl' }}
          >
            {t('overview.generateToken.sectionTitle')}
          </Heading>
          <Text fontSize="sm" color="neutral.500" mb={4}>
            {t('overview.generateToken.sectionHint')}
          </Text>
          <HStack gap={3} align="center" flexWrap={{ base: 'wrap', md: 'nowrap' }}>
            <Button
              size="sm"
              variant="outline"
              colorScheme="primary"
              isLoading={generateTokenMutation.isPending}
              onClick={handleGenerateToken}
              aria-label={t('overview.generateToken.ariaLabel')}
              flexShrink={0}
            >
              {t('overview.generateToken.buttonLabel')}
            </Button>
            {generatedToken && (
              <HStack gap={2} flex={1} minW="0">
                <Input
                  value={generatedToken}
                  type={isTokenVisible ? 'text' : 'password'}
                  isReadOnly
                  fontFamily="mono"
                  fontSize="sm"
                  flex={1}
                  minW="0"
                  bg="neutral.50"
                  aria-label={t('overview.generateToken.tokenInputLabel')}
                />
                <IconButton
                  aria-label={
                    isTokenVisible
                      ? t('overview.generateToken.hideToken')
                      : t('overview.generateToken.showToken')
                  }
                  icon={<Icon as={isTokenVisible ? BsEyeSlash : BsEye} />}
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsTokenVisible((v) => !v)}
                />
                <IconButton
                  aria-label={t('overview.generateToken.copyToken')}
                  icon={<Icon as={BsClipboard} />}
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyToken}
                />
              </HStack>
            )}
          </HStack>
        </Box>
      </Stack>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </Box>
  )
}
