import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getStoredUser, setStoredUser } from '../services/api.js';

export default function Profile() {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', shippingAddress: '' });

  const syncForm = (nextUser) => {
    setForm({
      name: nextUser?.name || '',
      email: nextUser?.email || '',
      phone: nextUser?.phone || '',
      shippingAddress: nextUser?.shippingAddress || ''
    });
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/auth/verify');
        const nextUser = res.data?.user || res.data || null;
        if (nextUser) {
          setUser(nextUser);
          setStoredUser(nextUser);
          syncForm(nextUser);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể tải hồ sơ người dùng.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.put('/auth/me', form);
      const updatedUser = res.data?.user || null;
      if (updatedUser) {
        setUser(updatedUser);
        setStoredUser(updatedUser);
        syncForm(updatedUser);
      }
      setSuccess('✓ Hồ sơ đã được cập nhật thành công.');
      setEditMode(false);
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Cập nhật hồ sơ thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const canEditProfile = user?.role === 'customer';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            display: 'inline-block',
            width: '50px',
            height: '50px',
            border: '4px solid var(--border-light)',
            borderTop: '4px solid var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface-secondary)' }}>
      {/* Breadcrumb */}
      <div style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border-light)', padding: '12px 0' }}>
        <div className="container-lg">
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
            <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
              Trang chủ
            </Link>
            <span style={{ margin: '0 8px' }}>/</span>
            <span style={{ color: 'var(--ink)' }}>Hồ sơ</span>
          </div>
        </div>
      </div>

      <div className="container-lg" style={{ paddingTop: '32px', paddingBottom: '40px' }}>
        {/* Alerts */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '24px',
              backgroundColor: 'rgba(255, 77, 79, 0.1)',
              color: '#ff4d4f',
              border: '1px solid #ffccc7'
            }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '24px',
              backgroundColor: 'rgba(82, 196, 26, 0.1)',
              color: '#52c41a',
              border: '1px solid #b7eb8f'
            }}
          >
            {success}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
          {/* Sidebar */}
          <div>
            <div style={{
              backgroundColor: 'var(--surface)',
              borderRadius: '8px',
              boxShadow: 'var(--shadow)',
              overflow: 'hidden',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{
                padding: '20px',
                backgroundColor: 'var(--primary-light)',
                borderBottom: '1px solid var(--border)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>👤</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-dark)' }}>
                  {user?.name || 'Người dùng'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '4px' }}>
                  {user?.role === 'admin' ? '👑 Quản trị viên' : user?.role === 'employee' ? '👔 Nhân viên' : '👤 Khách hàng'}
                </div>
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{
                  padding: '12px',
                  backgroundColor: user?.isActive !== false ? 'rgba(82, 196, 26, 0.1)' : 'rgba(255, 77, 79, 0.1)',
                  borderRadius: '6px',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: user?.isActive !== false ? '#52c41a' : '#ff4d4f'
                }}>
                  {user?.isActive !== false ? '✓ Tài khoản hoạt động' : '🔒 Tài khoản bị khóa'}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
                Thông tin cá nhân
              </h1>
              {canEditProfile && !editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary-dark)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  ✏️ Chỉnh sửa
                </button>
              )}
            </div>

            {/* Profile Sections */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Personal Info Card */}
              <div style={{
                backgroundColor: 'var(--surface)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow)',
                border: '1px solid var(--border-light)',
                padding: '20px'
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', marginBottom: '16px', textTransform: 'uppercase' }}>
                  👤 Thông tin cá nhân
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Name */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>
                      Họ và tên
                    </label>
                    {editMode && canEditProfile ? (
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          fontSize: '14px',
                          marginTop: '4px'
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)', marginTop: '4px' }}>
                        {user?.name || '—'}
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>
                      Email
                    </label>
                    {editMode && canEditProfile ? (
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          fontSize: '14px',
                          marginTop: '4px'
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)', marginTop: '4px' }}>
                        {user?.email || '—'}
                      </div>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>
                      Số điện thoại
                    </label>
                    {editMode && canEditProfile ? (
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          fontSize: '14px',
                          marginTop: '4px'
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)', marginTop: '4px' }}>
                        {user?.phone || '—'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Info Card */}
              <div style={{
                backgroundColor: 'var(--surface)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow)',
                border: '1px solid var(--border-light)',
                padding: '20px'
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', marginBottom: '16px', textTransform: 'uppercase' }}>
                  🔐 Thông tin tài khoản
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Role */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>
                      Vai trò
                    </label>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: 'var(--primary)',
                      marginTop: '4px',
                      textTransform: 'capitalize'
                    }}>
                      {user?.role === 'admin' ? '👑 Quản trị viên' : user?.role === 'employee' ? '👔 Nhân viên' : '👤 Khách hàng'}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>
                      Trạng thái
                    </label>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: user?.isActive !== false ? '#52c41a' : '#ff4d4f',
                        marginTop: '4px'
                      }}
                    >
                      {user?.isActive !== false ? '✓ Hoạt động' : '🔒 Bị khóa'}
                    </div>
                  </div>

                  {/* Member Since */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>
                      Tham gia từ
                    </label>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)', marginTop: '4px' }}>
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address Card */}
            <div style={{
              backgroundColor: 'var(--surface)',
              borderRadius: '8px',
              boxShadow: 'var(--shadow)',
              border: '1px solid var(--border-light)',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', marginBottom: '16px', textTransform: 'uppercase' }}>
                📍 Địa chỉ giao hàng
              </h3>
              {editMode && canEditProfile ? (
                <textarea
                  name="shippingAddress"
                  value={form.shippingAddress}
                  onChange={handleChange}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              ) : (
                <div style={{
                  fontSize: '15px',
                  color: 'var(--ink)',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {user?.shippingAddress || '—'}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {editMode && canEditProfile && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                    opacity: saving ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) {
                      e.currentTarget.style.backgroundColor = 'var(--primary-dark)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saving) {
                      e.currentTarget.style.backgroundColor = 'var(--primary)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {saving ? '⏳ Đang lưu...' : '✓ Lưu thay đổi'}
                </button>
                <button
                  onClick={() => {
                    syncForm(user);
                    setEditMode(false);
                    setError('');
                  }}
                  disabled={saving}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--primary)',
                    border: '1px solid var(--primary)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}
                >
                  ✕ Hủy
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
