import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';

const statusConfig = {
  pending: { label: 'Cho xac nhan', color: '#faad14', bgColor: '#fffbe6', borderColor: '#ffd591' },
  confirmed: { label: 'Da xac nhan', color: '#1890ff', bgColor: '#e6f7ff', borderColor: '#91d5ff' },
  shipping: { label: 'Dang van chuyen', color: '#13c2c2', bgColor: '#e6fffb', borderColor: '#87e8de' },
  completed: { label: 'Hoan thanh', color: '#52c41a', bgColor: '#f6ffed', borderColor: '#b7eb8f' },
  cancelled: { label: 'Da huy', color: '#ff4d4f', bgColor: '#fff1f0', borderColor: '#ffccc7' }
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
                Lich su don hang
              </h1>
              <p style={{ color: '#999', fontSize: '14px', margin: '4px 0 0 0' }}>
                Quan ly va theo doi cac don hang cua ban
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
                      textAlign: 'right',
                      borderTop: '1px solid #ffe7cc'
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Tong cong</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#ee4d2b' }}>
                      {formatMoney(order.total_price || order.total || 0)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
