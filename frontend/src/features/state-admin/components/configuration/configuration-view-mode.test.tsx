import { screen } from '@testing-library/react'
import { describe, expect, it } from '@jest/globals'
import { useTranslation } from 'react-i18next'
import { ViewMode, FieldInfoIcon } from './configuration-view-mode'
import { renderWithProviders } from '@/test/render-with-providers'
import type { ConfigurationData } from '../../types/configuration'

const baseConfig: ConfigurationData = {
  id: 'cfg-1',
  supportedChannels: ['BFM', 'ELM'],
  meterChangeReasons: [
    { id: 'r1', name: 'Meter Replaced' },
    { id: 'r2', name: 'Meter Not Working' },
  ],
  supplyOutageReasons: [{ id: 'o1', name: 'Pump Failure', isDefault: true, editable: true }],
  locationCheckRequired: true,
  displayMapLgdLevels: [true, false],
  displayDepartmentMapLevels: [true, true],
  dataConsolidationTime: '20:00',
  pumpOperatorReminderNudgeTime: '08:00',
  dateFormatScreen: { dateFormat: 'DD/MM/YYYY', timeFormat: null, timezone: null },
  dateFormatTable: { dateFormat: 'MM/DD/YYYY', timeFormat: null, timezone: null },
  averageMembersPerHousehold: 5,
  isConfigured: true,
}

function ViewModeWrapper(props: Omit<React.ComponentProps<typeof ViewMode>, 't'>) {
  const { t } = useTranslation(['state-admin', 'common'])
  return <ViewMode {...props} t={t} />
}

const defaultProps = {
  config: baseConfig,
  logoUrl: undefined as string | undefined,
  isLogoLoading: false,
  isLogoError: false,
  notFound: false,
  lgdLevelCount: 2,
  deptLevelCount: 2,
}

describe('ViewMode', () => {
  it('renders supported channel names as a comma-separated list', () => {
    renderWithProviders(<ViewModeWrapper {...defaultProps} />)
    expect(screen.getByText('Bulk Flow Meter, Electric Meter')).toBeTruthy()
  })

  it('renders meter change reasons', () => {
    renderWithProviders(<ViewModeWrapper {...defaultProps} />)
    expect(screen.getByText('Meter Replaced')).toBeTruthy()
    expect(screen.getByText('Meter Not Working')).toBeTruthy()
  })

  it('renders supply outage reasons', () => {
    renderWithProviders(<ViewModeWrapper {...defaultProps} />)
    expect(screen.getByText('Pump Failure')).toBeTruthy()
  })

  it('shows "-" when supported channels list is empty', () => {
    renderWithProviders(
      <ViewModeWrapper {...defaultProps} config={{ ...baseConfig, supportedChannels: [] }} />
    )
    const dashes = screen.getAllByText('-')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('renders the logo image when logoUrl is provided', () => {
    renderWithProviders(
      <ViewModeWrapper {...defaultProps} logoUrl="https://example.com/logo.png" />
    )
    expect(screen.getByRole('img', { name: /current logo/i })).toBeTruthy()
  })

  it('renders a loading spinner when isLogoLoading is true', () => {
    renderWithProviders(<ViewModeWrapper {...defaultProps} isLogoLoading />)
    expect(screen.getByLabelText(/loading logo/i)).toBeTruthy()
  })

  it('renders logo error text when isLogoError is true and not notFound', () => {
    renderWithProviders(<ViewModeWrapper {...defaultProps} isLogoError notFound={false} />)
    expect(screen.getByText(/failed to load/i)).toBeTruthy()
  })

  it('renders the screen date format value', () => {
    renderWithProviders(<ViewModeWrapper {...defaultProps} />)
    expect(screen.getByText('DD/MM/YYYY')).toBeTruthy()
  })

  it('renders averageMembersPerHousehold value', () => {
    renderWithProviders(<ViewModeWrapper {...defaultProps} />)
    expect(screen.getByText('5')).toBeTruthy()
  })
})

describe('FieldInfoIcon', () => {
  it('renders with the tooltip text as aria-label', () => {
    renderWithProviders(<FieldInfoIcon tooltip="Some helpful info" />)
    expect(screen.getByLabelText('Some helpful info')).toBeTruthy()
  })
})
