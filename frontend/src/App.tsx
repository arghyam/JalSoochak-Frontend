import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryProvider } from '@/app/providers/query-provider'
import { ErrorBoundary } from '@/shared/components/common/error-boundary'
import { PageErrorState } from '@/shared/components/common/page-error-state'
import { router } from '@/app/router'
import { useAuthStore } from '@/app/store'
import { useIdleTimeout } from '@/shared/hooks/use-idle-timeout'

// Initialize i18n
import '@/app/i18n'

function App() {
  const bootstrap = useAuthStore((state) => state.bootstrap)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

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
