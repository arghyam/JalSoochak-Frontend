import { useEffect } from 'react'
import { Box, Flex, SimpleGrid, Stack, Heading, Spinner, Text } from '@chakra-ui/react'

import { useTranslation } from 'react-i18next'
import i18n from '@/app/i18n'
import { useAuthStore } from '@/app/store'
import { INDIA_STATES } from '@/shared/constants/states'
import { StatCard } from '@/shared/components/common'
import {
  useSchemeCountsQuery,
  useStaffCountsQuery,
} from '../../services/query/use-state-admin-queries'
import { BsDroplet } from 'react-icons/bs'
import { TotalStaffIcon, PumpOperatorIcon, TotalAdminsIcon } from './overview-icons'
import { ConfigSetupWizard } from './config-setup-wizard'

export function OverviewPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const user = useAuthStore((state) => state.user)
  const tenantCode = user?.tenantCode ?? ''
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
    },
    {
      title: t('overview.stats.activeSchemes'),
      value: formatStatValue(schemeCountsData?.activeSchemes ?? 0),
      icon: BsDroplet,
      iconBg: '#EBF4FA',
      iconColor: '#3291D1',
    },
  ]

  return (
    <Box w="full">
      {/* Page Header */}
      <Box mb={5}>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
          {stateName ? t('overview.title', { state: stateName }) : t('overview.titleFallback')}
        </Heading>
      </Box>

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
            />
          ))}
        </SimpleGrid>

        {/* Configuration Setup Wizard */}
        <ConfigSetupWizard />
      </Stack>
    </Box>
  )
}
