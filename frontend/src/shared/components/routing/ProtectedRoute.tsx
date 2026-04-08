import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Flex } from '@chakra-ui/react'
import { useAuthStore } from '@/app/store'
import { AUTH_ROLES, STAFF_ROLES, type AuthRole } from '@/shared/constants/auth'
import { ROUTES } from '@/shared/constants/routes'
import { ForbiddenPage, SessionExpiredPage, LoadingSpinner } from '@/shared/components/common'

/**
 * Check if a pathname belongs to the staff route tree (e.g., /staff, /staff/login).
 * Uses segment boundaries to avoid false positives like /staffing.
 */
function isStaffRoute(pathname: string): boolean {
  return pathname === ROUTES.STAFF || pathname.startsWith(ROUTES.STAFF + '/')
}

interface ProtectedRouteProps {
  children: ReactNode
  requireAuth?: boolean
  allowedRoles?: AuthRole[]
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  allowedRoles,
}: ProtectedRouteProps) {
  const location = useLocation()
  const { isAuthenticated, user, sessionExpired, isBootstrapping } = useAuthStore()

  if (isBootstrapping) {
    return (
      <Flex h="100vh" align="center" justify="center">
        <LoadingSpinner />
      </Flex>
    )
  }

  if (sessionExpired) {
    return <SessionExpiredPage />
  }

  if (requireAuth && !isAuthenticated) {
    const loginRoute = isStaffRoute(location.pathname) ? ROUTES.STAFF_LOGIN : ROUTES.LOGIN
    return <Navigate to={loginRoute} state={{ from: location }} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role as AuthRole)) {
    return <ForbiddenPage />
  }

  return <>{children}</>
}

export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, isBootstrapping } = useAuthStore()
  const location = useLocation()

  if (isBootstrapping) {
    return (
      <Flex h="100vh" align="center" justify="center">
        <LoadingSpinner />
      </Flex>
    )
  }

  if (!isAuthenticated || !user) {
    return <>{children}</>
  }

  const from = (location.state as { from?: Location } | null)?.from
  if (from?.pathname) {
    const destination = `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`
    return <Navigate to={destination} replace />
  }

  // Default: role-based home
  if (user.role === AUTH_ROLES.SUPER_ADMIN) {
    return <Navigate to={ROUTES.SUPER_ADMIN} replace />
  }

  if (user.role === AUTH_ROLES.STATE_ADMIN) {
    return <Navigate to={ROUTES.STATE_ADMIN} replace />
  }

  if (STAFF_ROLES.includes(user.role as (typeof STAFF_ROLES)[number])) {
    return <Navigate to={ROUTES.STAFF} replace />
  }

  return <Navigate to={ROUTES.DASHBOARD} replace />
}
