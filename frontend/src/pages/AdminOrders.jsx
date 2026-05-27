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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [tempStatus, setTempStatus] = useState('');

  const statusOptions = ['pending', 'confirmed', 'paid', 'shipping', 'completed', 'cancelled'];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { bg: 'rgba(250, 173, 20, 0.1)', text: '#faad14', label: '🟡 Chờ xác nhận' };
      case 'confirmed':
        return { bg: 'rgba(24, 144, 255, 0.1)', text: 'var(--primary)', label: '🔵 Đã xác nhận' };
      case 'paid':
        return { bg: 'rgba(82, 196, 26, 0.1)', text: '#52c41a', label: '💚 Đã thanh toán' };
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

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setTempStatus(order.status);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTimeout(() => {
      setSelectedOrder(null);
      setTempStatus('');
      setUpdatingStatus(false);
    }, 300);
  };

  const handleUpdateStatusInModal = async () => {
    if (tempStatus === selectedOrder.status) {
      setError('Trạng thái mới phải khác trạng thái hiện tại');
      return;
    }
    try {
      setUpdatingStatus(true);
      await api.put(`/orders/admin/${selectedOrder._id || selectedOrder.id}/status`, { status: tempStatus });
      setSuccess('✓ Cập nhật trạng thái thành công');
      setTimeout(() => setSuccess(''), 3000);
      setSelectedOrder({ ...selectedOrder, status: tempStatus });
      fetchOrders();
    } catch (err) {
      setError('❌ Lỗi cập nhật trạng thái');
    } finally {
      setUpdatingStatus(false);
    }
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
          placeholder="Mã đơn hàng"
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
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }} onClick={() => handleViewDetails(o)}>
                      <span style={{ textDecoration: 'underline' }}>
                        {(o._id || o.id)?.slice(-8)}
                      </span>
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

      {/* Modal Chi tiết đơn hàng */}
      {showModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease'
          }}
          onClick={handleCloseModal}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '85vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'slideUp 0.3s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--primary-light)',
              borderRadius: '12px 12px 0 0'
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--primary-dark)' }}>
                📋 Chi tiết đơn hàng
              </h2>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--muted)'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            {selectedOrder && (
              <div style={{ padding: '24px' }}>
                {/* Thông tin cơ bản */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Thông tin cơ bản
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '12px', backgroundColor: 'var(--surface)', borderRadius: '6px' }}>
                      <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>Mã đơn hàng</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)' }}>
                        {(selectedOrder._id || selectedOrder.id)?.slice(-8)}
                      </div>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: 'var(--surface)', borderRadius: '6px' }}>
                      <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>Trạng thái</div>
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: getStatusColor(selectedOrder.status).bg,
                        color: getStatusColor(selectedOrder.status).text,
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}>
                        {getStatusColor(selectedOrder.status).label}
                      </span>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: 'var(--surface)', borderRadius: '6px' }}>
                      <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>Tên khách hàng</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#000' }}>
                        {selectedOrder.customer_name || selectedOrder.user_id?.slice(-6) || '—'}
                      </div>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: 'var(--surface)', borderRadius: '6px' }}>
                      <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>Ngày đặt</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#000' }}>
                        {new Date(selectedOrder.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Danh sách sản phẩm */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#666', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Sản phẩm
                  </h3>
                  <div style={{ backgroundColor: 'var(--surface)', borderRadius: '6px', overflow: 'hidden' }}>
                    {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--primary-light)' }}>
                            <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#000' }}>Sản phẩm</th>
                            <th style={{ padding: '10px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#000' }}>SL</th>
                            <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#000' }}>Giá</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: idx < selectedOrder.items.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                              <td style={{ padding: '10px', fontSize: '13px', color: '#000' }}>
                                {item.product_name || `Sản phẩm ${item.product_id?.slice(-4)}`}
                              </td>
                              <td style={{ padding: '10px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#000' }}>
                                {item.quantity}
                              </td>
                              <td style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>
                                {formatMoney(item.price || 0)} đ
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                        Không có sản phẩm
                      </div>
                    )}
                  </div>
                </div>

                {/* Tóm tắt tiền */}
                <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'rgba(249, 115, 22, 0.1)', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text)' }}>Tổng tiền:</span>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)' }}>
                      {formatMoney(selectedOrder.total_price || selectedOrder.total || 0)} đ
                    </span>
                  </div>
                </div>

                {/* Cập nhật trạng thái */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#666', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Cập nhật trạng thái
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <select
                      value={tempStatus}
                      onChange={(e) => setTempStatus(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        fontSize: '13px',
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
                      onClick={handleUpdateStatusInModal}
                      disabled={updatingStatus}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: updatingStatus ? 'var(--muted)' : 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: updatingStatus ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        fontSize: '13px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {updatingStatus ? '⏳ Cập nhật...' : '💾 Cập nhật'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              backgroundColor: 'var(--surface)',
              borderRadius: '0 0 12px 12px'
            }}>
              <button
                onClick={handleCloseModal}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px'
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
        </button>
      </div>
    </div>
  );
};

export default AdminOrders;

