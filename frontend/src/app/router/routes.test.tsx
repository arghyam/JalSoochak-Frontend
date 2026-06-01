import { describe, expect, it, jest, beforeAll } from '@jest/globals'
import type { ReactElement } from 'react'
import type { RouteObject } from 'react-router-dom'
import { ROUTES } from '@/shared/constants/routes'

function stub(id: string) {
  return function StubPage(): ReactElement {
    return <div data-testid={id} />
  }
}

jest.mock('@/app/router/single-tenant-gate', () => ({
  SingleTenantGate: stub('single-tenant-gate'),
}))

jest.mock('@/shared/components/layout', () => ({
  MainLayout: stub('main-layout'),
}))

// Feature page mocks are not needed — React.lazy factories only fire on render,
// and this test never renders any route components (it only walks the config tree).

jest.mock('@/shared/components/common', () => {
  const actual = jest.requireActual<typeof import('@/shared/components/common')>(
    '@/shared/components/common'
  )
  return {
    ...actual,
    NotFoundPage: stub('not-found'),
  }
})

function listDeclaredPaths(routes: RouteObject[]): string[] {
  const out: string[] = []
  const walk = (items: RouteObject[]) => {
    for (const route of items) {
      if (typeof route.path === 'string') {
        out.push(route.path)
      }
      if (route.children) {
        walk(route.children)
      }
    }
  }
  walk(routes)
  return out
}

describe('app router', () => {
  let routerRoutes: RouteObject[]

  beforeAll(async () => {
    const { router } = await import('./routes')
    routerRoutes = router.routes
  })

  it('defines core auth and panel paths', () => {
    const paths = listDeclaredPaths(routerRoutes)
    expect(paths).toEqual(expect.arrayContaining([ROUTES.LOGIN, ROUTES.STAFF_LOGIN, ROUTES.STAFF]))
    expect(paths).toEqual(
      expect.arrayContaining([ROUTES.SUPER_ADMIN, ROUTES.STATE_ADMIN, ROUTES.PROFILE])
    )
  })

  it('includes wildcard not-found route', () => {
    const hasCatchAll = routerRoutes.some((r) => r.path === '*')
    expect(hasCatchAll).toBe(true)
  })

  it('registers dashboard and tenant slug entry routes', () => {
    const paths = listDeclaredPaths(routerRoutes)
    expect(paths).toContain(ROUTES.DASHBOARD)
    expect(paths.some((p) => p.includes(':'))).toBe(true)
  })
})
