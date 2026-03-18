import { Box, Flex, Grid, Heading, Icon, Spinner, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { BsCheckLg } from 'react-icons/bs'
import { ROUTES } from '@/shared/constants/routes'
import { useConfigStatusQuery } from '../../services/query/use-state-admin-queries'
import type { ConfigStatusMap, WizardStep } from '../../types/config-status'

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'configuration',
    labelKey: 'overview.setupWizard.configuration',
    route: ROUTES.STATE_ADMIN_CONFIGURATION,
    keys: [
      'TENANT_SUPPORTED_CHANNELS',
      'METER_CHANGE_REASONS',
      'AVERAGE_MEMBERS_PER_HOUSEHOLD',
      'DATA_CONSOLIDATION_TIME',
      'PUMP_OPERATOR_REMINDER_NUDGE_TIME',
      'LOCATION_CHECK_REQUIRED',
      'TENANT_LOGO',
    ],
  },
  {
    id: 'language',
    labelKey: 'overview.setupWizard.language',
    route: ROUTES.STATE_ADMIN_LANGUAGE,
    keys: ['SUPPORTED_LANGUAGES'],
  },
  {
    id: 'waterNorms',
    labelKey: 'overview.setupWizard.waterNorms',
    route: ROUTES.STATE_ADMIN_WATER_NORMS,
    keys: ['WATER_NORM', 'TENANT_WATER_QUANTITY_SUPPLY_THRESHOLD'],
  },
  {
    id: 'integration',
    labelKey: 'overview.setupWizard.integration',
    route: ROUTES.STATE_ADMIN_INTEGRATION,
    keys: ['MESSAGE_BROKER_CONNECTION_SETTINGS'],
  },
  {
    id: 'escalations',
    labelKey: 'overview.setupWizard.escalations',
    route: ROUTES.STATE_ADMIN_ESCALATIONS,
    keys: ['FIELD_STAFF_ESCALATION_RULES'],
  },
]

function isStepConfigured(step: WizardStep, statuses: ConfigStatusMap): boolean {
  return step.keys.every((key) => statuses[key] === 'CONFIGURED')
}

interface StepNodeProps {
  step: WizardStep
  index: number
  configured: boolean
  onClick: () => void
}

function StepNode({ step, index, configured, onClick }: Readonly<StepNodeProps>) {
  const { t } = useTranslation('state-admin')

  return (
    <Flex
      direction="column"
      align="center"
      gap={2}
      cursor="pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick()
        if (e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      aria-label={t(step.labelKey)}
    >
      <Flex
        h="36px"
        w="36px"
        borderRadius="full"
        align="center"
        justify="center"
        bg={configured ? '#079455' : 'neutral.300'}
        flexShrink={0}
      >
        {configured ? (
          <Icon as={BsCheckLg} color="white" boxSize={4} aria-hidden="true" />
        ) : (
          <Text fontSize="sm" fontWeight="semibold" color="white">
            {index + 1}
          </Text>
        )}
      </Flex>
      <Text
        fontSize="sm"
        fontWeight="medium"
        color={configured ? 'neutral.600' : 'neutral.400'}
        textAlign="center"
        whiteSpace="nowrap"
      >
        {t(step.labelKey)}
      </Text>
    </Flex>
  )
}

interface ConnectorProps {
  configured: boolean
}

function Connector({ configured }: Readonly<ConnectorProps>) {
  return (
    <Box
      flex={1}
      h="2px"
      bg={configured ? '#079455' : 'neutral.200'}
      mt="17px"
      alignSelf="flex-start"
    />
  )
}

export function ConfigSetupWizard() {
  const { t } = useTranslation(['state-admin', 'common'])
  const navigate = useNavigate()
  const { data: statuses, isLoading, isError } = useConfigStatusQuery()

  return (
    <Box
      as="section"
      aria-labelledby="setup-wizard-heading"
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
        id="setup-wizard-heading"
        size="h3"
        fontWeight="400"
        mb={6}
        fontSize={{ base: 'md', md: 'xl' }}
      >
        {t('overview.setupWizard.title')}
      </Heading>

      {isLoading && (
        <Flex align="center" gap={3} role="status" aria-live="polite" aria-busy="true">
          <Spinner size="sm" color="primary.500" />
          <Text fontSize="sm" color="neutral.600">
            {t('common:loading')}
          </Text>
        </Flex>
      )}

      {isError && (
        <Text fontSize="sm" color="error.500">
          {t('common:toast.failedToLoad')}
        </Text>
      )}

      {statuses && (
        <>
          {/* Desktop: horizontal row with connectors */}
          <Flex display={{ base: 'none', md: 'flex' }} align="flex-start" gap={0}>
            {WIZARD_STEPS.map((step, i) => {
              const configured = isStepConfigured(step, statuses)
              const isLast = i === WIZARD_STEPS.length - 1
              const prevConfigured = i > 0 ? isStepConfigured(WIZARD_STEPS[i - 1], statuses) : false

              return (
                <Flex key={step.id} align="flex-start" flex={isLast ? 'none' : 1} gap={0}>
                  <StepNode
                    step={step}
                    index={i}
                    configured={configured}
                    onClick={() => navigate(step.route)}
                  />
                  {!isLast && (
                    <Connector configured={(configured && prevConfigured) || configured} />
                  )}
                </Flex>
              )
            })}
          </Flex>

          {/* Mobile: 2-column grid */}
          <Grid display={{ base: 'grid', md: 'none' }} templateColumns="repeat(2, 1fr)" gap={6}>
            {WIZARD_STEPS.map((step, i) => {
              const configured = isStepConfigured(step, statuses)
              return (
                <StepNode
                  key={step.id}
                  step={step}
                  index={i}
                  configured={configured}
                  onClick={() => navigate(step.route)}
                />
              )
            })}
          </Grid>
        </>
      )}
    </Box>
  )
}
