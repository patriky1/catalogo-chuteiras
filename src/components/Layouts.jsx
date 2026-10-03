import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Suspense } from 'react';
import Header from './Header';
import Footer from './Footer';
import { Loader } from './Feedback';
import { BootIcon } from './Icons';
import { useAuth } from '../context/AuthContext';
import { STORE_NAME } from '../config';

export function PublicLayout() {
  return (
    <div className="app">
      <Header />
      <main className="main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="app app--admin">
      <header className="header header--admin">
        <div className="container header__inner">
          <Link to="/admin" className="logo">
            <span className="logo__mark"><BootIcon width={22} height={22} /></span>
            <span className="logo__text">{STORE_NAME} <small>Admin</small></span>
          </Link>
          {user && (
            <nav className="header__nav">
              <NavLink to="/admin" end className="header__link">Produtos</NavLink>
              <Link to="/" className="header__link hide-xs" target="_blank">Ver site</Link>
              <button type="button" className="btn btn--ghost btn--sm" onClick={handleLogout}>Sair</button>
            </nav>
          )}
        </div>
      </header>
      <main className="main">
        <Suspense fallback={<div className="container page"><Loader /></div>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
