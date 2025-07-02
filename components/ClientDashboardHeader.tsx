'use client'

import dynamic from 'next/dynamic'
import type { DashboardHeaderProps } from './DashboardHeader'

const DashboardHeader = dynamic(() => import('./DashboardHeader'), {
  ssr: false,
})

export default function ClientDashboardHeader(props: DashboardHeaderProps) {
  return <DashboardHeader {...props} />
}
