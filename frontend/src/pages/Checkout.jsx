import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { getStoredUser } from '../services/api.js';

const getPaidIds = () => {
  try {
    const raw = localStorage.getItem('paidOrderIds');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const addPaidId = (id) => {
  const current = getPaidIds();
  if (!current.includes(id)) {
    const next = [...current, id];
    localStorage.setItem('paidOrderIds', JSON.stringify(next));
  }
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price || 0);
};

const paymentMethods = [
  { id: 'momo', name: 'Momo', icon: '📱', description: 'Thanh toán qua ví Momo' },
  { id: 'cod', name: 'Thanh toán khi nhận hàng', icon: '🚚', description: 'COD - Giao hàng và thu tiền' },
  { id: 'bank', name: 'Chuyển khoản ngân hàng', icon: '🏦', description: 'Chuyển khoản trực tiếp' }
];

export default function Checkout() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ method: 'momo' });
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const selected = localStorage.getItem('selectedOrder');
  const stored = localStorage.getItem('lastOrder');
  const order = selected ? JSON.parse(selected) : stored ? JSON.parse(stored) : null;

  const amount = useMemo(() => {
    if (!order) return 0;
    if (order.total_price) return order.total_price;
    if (order.total) return order.total;
    if (Array.isArray(order.items)) {
      return order.items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);
    }
    return 0;
  }, [order]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectMethod = (methodId) => {
    setForm((prev) => ({ ...prev, method: methodId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);
    try {
      const user = getStoredUser();
      if (!user?._id || !order?._id) {
        setAlert({ type: 'danger', message: 'Thiếu thông tin đơn hàng' });
        setLoading(false);
        return;
      }
      await api.post('/payment', {
        order_id: order._id,
        user_id: user._id,
        amount,
        method: form.method,
        status: 'pending'
      });
      addPaidId(order._id);
      localStorage.removeItem('lastOrder');
      localStorage.removeItem('selectedOrder');
      window.dispatchEvent(new CustomEvent('orderPaid', { detail: { orderId: order._id } }));
      setAlert({ type: 'success', message: '✓ Thanh toán thành công!' });
      setTimeout(() => navigate('/orders'), 1500);
    } catch (err) {
      setAlert({ type: 'danger', message: 'Thanh toán thất bại. Vui lòng thử lại.' });
    } finally {
      setLoading(false);
    }
  };

  if (!order) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface-secondary)' }}>
        <div className="container-lg" style={{ paddingTop: '60px' }}>
          <div style={{ backgroundColor: 'var(--surface)', padding: '60px 40px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ color: 'var(--primary-dark)', marginBottom: '12px' }}>Không có đơn hàng nào</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '24px', fontSize: '16px' }}>
              Vui lòng tạo đơn hàng trước khi thanh toán
            </p>
            <Link
              to="/cart"
              style={{
                display: 'inline-block',
                padding: '12px 32px',
                background: 'var(--primary)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: 600
              }}
            >
              Quay lại giỏ hàng
            </Link>
          </div>
        </div>
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
            <Link to="/cart" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
              Giỏ hàng
            </Link>
            <span style={{ margin: '0 8px' }}>/</span>
            <span style={{ color: 'var(--ink)' }}>Thanh toán</span>
          </div>
        </div>
      </div>

      <div className="container-lg" style={{ paddingTop: '24px', paddingBottom: '40px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px', color: 'var(--primary-dark)' }}>
            💳 Thanh toán
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '16px', margin: 0 }}>
            Hoàn tất thanh toán cho đơn hàng của bạn
          </p>
        </div>

        {/* Progress Steps */}
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {[
            { step: 1, label: 'Giỏ hàng', status: 'completed' },
            { step: 2, label: 'Thanh toán', status: 'active' },
            { step: 3, label: 'Hoàn thành', status: 'pending' }
          ].map((item, idx) => (
            <div key={item.step} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,

                  backgroundColor:
                    item.status === 'completed'
                      ? 'var(--success)'
                      : item.status === 'active'
                        ? 'var(--primary)'
                        : 'var(--border)',
                  color:
                    item.status === 'pending' ? 'var(--muted)' : 'white'
                }}
              >
                {item.status === 'completed' ? '✓' : item.step}
              </div>
              <div style={{ marginLeft: '12px', fontSize: '14px', fontWeight: 500, color: item.status === 'pending' ? 'var(--muted)' : 'var(--ink)' }}>
                {item.label}
              </div>
              {idx < 2 && (
                <div style={{ flex: 1, height: '2px', marginLeft: '12px', backgroundColor: item.status === 'pending' ? 'var(--border)' : 'var(--success)' }} />
              )}
            </div>
          ))}
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
          {/* Payment Methods */}
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '8px', padding: '24px', boxShadow: 'var(--shadow)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '20px' }}>
              Chọn phương thức thanh toán
            </h3>

            <div style={{ display: 'grid', gap: '12px' }}>
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  onClick={() => handleSelectMethod(method.id)}
                  style={{
                    padding: '16px',
                    border: form.method === method.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: form.method === method.id ? 'var(--primary-light)' : 'var(--surface)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (form.method !== method.id) {
                      e.currentTarget.style.borderColor = 'var(--primary-border)';
                      e.currentTarget.style.backgroundColor = 'var(--surface-light)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (form.method !== method.id) {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.backgroundColor = 'var(--surface)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '28px' }}>{method.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--primary-dark)' }}>
                        {method.name}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>
                        {method.description}
                      </div>
                    </div>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: '2px solid',
                        borderColor: form.method === method.id ? 'var(--primary)' : 'var(--border)',
                        backgroundColor: form.method === method.id ? 'var(--primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {form.method === method.id && (
                        <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>✓</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ marginTop: '24px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: loading ? 'var(--border)' : 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
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
                {loading ? '⏳ Đang xử lý...' : '✓ Xác nhận thanh toán'}
              </button>
            </form>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <Link
                to="/cart"
                style={{
                  fontSize: '14px',
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                ← Quay lại giỏ hàng
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div style={{ height: 'fit-content' }}>
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: '8px', padding: '20px', boxShadow: 'var(--shadow)', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '16px' }}>
                Đơn hàng
              </h3>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--muted)', fontSize: '14px' }}>Mã đơn:</span>
                <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '13px' }}>
                  {order._id ? order._id.slice(-8) : 'N/A'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--muted)', fontSize: '14px' }}>Số sản phẩm:</span>
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                  {Array.isArray(order.items) ? order.items.length : 0}
                </span>
              </div>

              <div
                style={{
                  padding: '14px',
                  backgroundColor: 'var(--primary-light)',
                  borderRadius: '6px',
                  border: '1px solid var(--primary-border)'
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--primary-dark)', marginBottom: '4px' }}>
                  Tổng tiền
                </div>
                <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--primary)' }}>
                  {formatPrice(amount)}
                </div>
              </div>

              <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--muted)' }}>
                ✓ Tất cả thông tin đơn hàng đã được xác nhận
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
