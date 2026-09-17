import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { CookSidebar } from '../components/layout/CookSidebar';
import { CookHeader } from '../components/layout/CookHeader';
import { AppLayout } from '../components/layout/AppLayout';

export function CookLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <AppLayout
      sidebar={
        <CookSidebar
          isOpen={sidebarOpen}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          onClose={() => setSidebarOpen(false)}
        />
      }
      header={<CookHeader onMenuClick={() => setSidebarOpen(true)} />}
    >
      <Outlet />
    </AppLayout>
  );
}

