import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ManagerSidebar } from '../components/layout/ManagerSidebar';
import { ManagerHeader } from '../components/layout/ManagerHeader';
import { AppLayout } from '../components/layout/AppLayout';

export function ManagerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <AppLayout
      sidebar={
        <ManagerSidebar
          isOpen={sidebarOpen}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          onClose={() => setSidebarOpen(false)}
        />
      }
      header={<ManagerHeader onMenuClick={() => setSidebarOpen(true)} />}
    >
      <Outlet />
    </AppLayout>
  );
}
