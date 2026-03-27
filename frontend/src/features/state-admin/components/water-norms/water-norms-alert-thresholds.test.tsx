import { screen } from '@testing-library/react'
import { describe, expect, it, jest } from '@jest/globals'
import { WaterNormsAlertThresholds } from './water-norms-alert-thresholds'
import { renderWithProviders } from '@/test/render-with-providers'

describe('WaterNormsAlertThresholds', () => {
  it('renders numeric inputs for alert thresholds', () => {
    renderWithProviders(
      <WaterNormsAlertThresholds
        oversupplyThreshold="150"
        undersupplyThreshold="50"
        onOversupplyThresholdChange={jest.fn()}
        onUndersupplyThresholdChange={jest.fn()}
      />
    )

    const inputs = screen.getAllByRole('spinbutton')
    expect(inputs.length).toBeGreaterThanOrEqual(2)
  })
})
