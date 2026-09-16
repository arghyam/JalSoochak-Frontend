import { useEffect } from 'react'
import { act, render } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'

jest.mock('@/config/server-config', () => ({
  isSingleTenantMode: jest.fn(() => false),
}))

jest.mock('@/shared/lib/analytics', () => ({
  trackEvent: jest.fn(),
}))

import { isSingleTenantMode } from '@/config/server-config'
import { trackEvent } from '@/shared/lib/analytics'
import { useDashboardLevelAnalytics } from './use-dashboard-level-analytics'

const mockIsSingleTenantMode = isSingleTenantMode as jest.Mock
const mockTrackEvent = trackEvent as jest.Mock

function Probe() {
  useDashboardLevelAnalytics()
  return null
}

/** Renders the observer at a URL and flushes the debounce. */
async function renderAt(initialEntry: string) {
  const view = render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<Probe />} />
        <Route path="/:stateSlug" element={<Probe />} />
      </Routes>
    </MemoryRouter>
  )

  await act(async () => {
    jest.advanceTimersByTime(400)
  })

  return view
}

beforeEach(() => {
  jest.useFakeTimers()
  jest.clearAllMocks()
  mockIsSingleTenantMode.mockReturnValue(false)
})

afterEach(() => {
  jest.useRealTimers()
})

describe('useDashboardLevelAnalytics', () => {
  it('reports the national landing view once', async () => {
    await renderAt('/')

    expect(mockTrackEvent).toHaveBeenCalledTimes(1)
    expect(mockTrackEvent).toHaveBeenCalledWith('dashboard_level_view', {
      level: 'national',
      hierarchy: 'administrative',
      depth: 0,
      tenancy: 'multi',
    })
  })

  it('reports the state level in single-tenant mode', async () => {
    mockIsSingleTenantMode.mockReturnValue(true)

    await renderAt('/')

    expect(mockTrackEvent).toHaveBeenCalledWith(
      'dashboard_level_view',
      expect.objectContaining({ level: 'state', depth: 1, tenancy: 'single' })
    )
  })

  it('converts the state code in the path into a readable slug', async () => {
    await renderAt('/as')

    expect(mockTrackEvent).toHaveBeenCalledWith(
      'dashboard_level_view',
      expect.objectContaining({ level: 'state', state: 'assam' })
    )
  })

  it('reports a deep-linked village level with every level name', async () => {
    await renderAt(
      '/as?tab=administrative&district=2:2:bajali&block=39:39:bhabanipur&gramPanchayat=294:294:chauliabari&village=3049:3049:bangti'
    )

    expect(mockTrackEvent).toHaveBeenCalledTimes(1)
    expect(mockTrackEvent).toHaveBeenCalledWith('dashboard_level_view', {
      level: 'village',
      hierarchy: 'administrative',
      depth: 5,
      tenancy: 'multi',
      state: 'assam',
      district_name: 'bajali',
      block_name: 'bhabanipur',
      gram_panchayat_name: 'chauliabari',
      village_name: 'bangti',
    })
  })

  it('reports a departmental level with the departmental hierarchy', async () => {
    await renderAt('/as?departmentZone=1:1:lower-assam&departmentCircle=5:5:barpeta')

    expect(mockTrackEvent).toHaveBeenCalledWith(
      'dashboard_level_view',
      expect.objectContaining({
        level: 'departmentCircle',
        hierarchy: 'departmental',
        circle_name: 'barpeta',
      })
    )
  })

  it('does not report again when the component re-renders at the same URL', async () => {
    const { rerender } = await renderAt('/as?district=2:2:bajali')
    expect(mockTrackEvent).toHaveBeenCalledTimes(1)

    rerender(
      <MemoryRouter initialEntries={['/as?district=2:2:bajali']}>
        <Routes>
          <Route path="/:stateSlug" element={<Probe />} />
        </Routes>
      </MemoryRouter>
    )
    await act(async () => {
      jest.advanceTimersByTime(400)
    })

    expect(mockTrackEvent).toHaveBeenCalledTimes(1)
  })

  it('collapses a rapid URL change into one event for the level that settled', async () => {
    // Mirrors the mount-time rewrite that restores filters from localStorage: the
    // pre-restore level must not be reported alongside the restored one.
    const { unmount } = render(
      <MemoryRouter
        initialEntries={['/as', '/as?district=2:2:bajali&block=39:39:bhabanipur']}
        initialIndex={1}
      >
        <Routes>
          <Route path="/:stateSlug" element={<Probe />} />
        </Routes>
      </MemoryRouter>
    )

    await act(async () => {
      jest.advanceTimersByTime(400)
    })

    expect(mockTrackEvent).toHaveBeenCalledTimes(1)
    expect(mockTrackEvent).toHaveBeenCalledWith(
      'dashboard_level_view',
      expect.objectContaining({ level: 'block' })
    )
    unmount()
  })

  it('reports only the restored level when the URL is rewritten just after mount', async () => {
    // The real filter-restore path: the dashboard mounts at a bare URL and an effect
    // immediately navigates to the stored filters. Only the restored level should report.
    function RestoringProbe() {
      useDashboardLevelAnalytics()
      const navigate = useNavigate()
      useEffect(() => {
        navigate('/as?district=2:2:bajali&block=39:39:bhabanipur')
      }, [navigate])
      return null
    }

    render(
      <MemoryRouter initialEntries={['/as']}>
        <Routes>
          <Route path="/:stateSlug" element={<RestoringProbe />} />
        </Routes>
      </MemoryRouter>
    )

    await act(async () => {
      jest.advanceTimersByTime(400)
    })

    expect(mockTrackEvent).toHaveBeenCalledTimes(1)
    expect(mockTrackEvent).toHaveBeenCalledWith(
      'dashboard_level_view',
      expect.objectContaining({ level: 'block', depth: 3 })
    )
  })

  it('reports nothing before the debounce elapses', () => {
    render(
      <MemoryRouter initialEntries={['/as?district=2:2:bajali']}>
        <Routes>
          <Route path="/:stateSlug" element={<Probe />} />
        </Routes>
      </MemoryRouter>
    )

    expect(mockTrackEvent).not.toHaveBeenCalled()
  })
})
