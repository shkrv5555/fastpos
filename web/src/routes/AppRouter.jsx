import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Lazy-loaded səhifələr
const Menu           = lazy(() => import('@pages/customer/Menu'));
const OrderStatus    = lazy(() => import('@pages/customer/OrderStatus'));
const EmployeeLogin  = lazy(() => import('@pages/employee/EmployeeLogin'));
const Orders         = lazy(() => import('@pages/employee/Orders'));
const StockIntake    = lazy(() => import('@pages/employee/StockIntake'));
const EditRequest    = lazy(() => import('@pages/employee/EditRequest'));

function ProtectedEmployee({ children }) {
  const user = useSelector(s => s.auth.user);
  if (!user || user.role !== 'employee') return <Navigate to="/employee/login" replace />;
  return children;
}

const Loader = () => (
  <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}>
    <div className="spinner" />
  </div>
);

export default function AppRouter() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Müştəri interfeysi */}
        <Route path="/"                  element={<Menu />} />
        <Route path="/order/:id/status"  element={<OrderStatus />} />

        {/* İşçi dashboardı */}
        <Route path="/employee/login"    element={<EmployeeLogin />} />
        <Route path="/employee/orders"   element={<ProtectedEmployee><Orders /></ProtectedEmployee>} />
        <Route path="/employee/stock"    element={<ProtectedEmployee><StockIntake /></ProtectedEmployee>} />
        <Route path="/employee/edit-request" element={<ProtectedEmployee><EditRequest /></ProtectedEmployee>} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
