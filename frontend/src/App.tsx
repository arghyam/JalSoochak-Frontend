import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryProvider } from '@/app/providers/query-provider'
import { ErrorBoundary } from '@/shared/components/common/error-boundary'
import { PageErrorState } from '@/shared/components/common/page-error-state'
import { router } from '@/app/router'
import { useAuthStore } from '@/app/store'
import { useIdleTimeout } from '@/shared/hooks/use-idle-timeout'
import { initAnalytics, setAnalyticsUserProperties } from '@/shared/lib/analytics'
import { isSingleTenantMode } from '@/config/server-config'

// Initialize i18n
import i18n from '@/app/i18n'

function App() {
  const bootstrap = useAuthStore((state) => state.bootstrap)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  // No-op unless config.js carries a FIREBASE block, and idempotent so StrictMode's
  // double-invoked effect loads the SDK once. Seeding the user properties here means every
  // event is segmented by language and tenancy, including the first one.
  useEffect(() => {
    initAnalytics()
    setAnalyticsUserProperties({
      // Taken from i18n rather than the language store: i18n owns the detected language,
      // and a region suffix ("en-US") would fragment the report.
      language: i18n.language?.split('-')[0],
      tenancy: isSingleTenantMode() ? 'single' : 'multi',
    })
  }, [])

  useIdleTimeout({
    onIdle: () => useAuthStore.getState().setSessionExpired(),
    isActive: isAuthenticated,
  })

  return (
    <QueryProvider>
      <ErrorBoundary fallback={<PageErrorState message="Something went wrong" />}>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </QueryProvider>
  )
}

export default App
