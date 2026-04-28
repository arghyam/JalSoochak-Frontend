import { createContext, useContext, type ReactNode } from 'react'

export type TenantInfo = {
  tenantName?: string
  tenantCode?: string
}

type TenantContextValue = {
  tenantInfo: TenantInfo
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined)

export function TenantProvider({
  children,
  tenantInfo,
}: {
  children: ReactNode
  tenantInfo: TenantInfo
}) {
  return <TenantContext.Provider value={{ tenantInfo }}>{children}</TenantContext.Provider>
}

export function useTenantInfo(): TenantInfo {
  const context = useContext(TenantContext)
  if (!context) {
    return {}
  }
  return context.tenantInfo
}
