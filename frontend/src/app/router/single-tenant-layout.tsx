import { lazy, Suspense } from 'react'
import { LoadingSpinner } from '@/shared/components/common'
import { DashboardLayout } from '@/shared/components/layout'

const SingleTenantGate = lazy(() =>
  import('./single-tenant-gate').then((module) => ({ default: module.SingleTenantGate }))
)

export function SingleTenantLayout() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <LoadingSpinner />
        </DashboardLayout>
      }
    >
      <SingleTenantGate />
    </Suspense>
  )
}
