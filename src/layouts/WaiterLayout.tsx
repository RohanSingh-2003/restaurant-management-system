import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { WaiterSidebar } from '../components/layout/WaiterSidebar';
import { WaiterHeader } from '../components/layout/WaiterHeader';
import { AppLayout } from '../components/layout/AppLayout';

export function WaiterLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <AppLayout
      sidebar={
        <WaiterSidebar
          isOpen={sidebarOpen}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          onClose={() => setSidebarOpen(false)}
        />
      }
      header={<WaiterHeader onMenuClick={() => setSidebarOpen(true)} />}
    >
      <Outlet />
    </AppLayout>
  );
}
