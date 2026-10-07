import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RoleSelection } from './pages/RoleSelection';
import { AdminLogin } from './pages/auth/AdminLogin';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboard } from './pages/admin/Dashboard';
import { AnalyticsOverview } from './pages/admin/Overview';
import { SalesAnalytics } from './pages/admin/Sales';
import { CustomerAnalytics } from './pages/admin/Customers';
import { ProductAnalytics } from './pages/admin/Products';
import { RegressionAnalysis } from './pages/admin/mining/Regression';
import { ClassificationAnalysis } from './pages/admin/mining/Classification';
import { ClusteringAnalysis } from './pages/admin/mining/Clustering';
import { DatasetsPage } from './pages/admin/warehouse/Datasets';
import { ETLPipelinePage } from './pages/admin/warehouse/ETLPipeline';
import { OLAPExplorerPage } from './pages/admin/warehouse/OLAPExplorer';
import { ReportsPage } from './pages/admin/reports/Reports';
import { AdminProfile } from './pages/admin/profile/Profile';
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

// Manager module imports
import { ManagerLogin } from './pages/manager/ManagerLogin';
import { ManagerLayout } from './layouts/ManagerLayout';
import { ManagerDashboard } from './pages/manager/Dashboard';
import { ManagerUsers } from './pages/manager/Users';
import { ManagerStaff } from './pages/manager/Staff';
import { ManagerMenu } from './pages/manager/Menu';
import { ManagerTables } from './pages/manager/Tables';
import { ManagerOrders } from './pages/manager/Orders';
import { ManagerSettings } from './pages/manager/Settings';
import { ManagerProfile } from './pages/manager/Profile';

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

          {/* Analytics */}
          <Route path="analytics" element={<Navigate to="/admin/analytics/overview" replace />} />
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
          <Route path="profile" element={<AdminProfile />} />
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
          <Route path="users" element={<ManagerUsers />} />
          <Route path="staff" element={<ManagerStaff />} />
          <Route path="menu" element={<ManagerMenu />} />
          <Route path="tables" element={<ManagerTables />} />
          <Route path="orders" element={<ManagerOrders />} />
          <Route path="settings" element={<ManagerSettings />} />
          <Route path="profile" element={<ManagerProfile />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
