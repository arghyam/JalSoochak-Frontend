import { screen } from '@testing-library/react'
import { describe, expect, it, jest } from '@jest/globals'
import { WaterNormsPage } from './water-norms-page'
import { renderWithProviders } from '@/test/render-with-providers'

jest.mock('../../services/query/use-state-admin-queries', () => ({
  useWaterNormsConfigurationQuery: () => ({
    data: {
      stateQuantity: 100,
      maxQuantity: 150,
      minQuantity: 50,
      regularity: 10,
      districtOverrides: [],
      isConfigured: false,
    },
    isLoading: false,
    isError: false,
  }),
  useSaveWaterNormsConfigurationMutation: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
}))

describe('WaterNormsPage', () => {
  it('renders edit form with state quantity input and alert thresholds', () => {
    renderWithProviders(<WaterNormsPage />)

    const spinButtons = screen.getAllByRole('spinbutton')
    // One for state quantity + three for alert thresholds
    expect(spinButtons.length).toBeGreaterThanOrEqual(4)
  })
})
