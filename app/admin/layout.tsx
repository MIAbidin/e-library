import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { AdminHeader } from '@/components/layout/AdminHeader'
import { MobileDrawer } from '@/components/layout/MobileDrawer'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) redirect('/auth/login')
  if (session.user.role !== 'admin') redirect('/dashboard')

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar — selalu visible di lg ke atas */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 h-full">
        <AdminSidebar />
      </aside>

      {/* Mobile sidebar — muncul sebagai drawer */}
      <MobileDrawer>
        <AdminSidebar />
      </MobileDrawer>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}