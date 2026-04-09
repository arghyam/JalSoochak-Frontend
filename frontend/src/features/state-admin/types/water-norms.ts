export interface DistrictOverride {
  id: string
  districtName: string
  quantity: number
}

export interface WaterNormsConfiguration {
  id: string
  stateQuantity: number | null
  districtOverrides: DistrictOverride[]
  oversupplyThreshold: number | null
  undersupplyThreshold: number | null
  isConfigured: boolean
}
