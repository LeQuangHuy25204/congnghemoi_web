import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { clearAuth, getStoredUser } from '../services/api.js';

const baseLinkStyle = {
  color: 'var(--ink)',
  textDecoration: 'none',
  padding: '10px 14px',
  borderRadius: '999px',
  transition: 'all 0.2s ease',
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: '14px',
  fontWeight: 600,
  whiteSpace: 'nowrap'
};

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 992);

  useEffect(() => {
    const sync = () => setUser(getStoredUser());
    sync();
    window.addEventListener('authChanged', sync);
    return () => window.removeEventListener('authChanged', sync);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const role = user?.role;

  const navItems = useMemo(() => {
    const items = [];

    if (role !== 'employee') {
      items.push({ to: '/', label: 'Trang chủ' });
    }

    if (role !== 'employee' && role !== 'admin') {
      items.push({ to: '/products', label: 'Sản phẩm' });
    }

    if (role === 'customer') {
      items.push(
        { to: '/cart', label: 'Giỏ hàng' },
        { to: '/orders', label: 'Đơn hàng' },
        { to: '/orders/history', label: 'Lịch sử' },
        { to: '/support', label: 'Hỗ trợ' }
      );
    }

    if (role === 'admin') {
      items.push(
        { to: '/admin/products', label: 'Quản lý sản phẩm' },
        { to: '/admin/users', label: 'Người dùng' },
        { to: '/admin/orders', label: 'Đơn hàng' }
      );
    }

    if (role === 'employee') {
      items.push({ to: '/employee/support', label: 'Support Desk' });
    }

    items.push({ to: '/chatbot', label: 'Chatbot' });

    return items;
  }, [role]);

  const handleLogout = () => {
    clearAuth();
    setIsMenuOpen(false);
    navigate('/login');
  };

  const renderNavLink = (item) => {
    const active = location.pathname === item.to;

    return (
      <Link
        key={item.to}
        to={item.to}
        style={{
          ...baseLinkStyle,
          background: active ? 'var(--primary-light)' : 'transparent',
          color: active ? 'var(--primary-dark)' : 'var(--ink)'
        }}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <nav className="site-nav">
      <div className="site-nav__promo">
        <div className="container-lg site-nav__promo-inner">
          <span>Giá tốt mỗi ngày</span>
          <span>Giao nhanh toàn quốc</span>
          <span>Hỗ trợ sau bán hàng</span>
        </div>
      </div>

      <div className="container-lg" style={{ padding: '0 16px' }}>
        <div
          style={{
            minHeight: '72px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 16px',
              borderRadius: '999px',
              textDecoration: 'none',
              color: '#fff',
              fontFamily: 'Sora, system-ui, sans-serif',
              fontSize: '24px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              boxShadow: '0 14px 28px rgba(234, 88, 12, 0.22)'
            }}
          >
            ShopHub
          </Link>

          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {navItems.map(renderNavLink)}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {!isMobile && user && (
              <Link
                to="/profile"
                style={{
                  ...baseLinkStyle,
                  background: '#fff',
                  border: '1px solid var(--border)',
                  maxWidth: '220px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {user.name || user.email}
              </Link>
            )}

            {!isMobile && user && (
              <button
                onClick={handleLogout}
                style={{
                  padding: '10px 16px',
                  borderRadius: '999px',
                  border: 'none',
                  background: 'var(--primary)',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Đăng xuất
              </button>
            )}

            {!isMobile && !user && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link
                  to="/login"
                  style={{
                    ...baseLinkStyle,
                    border: '1px solid var(--primary-border)',
                    color: 'var(--primary-dark)'
                  }}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  style={{
                    ...baseLinkStyle,
                    background: 'var(--primary)',
                    color: '#fff'
                  }}
                >
                  Đăng ký
                </Link>
              </div>
            )}

            {isMobile && (
              <button
                onClick={() => setIsMenuOpen((value) => !value)}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  border: '1px solid var(--border)',
                  background: '#fff',
                  color: 'var(--ink)',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                {isMenuOpen ? '×' : '≡'}
              </button>
            )}
          </div>
        </div>

        {isMobile && isMenuOpen && (
          <div
            style={{
              padding: '0 0 16px',
              display: 'grid',
              gap: '10px'
            }}
          >
            <div
              style={{
                display: 'grid',
                gap: '8px',
                padding: '14px',
                borderRadius: '20px',
                background: '#ffffffd9',
                border: '1px solid var(--border)'
              }}
            >
              {navItems.map(renderNavLink)}
            </div>

            {user ? (
              <div
                style={{
                  display: 'grid',
                  gap: '8px',
                  padding: '14px',
                  borderRadius: '20px',
                  background: '#ffffffd9',
                  border: '1px solid var(--border)'
                }}
              >
                <Link
                  to="/profile"
                  style={{
                    ...baseLinkStyle,
                    justifyContent: 'center',
                    background: '#fff',
                    border: '1px solid var(--border)'
                  }}
                >
                  {user.name || user.email}
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '8px' }}>
                <Link
                  to="/login"
                  style={{
                    ...baseLinkStyle,
                    justifyContent: 'center',
                    background: '#fff',
                    border: '1px solid var(--primary-border)',
                    color: 'var(--primary-dark)'
                  }}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  style={{
                    ...baseLinkStyle,
                    justifyContent: 'center',
                    background: 'var(--primary)',
                    color: '#fff'
                  }}
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
