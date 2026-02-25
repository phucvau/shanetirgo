import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminNotificationBell } from "@/components/admin/admin-notification-bell"

export const metadata = {
  title: "LUXE Admin - Quan ly cua hang",
  description: "Trang quan ly cua hang thoi trang LUXE",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
          <p className="text-sm text-muted-foreground">Admin Dashboard</p>
          <AdminNotificationBell />
        </header>
        <div className="flex-1 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
