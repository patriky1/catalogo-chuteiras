import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AdminLayout, PublicLayout } from './components/Layouts';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import NotFound from './pages/NotFound';

// Área administrativa carregada sob demanda (não pesa no carregamento do catálogo)
const Login = lazy(() => import('./pages/admin/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const ProductEditor = lazy(() => import('./pages/admin/ProductEditor'));

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="produto/:id" element={<ProductDetail />} />
      </Route>

      <Route path="admin" element={<AdminLayout />}>
        <Route path="login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route index element={<Dashboard />} />
          <Route path="produtos/novo" element={<ProductEditor />} />
          <Route path="produtos/:id/editar" element={<ProductEditor />} />
        </Route>
      </Route>

      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
