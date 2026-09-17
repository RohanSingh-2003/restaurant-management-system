import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { CustomerSidebar } from '../components/layout/CustomerSidebar';
import { CustomerHeader } from '../components/layout/CustomerHeader';
import { AppLayout } from '../components/layout/AppLayout';

export function CustomerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <AppLayout
      sidebar={
        <CustomerSidebar
          isOpen={sidebarOpen}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          onClose={() => setSidebarOpen(false)}
        />
      }
      header={<CustomerHeader onMenuClick={() => setSidebarOpen(true)} />}
    >
      <Outlet />
    </AppLayout>
  );
}
