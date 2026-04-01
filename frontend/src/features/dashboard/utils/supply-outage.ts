import type { WaterSupplyOutageData } from '../types'

export function hasRenderableSupplyOutageReasons(data: WaterSupplyOutageData[]): boolean {
  return data.some((entry) =>
    Object.values(entry.reasons ?? {}).some((value) => {
      const numericValue = Number(value)

      return Number.isFinite(numericValue) && numericValue > 0
    })
  )
}
