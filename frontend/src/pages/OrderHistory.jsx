import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';

const statusConfig = {
  pending: { label: '🟡 Chờ xác nhận', color: '#faad14', bgColor: '#fffbe6', borderColor: '#ffd591' },
  confirmed: { label: '🔵 Đã xác nhận', color: '#1890ff', bgColor: '#e6f7ff', borderColor: '#91d5ff' },
  paid: { label: '💚 Đã thanh toán', color: '#52c41a', bgColor: '#f6ffed', borderColor: '#b7eb8f' },
  shipping: { label: '📦 Đang giao', color: '#13c2c2', bgColor: '#e6fffb', borderColor: '#87e8de' },
  completed: { label: '✓ Hoàn thành', color: '#52c41a', bgColor: '#f6ffed', borderColor: '#b7eb8f' },
  cancelled: { label: '✕ Đã hủy', color: '#ff4d4f', bgColor: '#fff1f0', borderColor: '#ffccc7' }
};

const formatMoney = (value) => {
  const amount = Number(value || 0);
  return `${amount.toLocaleString('vi-VN')} VND`;
};

const extractOrders = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [searchCode, setSearchCode] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    setAlert(null);

    try {
      const res = await api.get('/orders/my');
      setOrders(extractOrders(res.data));
    } catch (err) {
      setOrders([]);

      if (err?.response?.status === 401) {
        setAlert({
          type: 'warning',
          message: 'Phien dang nhap da het han hoac khong hop le. Vui long dang nhap lai de xem lich su don hang.'
        });
      } else {
        setAlert({
          type: 'danger',
          message: err?.response?.data?.message || 'Khong tai duoc lich su don hang.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const keyword = searchCode.trim().toLowerCase();
    if (!keyword) return orders;

    return orders.filter((order) => {
      const orderId = String(order?._id || order?.id || '').toLowerCase();
      return orderId.includes(keyword);
    });
  }, [orders, searchCode]);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedOrder(null), 300);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Bạn chắc chắn muốn hủy đơn hàng này?')) return;
    try {
      setCancelling(true);
      await api.put(`/orders/${orderId}/status`, { status: 'cancelled' });
      setAlert({ type: 'success', message: '✓ Hủy đơn hàng thành công' });
      setTimeout(() => setAlert(null), 3000);
      loadOrders();
      handleCloseModal();
    } catch (err) {
      setAlert({ type: 'danger', message: '❌ Lỗi hủy đơn hàng' });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', paddingTop: '20px' }}>
      <div className="container-lg mb-4">
        <div
          style={{
            background: 'white',
            padding: '20px 24px',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            marginBottom: '24px'
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0, color: '#000' }}>
                Lịch sử đơn hàng
              </h1>
              <p style={{ color: '#999', fontSize: '14px', margin: '4px 0 0 0' }}>
                Quản lý và theo dõi các đơn hàng của bạn
              </p>
            </div>
            <button
              className="btn"
              onClick={loadOrders}
              disabled={loading}
              style={{
                background: loading ? '#e0e0e0' : '#ee4d2b',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Dang tai...' : 'Lam moi'}
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Tim kiem ma don hang..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '4px',
                border: '1px solid #d9d9d9',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#ee4d2b';
                e.target.style.boxShadow = '0 0 0 2px rgba(238,77,43,0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d9d9d9';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {alert && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                backgroundColor: alert.type === 'warning' ? '#fff7e6' : '#fff1f0',
                border: `1px solid ${alert.type === 'warning' ? '#ffd591' : '#ffccc7'}`,
                borderRadius: '4px',
                color: alert.type === 'warning' ? '#b36600' : '#b81c1c',
                fontSize: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>{alert.message}</span>
              {alert.type === 'warning' && (
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    padding: '6px 12px',
                    background: '#faad14',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500,
                    marginLeft: '12px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Dang nhap lai
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="container-lg">
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div
              style={{
                display: 'inline-block',
                width: '40px',
                height: '40px',
                border: '3px solid #f5f5f5',
                borderTop: '3px solid #ee4d2b',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}
            />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <p style={{ marginTop: '12px', color: '#999' }}>Dang tai du lieu...</p>
          </div>
        )}

        {!loading && filteredOrders.length === 0 && (
          <div
            style={{
              background: 'white',
              padding: '60px 20px',
              borderRadius: '8px',
              textAlign: 'center',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
            <p style={{ color: '#999', fontSize: '16px', margin: 0 }}>
              {searchCode ? 'Khong tim thay don hang nao' : 'Ban chua co don hang nao'}
            </p>
            {searchCode && (
              <button
                onClick={() => setSearchCode('')}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  background: '#ee4d2b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Xoa bo loc
              </button>
            )}
          </div>
        )}

        {!loading && filteredOrders.length > 0 && (
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
            {filteredOrders.map((order) => {
              const orderId = order?._id || order?.id;
              const status = order.status || 'pending';
              const config = statusConfig[status] || statusConfig.pending;
              const itemCount = Array.isArray(order?.items)
                ? order.items.reduce((sum, item) => sum + Number(item?.quantity || 0), 0)
                : 0;

              return (
                <div
                  key={orderId}
                  style={{
                    background: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: '1px solid #f0f0f0'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Ma don hang</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#000', wordBreak: 'break-all' }}>
                        {orderId}
                      </div>
                    </div>
                    <div
                      style={{
                        background: config.bgColor,
                        color: config.color,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: `1px solid ${config.borderColor}`,
                        whiteSpace: 'nowrap',
                        marginLeft: '8px'
                      }}
                    >
                      {config.label}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#999', marginBottom: '2px' }}>Ngay dat hang</div>
                      <div style={{ fontSize: '13px', color: '#000' }}>
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#999', marginBottom: '2px' }}>Gio</div>
                      <div style={{ fontSize: '13px', color: '#000' }}>
                        {new Date(order.createdAt).toLocaleTimeString('vi-VN')}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#999' }}>So san pham</span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#000' }}>{itemCount} san pham</span>
                    </div>
                    {Array.isArray(order?.items) && order.items.length > 0 && (
                      <div style={{ fontSize: '12px', color: '#666', background: '#fafafa', padding: '8px', borderRadius: '4px' }}>
                        {order.items.slice(0, 2).map((item, idx) => (
                          <div key={idx} style={{ marginBottom: idx < 1 ? '4px' : 0 }}>
                            {item.product_name || item.name || 'San pham'} x{item.quantity}
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div style={{ color: '#999' }}>+{order.items.length - 2} san pham khac</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      background: '#fff9f0',
                      padding: '12px',
                      borderRadius: '4px',
                      borderTop: '1px solid #ffe7cc'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Tông cộng</div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#ee4d2b' }}>
                          {formatMoney(order.total_price || order.total || 0)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button
                        onClick={() => handleViewDetails(order)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: '#ee4d2b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 600
                        }}
                      >
                        Xem chi tiết
                      </button>
                      {order.status !== 'cancelled' && order.status !== 'completed' && (
                        <button
                          onClick={() => handleCancelOrder(order._id || order.id)}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            background: '#ff4d4f',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 600
                          }}
                        >
                          Hủy đơn
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#fafafa'
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#000' }}>
                📋 Chi tiết đơn hàng
              </h2>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#999'
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
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#666', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Thông tin cơ bản
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '12px', backgroundColor: '#fafafa', borderRadius: '6px' }}>
                      <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>Mã đơn hàng</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#ee4d2b' }}>
                        {(selectedOrder._id || selectedOrder.id)?.slice(-12)}
                      </div>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: '#fafafa', borderRadius: '6px' }}>
                      <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>Trạng thái</div>
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: statusConfig[selectedOrder.status]?.bgColor || '#f0f0f0',
                        color: statusConfig[selectedOrder.status]?.color || '#999',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'inline-block'
                      }}>
                        {statusConfig[selectedOrder.status]?.label || 'Không xác định'}
                      </span>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: '#fafafa', borderRadius: '6px' }}>
                      <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>Tên khách hàng</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#000' }}>
                        {selectedOrder.customer_name || '—'}
                      </div>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: '#fafafa', borderRadius: '6px' }}>
                      <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>Ngày đặt</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#000' }}>
                        {new Date(selectedOrder.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Danh sách sản phẩm */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#666', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Sản phẩm
                  </h3>
                  <div style={{ backgroundColor: '#fafafa', borderRadius: '6px', overflow: 'hidden' }}>
                    {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: '#f0f0f0' }}>
                            <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#000' }}>Sản phẩm</th>
                            <th style={{ padding: '10px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#000' }}>SL</th>
                            <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#000' }}>Giá</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: idx < selectedOrder.items.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                              <td style={{ padding: '10px', fontSize: '13px', color: '#000' }}>
                                {item.product_name || item.name || 'Sản phẩm'}
                              </td>
                              <td style={{ padding: '10px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#000' }}>
                                {item.quantity}
                              </td>
                              <td style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#ee4d2b' }}>
                                {formatMoney(item.price || 0)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#999', fontSize: '13px' }}>
                        Không có sản phẩm
                      </div>
                    )}
                  </div>
                </div>

                {/* Tóm tắt tiền */}
                <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#fff9f0', borderRadius: '6px', border: '1px solid #ffe7cc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#000' }}>Tổng tiền:</span>
                    <span style={{ fontSize: '20px', fontWeight: 700, color: '#ee4d2b' }}>
                      {formatMoney(selectedOrder.total_price || selectedOrder.total || 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              backgroundColor: '#fafafa'
            }}>
              {selectedOrder && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'completed' && (
                <button
                  onClick={() => handleCancelOrder(selectedOrder._id || selectedOrder.id)}
                  disabled={cancelling}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#ff4d4f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: cancelling ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                    opacity: cancelling ? 0.6 : 1
                  }}
                >
                  {cancelling ? '⏳ Đang hủy...' : 'Hủy đơn hàng'}
                </button>
              )}
              <button
                onClick={handleCloseModal}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#f0f0f0',
                  color: '#000',
                  border: '1px solid #d9d9d9',
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
    </div>
  );
}
