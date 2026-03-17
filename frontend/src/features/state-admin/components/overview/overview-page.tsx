import { useEffect } from 'react'
import { Box, Flex, SimpleGrid, Stack, Heading, Spinner, Text } from '@chakra-ui/react'

import { useTranslation } from 'react-i18next'
import i18n from '@/app/i18n'
import { useAuthStore } from '@/app/store'
import { INDIA_STATES } from '@/shared/constants/states'
import { StatCard } from '@/shared/components/common'
import {
  useStaffCountsQuery,
  useStateAdminOverviewQuery,
} from '../../services/query/use-state-admin-queries'
import { BsDroplet, BsPerson } from 'react-icons/bs'
import { ConfigSetupWizard } from './config-setup-wizard'

export function OverviewPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const user = useAuthStore((state) => state.user)
  const { data, isLoading, isError } = useStateAdminOverviewQuery()
  const {
    data: staffCountsData,
    isLoading: isStaffCountsLoading,
    isError: isStaffCountsError,
  } = useStaffCountsQuery()

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

  if (isLoading || isStaffCountsLoading) {
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

  if (isError || isStaffCountsError) {
    return (
      <Flex h="64" align="center" justify="center">
        <Text color="error.500">{t('common:toast.failedToLoad')}</Text>
      </Flex>
    )
  }

  if (!data) {
    return null
  }

  const formatStatValue = (value: string | number): string =>
    typeof value === 'number' ? value.toLocaleString(i18n.language) : value

  const statsCards = [
    {
      title: t('overview.stats.totalStaff'),
      value: formatStatValue(staffCountsData?.totalStaff ?? 0),
      icon: BsPerson,
      iconBg: '#F1EEFF',
      iconColor: '#584C93',
    },
    {
      title: t('overview.stats.pumpOperators'),
      value: formatStatValue(staffCountsData?.pumpOperators ?? 0),
      icon: BsPerson,
      iconBg: '#E1FFEA',
      iconColor: '#079455',
    },
    {
      title: t('overview.stats.totalAdmins'),
      value: formatStatValue(staffCountsData?.totalAdmins ?? 0),
      icon: BsPerson,
      iconBg: '#FBEAFF',
      iconColor: '#DC72F2',
    },
    {
      title: t('overview.stats.activeSchemes'),
      value: formatStatValue(data.stats.activeSchemes.value),
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
