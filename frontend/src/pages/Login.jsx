import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { normalizeUser, setStoredUser } from '../services/api.js';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSubmit(e);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      const token = res.data?.token || res.data?.accessToken;
      if (token) {
        localStorage.setItem('token', token);
      }

      let user = normalizeUser(res.data?.user || res.data?.data || null);
      if (!user && token) {
        try {
          const verify = await api.get('/auth/verify');
          user = normalizeUser(verify.data?.user || verify.data || null);
        } catch {
          user = null;
        }
      }

      if (!user) {
        user = { email: form.email, role: 'customer', _id: 'unknown' };
      }

      setStoredUser(user);
      setAlert({ type: 'success', message: '✓ Đăng nhập thành công!' });
      setTimeout(() => navigate(user.role === 'admin' ? '/admin/users' : '/'), 500);
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Đăng nhập thất bại' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '8px' }}>
            Đăng nhập
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '16px' }}>
            Vào tài khoản của bạn để tiếp tục
          </p>
        </div>

        {/* Alert */}
        {alert && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              backgroundColor:
                alert.type === 'success'
                  ? 'rgba(82, 196, 26, 0.1)'
                  : 'rgba(255, 77, 79, 0.1)',
              color:
                alert.type === 'success'
                  ? '#52c41a'
                  : '#ff4d4f',
              border: `1px solid ${
                alert.type === 'success'
                  ? '#b7eb8f'
                  : '#ffccc7'
              }`,
              animation: 'slideInDown 0.3s ease'
            }}
          >
            {alert.message}
          </div>
        )}

        {/* Form Card */}
        <div style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-light)'
        }}>
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--primary-dark)',
                marginBottom: '8px'
              }}>
                📧 Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                placeholder="your@email.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--ink)',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(24, 144, 255, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--primary-dark)',
                marginBottom: '8px'
              }}>
                🔑 Mật khẩu
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    paddingRight: '44px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--ink)',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(24, 144, 255, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: 'var(--muted)',
                    padding: '0'
                  }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: loading ? 'var(--border)' : 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                marginTop: '8px'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = 'var(--primary-dark)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {loading ? '⏳ Đang đăng nhập...' : '✓ Đăng nhập'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '12px' }}>
            Chưa có tài khoản?
          </p>
          <Link to="/register" style={{
            display: 'inline-block',
            padding: '12px 24px',
            border: '1px solid var(--primary)',
            color: 'var(--primary)',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary-light)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}>
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
