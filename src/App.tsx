import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RoleSelection } from './pages/RoleSelection';
import { ManagerLogin } from './pages/auth/ManagerLogin';
import { ManagerLayout } from './layouts/ManagerLayout';
import { ManagerDashboard } from './pages/manager/Dashboard';
import { AnalyticsOverview } from './pages/manager/Overview';
import { SalesAnalytics } from './pages/manager/Sales';
import { CustomerAnalytics } from './pages/manager/Customers';
import { ProductAnalytics } from './pages/manager/Products';
import { RegressionAnalysis } from './pages/manager/mining/Regression';
import { ClassificationAnalysis } from './pages/manager/mining/Classification';
import { ClusteringAnalysis } from './pages/manager/mining/Clustering';
import { DatasetsPage } from './pages/manager/warehouse/Datasets';
import { ETLPipelinePage } from './pages/manager/warehouse/ETLPipeline';
import { OLAPExplorerPage } from './pages/manager/warehouse/OLAPExplorer';
import { ReportsPage } from './pages/manager/reports/Reports';
import { ManagerProfile } from './pages/manager/profile/Profile';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Waiter module imports
import { WaiterLogin } from './pages/waiter/WaiterLogin';
import { WaiterLayout } from './layouts/WaiterLayout';
import { WaiterDashboard } from './pages/waiter/Dashboard';
import { TablesPage } from './pages/waiter/Tables';
import { NewOrderPage } from './pages/waiter/NewOrder';
import { ActiveOrdersPage } from './pages/waiter/ActiveOrders';
import { ReadyOrdersPage } from './pages/waiter/ReadyOrders';
import { CustomerRequestsPage } from './pages/waiter/CustomerRequests';
import { WaiterBillsPage } from './pages/waiter/Bills';
import { OrderHistoryPage } from './pages/waiter/OrderHistory';
import { WaiterProfile } from './pages/waiter/Profile';

// Cook module imports
import { CookLogin } from './pages/cook/CookLogin';
import { CookLayout } from './layouts/CookLayout';
import { CookDashboard } from './pages/cook/Dashboard';
import { CookProfile } from './pages/cook/Profile';

// Customer module imports
import { CustomerLogin } from './pages/customer/CustomerLogin';
import { CustomerLayout } from './layouts/CustomerLayout';
import { CustomerDashboard } from './pages/customer/Dashboard';
import { CustomerMenu } from './pages/customer/Menu';
import { CustomerCart } from './pages/customer/Cart';
import { CustomerOrders } from './pages/customer/Orders';
import { CustomerOrderDetail } from './pages/customer/OrderDetail';
import { CustomerBills } from './pages/customer/Bills';
import { CustomerProfile } from './pages/customer/Profile';

// Admin module imports
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminUsers } from './pages/admin/Users';
import { AdminStaff } from './pages/admin/Staff';
import { AdminMenu } from './pages/admin/Menu';
import { AdminTables } from './pages/admin/Tables';
import { AdminOrders } from './pages/admin/Orders';
import { AdminSettings } from './pages/admin/Settings';
import { AdminProfile } from './pages/admin/Profile';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<RoleSelection />} />
        <Route path="/manager/login" element={<ManagerLogin />} />
        <Route path="/waiter/login" element={<WaiterLogin />} />
        <Route path="/cook/login" element={<CookLogin />} />
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected manager routes */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ManagerDashboard />} />

          {/* Analytics */}
          <Route path="analytics" element={<Navigate to="/manager/analytics/overview" replace />} />
          <Route path="analytics/overview" element={<AnalyticsOverview />} />
          <Route path="analytics/sales" element={<SalesAnalytics />} />
          <Route path="analytics/customers" element={<CustomerAnalytics />} />
          <Route path="analytics/products" element={<ProductAnalytics />} />

          {/* Data Mining */}
          <Route path="mining/regression" element={<RegressionAnalysis />} />
          <Route path="mining/classification" element={<ClassificationAnalysis />} />
          <Route path="mining/clustering" element={<ClusteringAnalysis />} />

          {/* Data Warehouse */}
          <Route path="warehouse/datasets" element={<DatasetsPage />} />
          <Route path="warehouse/etl" element={<ETLPipelinePage />} />
          <Route path="warehouse/olap" element={<OLAPExplorerPage />} />

          {/* Reports */}
          <Route path="reports" element={<ReportsPage />} />

          {/* Profile */}
          <Route path="profile" element={<ManagerProfile />} />
        </Route>

        {/* Protected waiter routes */}
        <Route
          path="/waiter"
          element={
            <ProtectedRoute allowedRoles={['waiter']}>
              <WaiterLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<WaiterDashboard />} />
          <Route path="tables" element={<TablesPage />} />
          <Route path="requests" element={<CustomerRequestsPage />} />
          <Route path="orders" element={<ActiveOrdersPage />} />
          <Route path="orders/new" element={<NewOrderPage />} />
          <Route path="orders/ready" element={<ReadyOrdersPage />} />
          <Route path="orders/history" element={<OrderHistoryPage />} />
          <Route path="bills" element={<WaiterBillsPage />} />
          <Route path="profile" element={<WaiterProfile />} />
        </Route>

        {/* Protected cook routes */}
        <Route
          path="/cook"
          element={
            <ProtectedRoute allowedRoles={['cook']}>
              <CookLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<CookDashboard />} />
          <Route path="profile" element={<CookProfile />} />
        </Route>

        {/* Protected customer routes */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<CustomerDashboard />} />
          <Route path="menu" element={<CustomerMenu />} />
          <Route path="cart" element={<CustomerCart />} />
          <Route path="order" element={<CustomerCart />} />
          <Route path="current-order" element={<CustomerCart />} />
          <Route path="orders" element={<CustomerOrders />} />
          <Route path="orders/:id" element={<CustomerOrderDetail />} />
          <Route path="bills" element={<CustomerBills />} />
          <Route path="profile" element={<CustomerProfile />} />
        </Route>

        {/* Protected admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="staff" element={<AdminStaff />} />
          <Route path="menu" element={<AdminMenu />} />
          <Route path="tables" element={<AdminTables />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
