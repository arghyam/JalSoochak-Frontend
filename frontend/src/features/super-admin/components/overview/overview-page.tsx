import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Flex,
  SimpleGrid,
  Text,
  Icon,
  Stack,
  Button,
  Heading,
  Spinner,
  Menu,
  MenuButton,
  MenuList,
} from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { useTranslation } from 'react-i18next'
import { MdOutlinePlace } from 'react-icons/md'
import { BsCheck2Circle } from 'react-icons/bs'
import { IoCloseCircleOutline, IoAddOutline } from 'react-icons/io5'
import { ROUTES } from '@/shared/constants/routes'
import { useSuperAdminOverviewQuery } from '../../services/query/use-super-admin-queries'
import { WaterSupplyOutagesChart } from '@/shared/components/charts/water-supply-outages-chart'

export function OverviewPage() {
  const { t } = useTranslation(['super-admin', 'common'])
  const navigate = useNavigate()
  const { data, isLoading, isError } = useSuperAdminOverviewQuery()

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

  if (!data) return null

  const statsCards = [
    {
      title: t('overview.stats.totalStatesManaged'),
      value: data.stats.totalStatesManaged,
      icon: MdOutlinePlace,
      iconBg: '#EBF4FA',
      iconColor: '#3291D1',
    },
    {
      title: t('overview.stats.activeStates'),
      value: data.stats.activeStates,
      icon: BsCheck2Circle,
      iconBg: '#E1FFEA',
      iconColor: '#079455',
    },
    {
      title: t('overview.stats.inactiveStates'),
      value: data.stats.inactiveStates,
      icon: IoCloseCircleOutline,
      iconBg: '#FFFBD7',
      iconColor: '#CA8A04',
    },
  ]

  return (
    <Box w="full">
      {/* Page Header with Add Button */}
      <Flex
        direction={{ base: 'column', sm: 'row' }}
        justify="space-between"
        align={{ base: 'flex-start', sm: 'center' }}
        gap={{ base: 3, sm: 0 }}
        mb={5}
        minH={12}
      >
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
          {t('overview.title')}
        </Heading>

        <Button
          variant="secondary"
          size={{ base: 'md', lg: 'sm' }}
          fontWeight="600"
          onClick={() => navigate(ROUTES.SUPER_ADMIN_STATES_UTS_ADD)}
          w={{ base: 'full', sm: 'auto' }}
          gap={1}
        >
          {<IoAddOutline size={24} />} {t('overview.addNewStateUt')}
        </Button>
      </Flex>

      <Stack gap={{ base: 4, md: 6 }}>
        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={{ base: 4, md: 7 }}>
          {statsCards.map((stat) => {
            const StatIcon = stat.icon
            return (
              <Box
                key={stat.title}
                bg="white"
                borderWidth="0.5px"
                borderColor="neutral.200"
                borderRadius="12px"
                boxShadow="default"
                height={{ base: 'auto', md: '172px' }}
                px={4}
                py={{ base: 4, md: 6 }}
              >
                <Flex direction="column" gap={3}>
                  <Flex
                    h="40px"
                    w="40px"
                    align="center"
                    justify="center"
                    borderRadius="full"
                    bg={stat.iconBg}
                    aria-hidden="true"
                  >
                    <Icon as={StatIcon} boxSize={5} color={stat.iconColor} />
                  </Flex>
                  <Flex direction="column" gap={1}>
                    <Text color="neutral.600" fontSize={{ base: 'sm', md: 'md' }}>
                      {stat.title}
                    </Text>
                    <Text
                      textStyle="h9"
                      fontSize={{ base: 'xl', md: '2xl' }}
                      aria-label={`${stat.title}: ${stat.value}`}
                    >
                      {stat.value}
                    </Text>
                  </Flex>
                </Flex>
              </Box>
            )
          })}
        </SimpleGrid>

        {/* Water Supply Outages Chart */}
        <Box
          as="section"
          aria-labelledby="water-supply-outages-heading"
          bg="white"
          borderWidth="0.5px"
          borderColor="neutral.200"
          borderRadius={{ base: '12px', md: '16px' }}
          boxShadow="default"
          py={{ base: 4, md: 6 }}
          px={4}
          display="flex"
          flexDirection="column"
          minH="380px"
        >
          <Flex justify="space-between" align="center" mb={4} flexShrink={0}>
            <Heading
              as="h2"
              id="water-supply-outages-heading"
              size="h3"
              fontWeight="400"
              fontSize={{ base: 'md', md: 'xl' }}
            >
              {t('overview.charts.waterSupplyOutages')}
            </Heading>
            <Menu>
              <MenuButton
                as={Button}
                aria-label={t('overview.charts.select')}
                h="32px"
                minW={{ base: 'full', sm: '120px' }}
                px="12px"
                fontSize="14px"
                fontWeight="600"
                borderRadius="4px"
                borderColor="neutral.300"
                borderWidth="1px"
                bg="white"
                color="neutral.600"
                variant="outline"
                rightIcon={<ChevronDownIcon w={5} h={5} aria-hidden="true" />}
                _hover={{ bg: 'neutral.50' }}
                _active={{ bg: 'neutral.100' }}
                _focusVisible={{ boxShadow: 'outline' }}
                sx={{
                  '& svg': {
                    color: 'neutral.600',
                  },
                }}
              >
                {t('overview.charts.select')}
              </MenuButton>
              <MenuList p={0} minW="162px" borderRadius="4px" borderColor="neutral.200" />
            </Menu>
          </Flex>
          <Box flex={1}>
            <WaterSupplyOutagesChart data={data.waterSupplyOutages} height={420} />
          </Box>
        </Box>
      </Stack>
    </Box>
  )
}
