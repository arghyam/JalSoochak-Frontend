import { screen } from '@testing-library/react'
import { describe, expect, it, jest } from '@jest/globals'
import { WaterNormsAlertThresholds } from './water-norms-alert-thresholds'
import { renderWithProviders } from '@/test/render-with-providers'

describe('WaterNormsAlertThresholds', () => {
  it('renders numeric inputs for alert thresholds', () => {
    renderWithProviders(
      <WaterNormsAlertThresholds
        maxQuantity="150"
        minQuantity="50"
        regularity="10"
        onMaxQuantityChange={jest.fn()}
        onMinQuantityChange={jest.fn()}
        onRegularityChange={jest.fn()}
      />
    )

    const inputs = screen.getAllByRole('spinbutton')
    expect(inputs.length).toBeGreaterThanOrEqual(3)
  })
})
