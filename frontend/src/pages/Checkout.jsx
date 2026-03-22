import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getStoredUser } from '../services/api.js';

const SHIPPING_FEE_BASE = 30000;

const paymentMethods = [
  { id: 'momo', name: 'Ví MoMo', icon: '📱' },
  { id: 'bank', name: 'Thẻ ngân hàng', icon: '🏦' },
  { id: 'cod', name: 'Thanh toán khi nhận hàng (COD)', icon: '🚚' }
];

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price || 0);
};

const parseJsonSafely = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const normalizeItems = (source) => {
  if (!source || !Array.isArray(source.items)) return [];
  return source.items.map((item) => ({
    product_id: item.product_id || item.productId || item.id || item._id,
    product_name: item.product_name || item.productName || 'Sản phẩm',
    variant: item.variant || item.classification || 'Mặc định',
    price: Number(item.price || 0),
    quantity: Number(item.quantity || 1)
  }));
};

export default function Checkout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const draft = parseJsonSafely(localStorage.getItem('checkoutDraft'), null);
  const selectedOrder = parseJsonSafely(localStorage.getItem('selectedOrder'), null);
  const lastOrder = parseJsonSafely(localStorage.getItem('lastOrder'), null);

  const checkoutSource = draft || selectedOrder || lastOrder;
  const items = normalizeItems(checkoutSource);

  const savedAddresses = parseJsonSafely(localStorage.getItem('savedAddresses'), []);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [addressForm, setAddressForm] = useState({
    recipient_name: '',
    phone: '',
    full_address: ''
  });

  const [method, setMethod] = useState('cod');

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const shippingFee = SHIPPING_FEE_BASE;
  const amountToPay = subtotal + shippingFee;

  const handleAddressChange = (field, value) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectSavedAddress = (id) => {
    setSelectedAddressId(id);
    const found = savedAddresses.find((item) => item.id === id);
    if (!found) return;
    setAddressForm({
      recipient_name: found.recipient_name || '',
      phone: found.phone || '',
      full_address: found.full_address || ''
    });
  };

  const handleSaveAddress = () => {
    if (!addressForm.recipient_name || !addressForm.phone || !addressForm.full_address) {
      setAlert({ type: 'warning', message: 'Vui lòng nhập đủ thông tin nhận hàng trước khi lưu địa chỉ.' });
      return;
    }

    const newAddress = {
      id: String(Date.now()),
      ...addressForm
    };

    const next = [newAddress, ...savedAddresses].slice(0, 5);
    localStorage.setItem('savedAddresses', JSON.stringify(next));
    setSelectedAddressId(newAddress.id);
    setAlert({ type: 'success', message: 'Đã lưu địa chỉ nhận hàng.' });
  };

  const clearPurchasedItemsFromCart = async (userId, orderItems) => {
    const uniqueProductIds = [...new Set(orderItems.map((item) => item.product_id).filter(Boolean))];
    if (uniqueProductIds.length === 0) return;

    await Promise.allSettled(
      uniqueProductIds.map((productId) =>
        api.delete('/cart/remove', { data: { user_id: userId, product_id: productId } })
      )
    );
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setAlert(null);

    const user = getStoredUser();
    if (!user?._id) {
      setAlert({ type: 'danger', message: 'Vui lòng đăng nhập để tiếp tục đặt hàng.' });
      return;
    }

    if (items.length === 0) {
      setAlert({ type: 'warning', message: 'Không có sản phẩm nào để đặt hàng.' });
      return;
    }

    if (!addressForm.recipient_name || !addressForm.phone || !addressForm.full_address) {
      setAlert({ type: 'warning', message: 'Vui lòng nhập đầy đủ tên người nhận, SĐT và địa chỉ.' });
      return;
    }

    setLoading(true);
    try {
      const orderPayload = {
        user_id: user._id,
        items: items.map((item) => ({
          product_id: item.product_id,
          product_name: `${item.product_name} (${item.variant})`,
          price: item.price,
          quantity: item.quantity
        })),
        status: 'pending'
      };

      const orderRes = await api.post('/orders', orderPayload);
      const createdOrder = orderRes.data?.order || orderRes.data;

      await clearPurchasedItemsFromCart(user._id, items);

      await api.post('/payment', {
        order_id: createdOrder?._id,
        user_id: user._id,
        amount: amountToPay,
        method,
        status: method === 'cod' ? 'pending' : 'paid'
      });

      localStorage.removeItem('checkoutDraft');
      localStorage.setItem('lastOrder', JSON.stringify(createdOrder));
      localStorage.setItem('selectedOrder', JSON.stringify(createdOrder));

      setAlert({ type: 'success', message: 'Đặt hàng thành công! Bạn có thể theo dõi đơn trong mục Lịch sử.' });
      setTimeout(() => navigate('/orders/history'), 1200);
    } catch (error) {
      setAlert({ type: 'danger', message: error?.response?.data?.message || 'Đặt hàng thất bại. Vui lòng thử lại.' });
    } finally {
      setLoading(false);
    }
  };

  if (!checkoutSource || items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface-secondary)' }}>
        <div className="container-lg" style={{ paddingTop: '60px' }}>
          <div style={{ backgroundColor: 'var(--surface)', padding: '60px 40px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ color: 'var(--primary-dark)', marginBottom: '12px' }}>Không có sản phẩm để thanh toán</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '24px', fontSize: '16px' }}>
              Vui lòng quay lại giỏ hàng và chọn sản phẩm muốn mua
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
      <div style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border-light)', padding: '12px 0' }}>
        <div className="container-lg">
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
            <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Trang chủ</Link>
            <span style={{ margin: '0 8px' }}>/</span>
            <Link to="/cart" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Giỏ hàng</Link>
            <span style={{ margin: '0 8px' }}>/</span>
            <span style={{ color: 'var(--ink)' }}>Thanh toán</span>
          </div>
        </div>
      </div>

      <div className="container-lg" style={{ paddingTop: '24px', paddingBottom: '40px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px', color: 'var(--primary-dark)' }}>🧾 Xác nhận đơn hàng</h1>
          <p style={{ color: 'var(--muted)', fontSize: '16px', margin: 0 }}>
            Kiểm tra giỏ hàng, nhập địa chỉ và chọn phương thức thanh toán
          </p>
        </div>

        {alert && (
          <div className={`alert alert-${alert.type}`} style={{ marginBottom: '20px' }}>
            {alert.message}
          </div>
        )}

        <form onSubmit={handlePlaceOrder} style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: '8px', padding: '20px', boxShadow: 'var(--shadow)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '16px' }}>4. Kiểm tra giỏ hàng</h3>
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th className="text-center">Phân loại</th>
                      <th className="text-center">Số lượng</th>
                      <th className="text-end">Đơn giá</th>
                      <th className="text-end">Tạm tính</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={`${item.product_id}-${idx}`}>
                        <td>{item.product_name}</td>
                        <td className="text-center">{item.variant}</td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-end">{formatPrice(item.price)}</td>
                        <td className="text-end fw-semibold">{formatPrice(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--surface)', borderRadius: '8px', padding: '20px', boxShadow: 'var(--shadow)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '16px' }}>5. Nhập địa chỉ nhận hàng</h3>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px' }}>Chọn địa chỉ đã lưu (nếu có)</label>
                <select className="form-select" value={selectedAddressId} onChange={(e) => handleSelectSavedAddress(e.target.value)}>
                  <option value="">Chọn địa chỉ đã lưu</option>
                  {savedAddresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.recipient_name} - {address.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px' }}>Tên người nhận</label>
                  <input
                    className="form-control"
                    value={addressForm.recipient_name}
                    onChange={(e) => handleAddressChange('recipient_name', e.target.value)}
                    placeholder="Nhập tên người nhận"
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px' }}>SĐT</label>
                  <input
                    className="form-control"
                    value={addressForm.phone}
                    onChange={(e) => handleAddressChange('phone', e.target.value)}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div className="col-12">
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px' }}>Địa chỉ cụ thể</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={addressForm.full_address}
                    onChange={(e) => handleAddressChange('full_address', e.target.value)}
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                  />
                </div>
              </div>

              <button type="button" className="btn btn-outline-primary mt-3" onClick={handleSaveAddress}>
                Lưu địa chỉ này
              </button>
            </div>

            <div style={{ backgroundColor: 'var(--surface)', borderRadius: '8px', padding: '20px', boxShadow: 'var(--shadow)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '16px' }}>6. Chọn phương thức thanh toán</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {paymentMethods.map((item) => (
                  <label
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      border: method === item.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={item.id}
                      checked={method === item.id}
                      onChange={(e) => setMethod(e.target.value)}
                    />
                    <span style={{ fontSize: '20px' }}>{item.icon}</span>
                    <span>{item.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div style={{ height: 'fit-content' }}>
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: '8px', padding: '20px', boxShadow: 'var(--shadow)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '16px' }}>Tóm tắt thanh toán</h3>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Tạm tính</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Phí vận chuyển</span>
                <span>{formatPrice(shippingFee)}</span>
              </div>

              <hr />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '16px' }}>Tổng tiền</span>
                <span style={{ fontWeight: 700, fontSize: '24px', color: 'var(--primary)' }}>{formatPrice(amountToPay)}</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  marginTop: '16px',
                  padding: '12px 14px',
                  background: loading ? 'var(--border)' : 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Đang xử lý...' : '7. Đặt hàng'}
              </button>

              <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--muted)' }}>
                8. Sau khi đặt, bạn vào Lịch sử để theo dõi trạng thái: Chờ xác nhận, Đang giao, Đã giao.
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
