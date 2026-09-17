import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../components/layout/AdminSidebar';
import { AdminHeader } from '../components/layout/AdminHeader';
import { AppLayout } from '../components/layout/AppLayout';

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <AppLayout
      sidebar={
        <AdminSidebar
          isOpen={sidebarOpen}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          onClose={() => setSidebarOpen(false)}
        />
      }
      header={<AdminHeader onMenuClick={() => setSidebarOpen(true)} />}
    >
      <Outlet />
    </AppLayout>
  );
}
