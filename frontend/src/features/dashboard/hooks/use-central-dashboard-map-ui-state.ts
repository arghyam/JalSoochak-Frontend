import { useEffect, useState } from 'react'
import type { EntityPerformance } from '../types'

export function useCentralDashboardMapUiState() {
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)
  const [isMapRegularityView, setIsMapRegularityView] = useState(true)
  const [isMapDistrictView, setIsMapDistrictView] = useState(false)
  const [hoveredOverallPerformanceRow, setHoveredOverallPerformanceRow] =
    useState<EntityPerformance | null>(null)

  useEffect(() => {
    if (!isMapFullscreen) {
      return
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isMapFullscreen])

  useEffect(() => {
    if (!isMapFullscreen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMapFullscreen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMapFullscreen])

  return {
    hoveredOverallPerformanceRow,
    isMapDistrictView,
    isMapFullscreen,
    isMapRegularityView,
    setHoveredOverallPerformanceRow,
    setIsMapDistrictView,
    setIsMapFullscreen,
    setIsMapRegularityView,
  }
}
