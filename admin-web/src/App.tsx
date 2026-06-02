import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import PendingCCCD from './pages/PendingCCCD';
import Products from './pages/Products';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import Groups from './pages/Groups';
import Categories from './pages/Categories';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Admin Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="pending-cccd" element={<PendingCCCD />} />
           <Route path="products" element={<Products />} />
          <Route path="groups" element={<Groups />} />
          <Route path="categories" element={<Categories />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          
          {/* Catch-all redirected to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
