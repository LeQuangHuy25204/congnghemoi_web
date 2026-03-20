import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', shippingAddress: '' });
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      setAlert({ type: 'success', message: '✓ Đăng ký thành công! Chuyển hướng tới đăng nhập...' });
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setAlert({ type: 'danger', message: 'Đăng ký thất bại. Hãy thử lại.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface-secondary)', display: 'flex', alignItems: 'stretch' }}>
      {/* Left Side - Illustration */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        color: 'white',
        '@media (max-width: 768px)': { display: 'none' }
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '80px', marginBottom: '24px' }}>🎉</div>
          <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '16px', color: 'white' }}>
            Chào mừng
          </h2>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.8)', marginBottom: '32px' }}>
            Tham gia cộng đồng mua sắm của chúng tôi ngay hôm nay
          </p>
          <ul style={{ textAlign: 'left', fontSize: '16px', color: 'rgba(255,255,255,0.9)' }}>
            <li style={{ marginBottom: '12px' }}>✓ Mua sắm dễ dàng và nhanh chóng</li>
            <li style={{ marginBottom: '12px' }}>✓ Quản lý đơn hàng của bạn</li>
            <li style={{ marginBottom: '12px' }}>✓ Nhận ưu đãi độc quyền</li>
            <li>✓ Hỗ trợ khách hàng 24/7</li>
          </ul>
        </div>
      </div>

      {/* Right Side - Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px'
      }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '8px' }}>
              Đăng ký tài khoản
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
              Tạo tài khoản mới để bắt đầu mua sắm
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
                }`
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
              {/* Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--primary-dark)',
                  marginBottom: '6px'
                }}>
                  👤 Họ và tên
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Nguyễn Văn A"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--ink)',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--primary-dark)',
                  marginBottom: '6px'
                }}>
                  📧 Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--ink)',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--primary-dark)',
                  marginBottom: '6px'
                }}>
                  🔑 Mật khẩu
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      paddingRight: '40px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      color: 'var(--muted)',
                      padding: '0'
                    }}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {/* Phone */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--primary-dark)',
                  marginBottom: '6px'
                }}>
                  📱 Số điện thoại
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="0901234567"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--ink)',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                />
              </div>

              {/* Address */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--primary-dark)',
                  marginBottom: '6px'
                }}>
                  📍 Địa chỉ giao hàng
                </label>
                <textarea
                  name="shippingAddress"
                  value={form.shippingAddress}
                  onChange={handleChange}
                  placeholder="Số nhà, đường phố, phường/xã, quận/huyện, thành phố"
                  rows={3}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--ink)',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                />
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
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = 'var(--primary-dark)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = 'var(--primary)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {loading ? '⏳ Đang tạo tài khoản...' : '✓ Đăng ký'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '0' }}>
              Đã có tài khoản?{' '}
              <Link to="/login" style={{
                color: 'var(--primary)',
                textDecoration: 'none',
                fontWeight: 600
              }}>
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
