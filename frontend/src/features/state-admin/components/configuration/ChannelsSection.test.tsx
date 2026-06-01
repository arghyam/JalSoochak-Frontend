import { screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, jest } from '@jest/globals'
import { ChannelsSection } from './channels-section'
import { renderWithProviders } from '@/test/render-with-providers'
import type { SupportedChannel } from '../../types/configuration'

const ALL_CHANNELS: SupportedChannel[] = ['BFM', 'ELM', 'PDU', 'IOT', 'MAN']
const HALF = Math.ceil(ALL_CHANNELS.length / 2)

const baseProps = {
  allDisplayChannels: ALL_CHANNELS,
  halfChannels: HALF,
  selectedChannels: ['BFM'] as SupportedChannel[],
  errors: {},
  required: true,
  isLoading: false,
  isError: false,
  degraded: false,
  removedChannels: [] as SupportedChannel[],
  onChange: jest.fn(),
  onClearError: jest.fn(),
}

describe('ChannelsSection', () => {
  it('renders the section title', () => {
    renderWithProviders(<ChannelsSection {...baseProps} />)
    expect(screen.getByText(/Supported Channels/i)).toBeTruthy()
  })

  it('renders channel checkboxes for each display channel', () => {
    renderWithProviders(<ChannelsSection {...baseProps} />)
    expect(screen.getByRole('checkbox', { name: /Bulk Flow Meter/i })).toBeTruthy()
    expect(screen.getByRole('checkbox', { name: /Electric Meter/i })).toBeTruthy()
    expect(screen.getByRole('checkbox', { name: /Manual/i })).toBeTruthy()
  })

  it('pre-checks the selectedChannels', () => {
    renderWithProviders(<ChannelsSection {...baseProps} selectedChannels={['ELM']} />)
    expect(
      (screen.getByRole('checkbox', { name: /Electric Meter/i }) as HTMLInputElement).checked
    ).toBe(true)
    expect(
      (screen.getByRole('checkbox', { name: /Bulk Flow Meter/i }) as HTMLInputElement).checked
    ).toBe(false)
  })

  it('calls onChange and onClearError when a checkbox is toggled', () => {
    const onChange = jest.fn()
    const onClearError = jest.fn()
    renderWithProviders(
      <ChannelsSection
        {...baseProps}
        selectedChannels={[]}
        onChange={onChange}
        onClearError={onClearError}
      />
    )
    fireEvent.click(screen.getByRole('checkbox', { name: /Bulk Flow Meter/i }))
    expect(onChange).toHaveBeenCalled()
    expect(onClearError).toHaveBeenCalledWith('supportedChannels')
  })

  it('shows a spinner while loading', () => {
    renderWithProviders(<ChannelsSection {...baseProps} isLoading />)
    expect(screen.getAllByText(/loading/i).length).toBeGreaterThan(0)
    expect(screen.queryByRole('checkbox')).toBeNull()
  })

  it('shows error text when isError is true', () => {
    renderWithProviders(<ChannelsSection {...baseProps} isError />)
    expect(screen.getByText(/failed to load/i)).toBeTruthy()
  })

  it('disables removed channels when degraded', () => {
    renderWithProviders(
      <ChannelsSection
        {...baseProps}
        degraded
        removedChannels={['BFM']}
        selectedChannels={['BFM', 'ELM']}
      />
    )
    expect(
      (screen.getByRole('checkbox', { name: /Bulk Flow Meter/i }) as HTMLInputElement).disabled
    ).toBe(true)
    expect(
      (screen.getByRole('checkbox', { name: /Electric Meter/i }) as HTMLInputElement).disabled
    ).toBe(false)
  })

  it('shows inline form error when errors.supportedChannels is set', () => {
    renderWithProviders(
      <ChannelsSection {...baseProps} errors={{ supportedChannels: 'Required' }} />
    )
    expect(screen.getByText('Required')).toBeTruthy()
  })
})
