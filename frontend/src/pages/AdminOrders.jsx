import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({ keyword: '', status: '', page: 1, pageSize: 10 });
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  const statusOptions = ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { bg: 'rgba(250, 173, 20, 0.1)', text: '#faad14', label: '🟡 Chờ xác nhận' };
      case 'confirmed':
        return { bg: 'rgba(24, 144, 255, 0.1)', text: 'var(--primary)', label: '🔵 Đã xác nhận' };
      case 'shipping':
        return { bg: 'rgba(24, 144, 255, 0.1)', text: 'var(--primary)', label: '📦 Đang giao' };
      case 'completed':
        return { bg: 'rgba(82, 196, 26, 0.1)', text: '#52c41a', label: '✓ Hoàn thành' };
      case 'cancelled':
        return { bg: 'rgba(255, 77, 79, 0.1)', text: '#ff4d4f', label: '✕ Đã hủy' };
      default:
        return { bg: 'rgba(130, 130, 130, 0.1)', text: '#828282', label: '⚪ Không xác định' };
    }
  };

  const formatMoney = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: filters.page,
        limit: filters.pageSize,
        ...(filters.keyword && { q: filters.keyword }),
        ...(filters.status && { status: filters.status })
      });
      const response = await api.get(`/orders/admin?${params}`);
      const data = response.data || {};
      const items = Array.isArray(data.items) ? data.items : [];
      setOrders(items);
      setMeta({
        total: Number(data.total || items.length),
        totalPages: Number(data.totalPages || 1)
      });
      setError('');
    } catch (err) {
      setError('❌ Lỗi tải danh sách đơn hàng');
      setOrders([]);
      setMeta({ total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.put(`/orders/admin/${id}/status`, { status: newStatus });
      setSuccess('✓ Cập nhật trạng thái thành công');
      setTimeout(() => setSuccess(''), 3000);
      fetchOrders();
    } catch (err) {
      setError('❌ Lỗi cập nhật trạng thái');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa đơn hàng này?')) return;
    try {
      await api.delete(`/orders/admin/${id}`);
      setSuccess('✓ Xóa đơn hàng thành công');
      setTimeout(() => setSuccess(''), 3000);
      fetchOrders();
    } catch (err) {
      setError('❌ Lỗi xóa đơn hàng');
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, page: 1 });
  };

  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
  };

  const total = meta.total || orders.length;
  const totalPages = meta.totalPages || Math.ceil(total / filters.pageSize) || 1;

  return (
    <div style={{ padding: '20px' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '20px' }}>
        <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Trang chủ</Link> / <span>Quản lý đơn hàng</span>
      </div>

      {/* Alerts */}
      {error && <div style={{ padding: '12px 16px', backgroundColor: 'rgba(255, 77, 79, 0.1)', color: '#ff4d4f', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
      {success && <div style={{ padding: '12px 16px', backgroundColor: 'rgba(82, 196, 26, 0.1)', color: '#52c41a', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>{success}</div>}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>📋 Quản lý đơn hàng</h1>
      </div>

      {/* Filter Form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px', padding: '16px', backgroundColor: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
        <input
          type="text"
          placeholder="Tìm kiếm (ID/Sản phẩm)"
          value={filters.keyword}
          onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
          style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '13px' }}
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '13px' }}
        >
          <option value="">Tất cả trạng thái</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>{getStatusColor(s).label}</option>
          ))}
        </select>
        <select
          value={filters.pageSize}
          onChange={(e) => setFilters({ ...filters, pageSize: parseInt(e.target.value), page: 1 })}
          style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '13px' }}
        >
          <option value="5">5 mục/trang</option>
          <option value="10">10 mục/trang</option>
          <option value="20">20 mục/trang</option>
        </select>
        <button
          onClick={handleSearch}
          style={{ padding: '8px 16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
        >
          🔍 Tìm kiếm
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--primary)' }}>{total}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Tổng cộng</div>
        </div>
        <div style={{ padding: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#faad14' }}>
            {orders.filter((o) => o.status?.toLowerCase() === 'pending').length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Chờ xác nhận</div>
        </div>
        <div style={{ padding: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--primary)' }}>
            {orders.filter((o) => ['confirmed', 'shipping'].includes(o.status?.toLowerCase())).length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Đang giao</div>
        </div>
        <div style={{ padding: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#52c41a' }}>
            {orders.filter((o) => o.status?.toLowerCase() === 'completed').length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Hoàn thành</div>
        </div>
      </div>

      {/* Orders Table */}
      <div style={{ overflowX: 'auto', backgroundColor: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>⏳ Đang tải...</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Không có đơn hàng nào</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--primary-light)', borderBottom: '2px solid var(--primary)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '13px' }}>Mã đơn</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '13px' }}>Khách</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '13px' }}>Tổng tiền</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '13px' }}>Trạng thái</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '13px' }}>Ngày</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '13px' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const statusColor = getStatusColor(o.status);
                return (
                  <tr
                    key={o._id || o.id}
                    style={{
                      borderBottom: '1px solid var(--border-light)',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary-light)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>
                      {(o._id || o.id)?.slice(-8)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      {o.user_id?.slice(-6) || '—'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--primary)' }}>
                      {formatMoney(o.total_price || o.total || 0)} đ
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '4px 8px', backgroundColor: statusColor.bg, color: statusColor.text, borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                        {statusColor.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', color: 'var(--muted)' }}>
                      {new Date(o.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <select
                          value={o.status}
                          onChange={(e) => handleUpdateStatus(o._id || o.id, e.target.value)}
                          style={{
                            padding: '6px 10px',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            backgroundColor: 'white',
                            color: 'var(--text)'
                          }}
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>
                              {getStatusColor(s).label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleDelete(o._id || o.id)}
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#ff4d4f',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                          title="Xóa đơn hàng"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
        <button
          onClick={() => handlePageChange(1)}
          disabled={filters.page === 1}
          style={{
            padding: '8px 12px',
            backgroundColor: filters.page === 1 ? 'var(--surface)' : 'var(--primary)',
            color: filters.page === 1 ? 'var(--muted)' : 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: filters.page === 1 ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: 600
          }}
        >
          ⬅ Đầu
        </button>
        <button
          onClick={() => handlePageChange(filters.page - 1)}
          disabled={filters.page === 1}
          style={{
            padding: '8px 12px',
            backgroundColor: filters.page === 1 ? 'var(--surface)' : 'var(--primary)',
            color: filters.page === 1 ? 'var(--muted)' : 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: filters.page === 1 ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: 600
          }}
        >
          ← Trước
        </button>
        <div style={{ padding: '8px 16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
          {filters.page} / {totalPages}
        </div>
        <button
          onClick={() => handlePageChange(filters.page + 1)}
          disabled={filters.page === totalPages}
          style={{
            padding: '8px 12px',
            backgroundColor: filters.page === totalPages ? 'var(--surface)' : 'var(--primary)',
            color: filters.page === totalPages ? 'var(--muted)' : 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: filters.page === totalPages ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: 600
          }}
        >
          Tiếp →
        </button>
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={filters.page === totalPages}
          style={{
            padding: '8px 12px',
            backgroundColor: filters.page === totalPages ? 'var(--surface)' : 'var(--primary)',
            color: filters.page === totalPages ? 'var(--muted)' : 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: filters.page === totalPages ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: 600
          }}
        >
          Cuối ⬆
        </button>
      </div>
    </div>
  );
};

export default AdminOrders;

