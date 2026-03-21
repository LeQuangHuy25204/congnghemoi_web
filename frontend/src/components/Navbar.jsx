import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { clearAuth, getStoredUser } from '../services/api.js';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser());
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const sync = () => setUser(getStoredUser());
    sync();
    window.addEventListener('authChanged', sync);
    return () => window.removeEventListener('authChanged', sync);
  }, [location.pathname]);

  const handleLogout = () => {
    clearAuth();
    setIsMenuOpen(false);
    navigate('/login');
  };

  const role = user?.role;

  const navLinkStyle = {
    color: 'var(--ink)',
    textDecoration: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: 500
  };

  return (
    <nav style={{
      backgroundColor: 'var(--surface)',
      boxShadow: 'var(--shadow-lg)',
      borderBottom: '1px solid var(--border-light)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="container-lg" style={{ padding: '0 16px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '60px'
        }}>
          {/* Logo */}
          <Link to="/" style={{
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--primary-dark)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🛒 ShopHub
          </Link>

          {/* Desktop Menu */}
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            '@media (max-width: 768px)': { display: 'none' }
          }}>
            {role !== 'employee' && (
              <Link to="/" style={navLinkStyle}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ink)'; }}>
                🏠 Trang chủ
              </Link>
            )}

            {role !== 'employee' && role !== 'admin' && (
              <Link to="/products" style={navLinkStyle}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ink)'; }}>
                📦 Sản phẩm
              </Link>
            )}

            {role === 'customer' && (
              <>
                <Link to="/cart" style={navLinkStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ink)'; }}>
                  🛒 Giỏ hàng
                </Link>
                <Link to="/orders" style={navLinkStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ink)'; }}>
                  📋 Đơn hàng
                </Link>
                <Link to="/orders/history" style={navLinkStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ink)'; }}>
                  📜 Lịch sử
                </Link>
                <Link to="/support" style={navLinkStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ink)'; }}>
                  ❓ Hỗ trợ
                </Link>
              </>
            )}

            {role === 'admin' && (
              <>
                <Link to="/admin/products" style={navLinkStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ink)'; }}>
                  📦 Quản lý sản phẩm
                </Link>
                <Link to="/admin/users" style={navLinkStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ink)'; }}>
                  👥 Người dùng
                </Link>
                <Link to="/admin/orders" style={navLinkStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ink)'; }}>
                  📋 Đơn hàng
                </Link>
              </>
            )}

            {role === 'employee' && (
              <Link to="/employee/support" style={navLinkStyle}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ink)'; }}>
                💬 Support Desk
              </Link>
            )}

            <Link to="/chatbot" style={navLinkStyle}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ink)'; }}>
              🤖 Chatbot
            </Link>
          </div>

          {/* User Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link to="/profile" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--ink)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  transition: 'all 0.2s'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary-light)';
                    e.currentTarget.style.color = 'var(--primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--ink)';
                  }}>
                  👤 {user.name || user.email}
                </Link>
                <button onClick={handleLogout} style={{
                  padding: '8px 16px',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary-dark)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}>
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link to="/login" style={{
                  padding: '8px 16px',
                  border: '1px solid var(--primary)',
                  color: 'var(--primary)',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary-light)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}>
                  Đăng nhập
                </Link>
                <Link to="/register" style={{
                  padding: '8px 16px',
                  background: 'var(--primary)',
                  color: 'white',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary-dark)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary)';
                  }}>
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
