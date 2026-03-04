import { useEffect } from 'react'
import { Box, Flex, SimpleGrid, Stack, Heading, Spinner, Text } from '@chakra-ui/react'

import { useTranslation } from 'react-i18next'
import i18n from '@/app/i18n'
import { useAuthStore } from '@/app/store'
import { LineChart } from '@/shared/components/charts/line-chart'
import { StatCard } from '@/shared/components/common'
import { WaterSupplyOutagesChart } from '@/shared/components/charts/water-supply-outages-chart'
import { useStateAdminOverviewQuery } from '../../services/query/use-state-admin-queries'
import { BsCheck2Circle, BsDroplet, BsPerson } from 'react-icons/bs'
import { BiMessageDetail } from 'react-icons/bi'

export function OverviewPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const user = useAuthStore((state) => state.user)
  const { data, isLoading, isError } = useStateAdminOverviewQuery()

  useEffect(() => {
    const pageTitle = user?.tenantId
      ? t('overview.title', { state: user.tenantId })
      : t('overview.titleFallback')
    document.title = `${pageTitle} | JalSoochak`
  }, [t, user?.tenantId])

  if (isLoading) {
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

  if (isError) {
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
      title: t('overview.stats.configurationStatus'),
      value: formatStatValue(data.stats.configurationStatus.value),
      subtitle: data.stats.configurationStatus.subtitle,
      icon: BsCheck2Circle,
      iconBg: '#E1FFEA',
      iconColor: '#079455',
    },
    {
      title: t('overview.stats.activeStaff'),
      value: formatStatValue(data.stats.activeStaff.value),
      subtitle: data.stats.activeStaff.subtitle,
      icon: BsPerson,
      iconBg: '#F1EEFF',
      iconColor: '#584C93',
    },
    {
      title: t('overview.stats.activeSchemes'),
      value: formatStatValue(data.stats.activeSchemes.value),
      subtitle: data.stats.activeSchemes.subtitle,
      icon: BsDroplet,
      iconBg: '#EBF4FA',
      iconColor: '#3291D1',
    },
    {
      title: t('overview.stats.activeIntegrations'),
      value: formatStatValue(data.stats.activeIntegrations.value),
      subtitle: data.stats.activeIntegrations.subtitle,
      icon: BiMessageDetail,
      iconBg: '#FBEAFF',
      iconColor: '#DC72F2',
    },
  ]

  return (
    <Box w="full">
      {/* Page Header */}
      <Box mb={5}>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
          {user?.tenantId
            ? t('overview.title', { state: user.tenantId })
            : t('overview.titleFallback')}
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
              subtitle={stat.subtitle}
              icon={stat.icon}
              iconBg={stat.iconBg}
              iconColor={stat.iconColor}
            />
          ))}
        </SimpleGrid>

        {/* Water Supply Outages Chart */}
        <Box
          as="section"
          aria-labelledby="water-supply-outages-heading"
          bg="white"
          borderWidth="1px"
          borderColor="neutral.100"
          borderRadius={{ base: 'lg', md: 'xl' }}
          boxShadow="default"
          py={{ base: 4, md: 6 }}
          px={4}
          display="flex"
          flexDirection="column"
          minH="380px"
        >
          <Heading
            as="h2"
            id="water-supply-outages-heading"
            size="h3"
            fontWeight="400"
            mb={4}
            fontSize={{ base: 'md', md: 'xl' }}
          >
            {t('overview.charts.waterSupplyOutages')}
          </Heading>
          <Box flex={1}>
            <WaterSupplyOutagesChart
              data={data.waterSupplyOutages}
              height={300}
              xAxisLabel={t('overview.charts.Districts')}
            />
          </Box>
        </Box>

        {/* Demand vs Supply Chart */}
        <Box
          as="section"
          aria-labelledby="demand-supply-chart-heading"
          bg="white"
          borderWidth="1px"
          borderColor="neutral.100"
          borderRadius={{ base: 'lg', md: 'xl' }}
          boxShadow="default"
          height={{ base: 'auto', md: '534px' }}
          py={{ base: 4, md: 6 }}
          px={4}
        >
          <Heading
            as="h2"
            id="demand-supply-chart-heading"
            size="h3"
            fontWeight="400"
            mb={4}
            fontSize={{ base: 'md', md: 'xl' }}
          >
            {t('overview.charts.demandVsSupply')}
          </Heading>
          <LineChart
            data={data.demandSupplyData}
            xKey="period"
            yKeys={['Demand', 'Supply']}
            colors={['#3291D1', '#ADD3EB']}
            height="416px"
            xAxisLabel={t('overview.charts.Year')}
            legendLabels={[t('overview.charts.Demand'), t('overview.charts.Supply')]}
            yAxisLabel={t('overview.charts.Quantity')}
          />
        </Box>
      </Stack>
    </Box>
  )
}
