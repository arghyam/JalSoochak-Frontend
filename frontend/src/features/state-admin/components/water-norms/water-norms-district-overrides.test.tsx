import { screen } from '@testing-library/react'
import { describe, expect, it, jest } from '@jest/globals'
import type { DistrictOverride } from '../../types/water-norms'
import { WaterNormsDistrictOverrides } from './water-norms-district-overrides'
import { renderWithProviders } from '@/test/render-with-providers'

const mockOverrides: DistrictOverride[] = [
  {
    id: 'district-1',
    districtName: 'some-district',
    quantity: 100,
  },
]

describe('WaterNormsDistrictOverrides', () => {
  it('renders district override inputs and delete button', () => {
    renderWithProviders(
      <WaterNormsDistrictOverrides
        districtOverrides={mockOverrides}
        onAddDistrict={jest.fn()}
        onRemoveDistrict={jest.fn()}
        onDistrictChange={jest.fn()}
        getDistrictLabel={(value) => value}
        getAvailableDistricts={() => []}
      />
    )

    const quantityInput = screen.getByRole('spinbutton')
    expect(quantityInput).toBeTruthy()

    const deleteButtons = screen.getAllByRole('button')
    expect(deleteButtons.length).toBeGreaterThanOrEqual(1)
  })
})
