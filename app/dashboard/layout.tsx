import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { redirect } from 'next/navigation'
import { DashboardSidebarDesktop, DashboardSidebarMobile } from '@/components/layout/DashboardSidebar'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { MobileDrawer } from '@/components/layout/MobileDrawer'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) redirect('/auth/login')

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar — selalu visible di lg ke atas */}
      <DashboardSidebarDesktop />

      {/* Mobile sidebar — muncul sebagai drawer */}
      <MobileDrawer>
        <DashboardSidebarMobile />
      </MobileDrawer>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}