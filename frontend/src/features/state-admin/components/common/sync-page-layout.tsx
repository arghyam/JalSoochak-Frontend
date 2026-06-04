import type { ReactNode } from 'react'

interface SyncPageLayoutProps {
  toolbar: ReactNode
  stats: ReactNode
  table: ReactNode
}

export function SyncPageLayout({ toolbar, stats, table }: SyncPageLayoutProps) {
  return (
    <>
      {toolbar}
      {stats}
      {table}
    </>
  )
}
