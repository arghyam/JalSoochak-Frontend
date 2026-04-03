import { useEffect } from 'react'
import { Box, Flex, SimpleGrid, Text, Stack, Heading, Spinner } from '@chakra-ui/react'

import { useTranslation } from 'react-i18next'
import { MdOutlinePlace } from 'react-icons/md'
import { BsCheck2Circle } from 'react-icons/bs'
import { IoCloseCircleOutline } from 'react-icons/io5'
import { useTenantsSummaryQuery } from '../../services/query/use-super-admin-queries'
import { StatCard, PageHeader } from '@/shared/components/common'

export function OverviewPage() {
  const { t } = useTranslation(['super-admin', 'common'])
  const { data: summaryData, isLoading, isError } = useTenantsSummaryQuery()

  useEffect(() => {
    document.title = `${t('overview.title')} | JalSoochak`
  }, [t])

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

  if (!summaryData) {
    return (
      <Flex h="64" align="center" justify="center">
        <Text color="error.500">{t('common:toast.failedToLoad')}</Text>
      </Flex>
    )
  }

  const statsCards = [
    {
      title: t('overview.stats.totalStatesManaged'),
      value: summaryData.totalStatesManaged,
      icon: MdOutlinePlace,
      iconBg: '#EBF4FA',
      iconColor: '#3291D1',
    },
    {
      title: t('overview.stats.activeStates'),
      value: summaryData.activeStates,
      icon: BsCheck2Circle,
      iconBg: '#E1FFEA',
      iconColor: '#079455',
    },
    {
      title: t('overview.stats.inactiveStates'),
      value: summaryData.inactiveStates,
      icon: IoCloseCircleOutline,
      iconBg: '#FFFBD7',
      iconColor: '#CA8A04',
    },
  ]

  return (
    <Box w="full">
      <PageHeader>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
          {t('overview.title')}
        </Heading>
      </PageHeader>

      <Stack gap={{ base: 4, md: 6 }}>
        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={{ base: 4, md: 7 }}>
          {statsCards.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              iconBg={stat.iconBg}
              iconColor={stat.iconColor}
            />
          ))}
        </SimpleGrid>
      </Stack>
    </Box>
  )
}
