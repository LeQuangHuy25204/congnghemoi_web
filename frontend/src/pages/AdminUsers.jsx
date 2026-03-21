import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    shippingAddress: '',
    role: 'customer'
  });

  const roleOptions = ['customer', 'employee', 'admin'];

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return '👑 Admin';
      case 'employee': return '👔 Nhân viên';
      case 'customer': return '👤 Khách hàng';
      default: return role;
    }
  };

  const getStatusColor = (active) => {
    return active ? '#52c41a' : '#ff4d4f';
  };

  const getStatusLabel = (active) => {
    return active ? '✓ Hoạt động' : '✕ Khóa';
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/users');
      setUsers(response.data?.users || []);
      setError('');
    } catch (err) {
      setError('❌ Lỗi tải danh sách người dùng');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingId(user._id);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      phone: user.phone || '',
      shippingAddress: user.shippingAddress || '',
      role: user.role || 'customer'
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', email: '', password: '', phone: '', shippingAddress: '', role: 'customer' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('❌ Vui lòng điền tên và email');
      return;
    }

    if (!editingId && !formData.password.trim()) {
      setError('❌ Vui lòng nhập mật khẩu');
      return;
    }

    try {
      const payload = { ...formData };
      if (!payload.password) {
        delete payload.password;
      }

      if (editingId) {
        await api.put(`/auth/users/${editingId}`, payload);
        setSuccess('✓ Cập nhật người dùng thành công');
      } else {
        await api.post('/auth/users', payload);
        setSuccess('✓ Thêm người dùng thành công');
      }
      setTimeout(() => setSuccess(''), 3000);
      handleCancel();
      fetchUsers();
    } catch (err) {
      setError('❌ ' + (err.response?.data?.message || 'Lỗi lưu người dùng'));
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xác nhận xóa người dùng "${name}"?`)) return;
    try {
      await api.delete(`/auth/users/${id}`);
      setSuccess('✓ Xóa người dùng thành công');
      setTimeout(() => setSuccess(''), 3000);
      fetchUsers();
    } catch (err) {
      setError('❌ Lỗi xóa người dùng');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await api.patch(`/auth/users/${user._id}/status`, { isActive: !user.isActive });
      setSuccess(`✓ ${user.isActive ? 'Khóa' : 'Kích hoạt'} người dùng thành công`);
      setTimeout(() => setSuccess(''), 3000);
      fetchUsers();
    } catch (err) {
      setError('❌ Lỗi cập nhật trạng thái');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '20px' }}>
        <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Trang chủ</Link> / <span>Quản lý người dùng</span>
      </div>

      {/* Alerts */}
      {error && <div style={{ padding: '12px 16px', backgroundColor: 'rgba(255, 77, 79, 0.1)', color: '#ff4d4f', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
      {success && <div style={{ padding: '12px 16px', backgroundColor: 'rgba(82, 196, 26, 0.1)', color: '#52c41a', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>{success}</div>}

      {/* Header with Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>👥 Quản lý người dùng</h1>
        <button
          onClick={() => (showForm ? handleCancel() : setShowForm(true))}
          style={{
            padding: '10px 16px',
            backgroundColor: showForm ? 'var(--muted)' : 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px'
          }}
        >
          {showForm ? '✕ Đóng form' : '+ Thêm người dùng'}
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          padding: '24px',
          backgroundColor: 'var(--primary-light)',
          borderRadius: '8px',
          border: '2px solid var(--primary)',
          marginBottom: '24px'
        }}>
          <input
            type="text"
            name="name"
            placeholder="Họ tên"
            value={formData.name}
            onChange={handleInputChange}
            style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '13px' }}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '13px' }}
          />
          <input
            type="password"
            name="password"
            placeholder={editingId ? 'Mật khẩu (để trống nếu không đổi)' : 'Mật khẩu'}
            value={formData.password}
            onChange={handleInputChange}
            style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '13px' }}
          />
          <input
            type="text"
            name="phone"
            placeholder="Số điện thoại"
            value={formData.phone}
            onChange={handleInputChange}
            style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '13px' }}
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '13px' }}
          >
            {roleOptions.map((r) => (
              <option key={r} value={r}>{getRoleLabel(r)}</option>
            ))}
          </select>
          <textarea
            name="shippingAddress"
            placeholder="Địa chỉ giao hàng"
            value={formData.shippingAddress}
            onChange={handleInputChange}
            rows="2"
            style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '13px', gridColumn: 'span 2' }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px'
              }}
            >
              ✓ {editingId ? 'Cập nhật' : 'Thêm'}
            </button>
            <button
              onClick={handleCancel}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: 'var(--muted)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px'
              }}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div style={{ overflowX: 'auto', backgroundColor: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>⏳ Đang tải...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Không có người dùng nào</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--primary-light)', borderBottom: '2px solid var(--primary)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '13px' }}>Tên</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '13px' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '13px' }}>Điện thoại</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '13px' }}>Vai trò</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '13px' }}>Trạng thái</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '13px' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user._id}
                  style={{
                    borderBottom: '1px solid var(--border-light)',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary-light)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '12px', fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                    {user.name}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px' }}>
                    {user.email}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: 'var(--muted)' }}>
                    {user.phone || '—'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '4px 8px', backgroundColor: 'rgba(24, 144, 255, 0.1)', color: 'var(--primary)', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '4px 8px', backgroundColor: `rgba(${user.isActive ? '82, 196, 26' : '255, 77, 79'}, 0.1)`, color: getStatusColor(user.isActive), borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                      {getStatusLabel(user.isActive)}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleEdit(user)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        title="Chỉnh sửa"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: user.isActive ? '#faad14' : '#52c41a',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        title={user.isActive ? 'Khóa' : 'Kích hoạt'}
                      >
                        {user.isActive ? '🔓' : '🔒'}
                      </button>
                      <button
                        onClick={() => handleDelete(user._id, user.name)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#ff4d4f',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        title="Xóa"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
