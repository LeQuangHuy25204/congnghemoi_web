import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getStoredUser } from '../services/api.js';

const SHIPPING_FEE_BASE = 30000;

const paymentMethods = [
  { id: 'bank', name: 'Thẻ ngân hàng / VietQR', icon: '🏦' },
  { id: 'cod', name: 'Thanh toán khi nhận hàng (COD)', icon: '🚚' }
];

const paymentStatusMap = {
  pending: 'Chờ thanh toán',
  processing: 'Đang xử lý',
  paid: 'Đã thanh toán',
  failed: 'Thất bại',
  cancelled: 'Đã hủy',
  expired: 'Hết hạn',
  refunded: 'Đã hoàn tiền'
};

const bankNameMap = {
  '970418': 'BIDV',
  '970422': 'MB Bank',
  '970415': 'VietinBank',
  '970436': 'Vietcombank',
  '970416': 'ACB'
};

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price || 0);

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

const getOrderId = (source) => source?._id || source?.id || '';

const isSettledPayment = (payment) => ['paid', 'cancelled', 'failed', 'expired', 'refunded'].includes(payment?.status);

const normalizePaymentFromResponse = (payload) => payload?.payment || payload || null;

const mapPaymentMethodToView = (value) => {
  if (value === 'vietqr') return 'bank';
  if (value === 'payos') return 'momo';
  return value || 'cod';
};

const getBankDisplayName = (bankCode) => bankNameMap[String(bankCode || '').trim()] || bankCode || '-';

export default function Checkout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [paymentAlert, setPaymentAlert] = useState(null);
  const [existingPayment, setExistingPayment] = useState(null);

  const draft = parseJsonSafely(localStorage.getItem('checkoutDraft'), null);
  const selectedOrder = parseJsonSafely(localStorage.getItem('selectedOrder'), null);
  const lastOrder = parseJsonSafely(localStorage.getItem('lastOrder'), null);

  const checkoutSource = draft || selectedOrder || lastOrder;
  const items = normalizeItems(checkoutSource);
  const orderId = getOrderId(checkoutSource);
  const hasExistingOrder = Boolean(orderId);

  const savedAddresses = parseJsonSafely(localStorage.getItem('savedAddresses'), []);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [addressForm, setAddressForm] = useState({
    recipient_name: '',
    phone: '',
    full_address: ''
  });

  const [method, setMethod] = useState('cod');

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const shippingFee = SHIPPING_FEE_BASE;
  const amountToPay = subtotal + shippingFee;

  const refreshVietQr = async (paymentId, silent = false) => {
    if (!paymentId) return null;

    if (!silent) {
      setPaymentLoading(true);
      setPaymentAlert(null);
    }

    try {
      const res = await api.get(`/payment/${paymentId}/vietqr`);
      const payment = normalizePaymentFromResponse(res.data);
      setExistingPayment(payment);
      return payment;
    } catch (error) {
      if (!silent) {
        setPaymentAlert(error?.response?.data?.message || 'Không lấy được VietQR.');
      }
      return null;
    } finally {
      if (!silent) {
        setPaymentLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!orderId) {
      setExistingPayment(null);
      return;
    }

    let ignore = false;

    const loadExistingPayment = async () => {
      setPaymentLoading(true);
      setPaymentAlert(null);
      try {
        const res = await api.get('/payment', {
          params: {
            order_id: orderId,
            limit: 1
          }
        });

        if (ignore) return;
        const payment = Array.isArray(res.data?.items) ? res.data.items[0] || null : null;
        setExistingPayment(payment);
        if (payment?.method) {
          setMethod(mapPaymentMethodToView(payment.method));
        }

        const needsQr =
          payment?._id &&
          (payment?.provider === 'vietqr' || payment?.method === 'vietqr' || payment?.method === 'bank') &&
          !payment?.qr_image_url &&
          !payment?.qr_data_url;

        if (needsQr) {
          await refreshVietQr(payment._id, true);
        }
      } catch (error) {
        if (!ignore) {
          setExistingPayment(null);
          setPaymentAlert(error?.response?.data?.message || 'Không tải được thông tin thanh toán.');
        }
      } finally {
        if (!ignore) {
          setPaymentLoading(false);
        }
      }
    };

    loadExistingPayment();
    return () => {
      ignore = true;
    };
  }, [orderId]);

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

  const persistOrderSelection = (order) => {
    localStorage.removeItem('checkoutDraft');
    localStorage.setItem('lastOrder', JSON.stringify(order));
    localStorage.setItem('selectedOrder', JSON.stringify(order));
  };

  const createOrReuseOrder = async (user) => {
    if (hasExistingOrder) {
      return checkoutSource;
    }

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
    persistOrderSelection(createdOrder);
    return createdOrder;
  };

  const handleCreatePayment = async (targetOrderId, userId) => {
    const paymentRes = await api.post('/payment', {
      order_id: targetOrderId,
      user_id: userId,
      amount: amountToPay,
      method,
      status: method === 'cod' ? 'pending' : 'processing',
      items: items.map((item) => ({
        name: item.product_name,
        quantity: item.quantity,
        price: Math.round(item.price)
      })),
      buyer_name: addressForm.recipient_name,
      buyer_phone: addressForm.phone,
      description: `Thanh toán ${String(targetOrderId).slice(-8)}`
    });

    const payment = normalizePaymentFromResponse(paymentRes.data);
    setExistingPayment(payment);
    return payment;
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
      setAlert({ type: 'warning', message: 'Không có sản phẩm nào để thanh toán.' });
      return;
    }

    if (!addressForm.recipient_name || !addressForm.phone || !addressForm.full_address) {
      setAlert({ type: 'warning', message: 'Vui lòng nhập đầy đủ tên người nhận, SĐT và địa chỉ.' });
      return;
    }

    setLoading(true);
    try {
      const order = await createOrReuseOrder(user);
      const payment = await handleCreatePayment(getOrderId(order), user._id);

      if (payment?.checkout_url) {
        window.location.href = payment.checkout_url;
        return;
      }

      if (method === 'bank' && payment?._id && !payment?.qr_image_url && !payment?.qr_data_url) {
        await refreshVietQr(payment._id, true);
      }

      if (method === 'cod') {
        setAlert({ type: 'success', message: 'Đơn hàng đã được tạo. Bạn có thể theo dõi trong Lịch sử đơn hàng.' });
        setTimeout(() => navigate('/orders/history'), 1200);
        return;
      }

      setAlert({
        type: 'success',
        message: method === 'bank'
          ? 'Đã tạo VietQR. Vui lòng quét mã bên dưới để thanh toán.'
          : 'Đã tạo yêu cầu thanh toán.'
      });
    } catch (error) {
      setAlert({ type: 'danger', message: error?.response?.data?.message || 'Đặt hàng hoặc tạo thanh toán thất bại. Vui lòng thử lại.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshQr = async () => {
    await refreshVietQr(existingPayment?._id);
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

  const showPaymentResult = existingPayment && !isSettledPayment(existingPayment) && existingPayment.method !== 'cod';
  const statusLabel = paymentStatusMap[existingPayment?.status] || (existingPayment?.status || 'Chưa tạo');
  const hasQr = Boolean(existingPayment?.qr_image_url || existingPayment?.qr_data_url);
  const qrWarningMessage =
    paymentAlert ||
    existingPayment?.metadata?.integration_message ||
    'Chưa lấy được mã QR. Hãy bấm Tải lại VietQR để thử lại sau khi kiểm tra cấu hình backend.';

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
          <h1 style={{ fontSize: '32px', marginBottom: '8px', color: 'var(--primary-dark)' }}>Xác nhận đơn hàng</h1>
          <p style={{ color: 'var(--muted)', fontSize: '16px', margin: 0 }}>
            {showPaymentResult ? 'Thông tin thanh toán cho đơn hàng của bạn' : 'Kiểm tra giỏ hàng, nhập địa chỉ và chọn phương thức thanh toán'}
          </p>
        </div>

        {alert && (
          <div className={`alert alert-${alert.type}`} style={{ marginBottom: '20px' }}>
            {alert.message}
          </div>
        )}

        {paymentAlert && (
          <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
            {paymentAlert}
          </div>
        )}

        <form onSubmit={handlePlaceOrder} style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: '8px', padding: '20px', boxShadow: 'var(--shadow)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '16px' }}>Đơn hàng</h3>
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
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '16px' }}>Địa chỉ nhận hàng</h3>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px' }}>Chọn địa chỉ đã lưu</label>
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
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '16px' }}>
                {showPaymentResult ? 'Thông tin thanh toán' : 'Chọn phương thức thanh toán'}
              </h3>

              {!showPaymentResult && (
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
              )}

              {showPaymentResult && (
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '14px',
                      background: 'var(--surface-secondary)'
                    }}
                  >
                    <div><strong>Trạng thái:</strong> {statusLabel}</div>
                    <div><strong>Phương thức:</strong> {existingPayment?.provider || existingPayment?.method}</div>
                    {existingPayment?.order_code ? <div><strong>Mã PayOS:</strong> {existingPayment.order_code}</div> : null}
                  </div>

                  {paymentLoading && !hasQr && (
                    <div className="alert alert-info" style={{ marginBottom: 0 }}>
                      Đang tải mã QR thanh toán...
                    </div>
                  )}

                  {hasQr && (
                    <div
                      style={{
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '16px',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: '12px' }}>Mã VietQR</div>
                      {existingPayment.qr_image_url ? (
                        <img
                          src={existingPayment.qr_image_url}
                          alt="VietQR"
                          style={{ width: '100%', maxWidth: '320px', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                        />
                      ) : null}
                      {existingPayment.qr_data_url ? (
                        <div style={{ marginTop: '12px', wordBreak: 'break-all', fontSize: '12px', color: 'var(--muted)' }}>
                          {existingPayment.qr_data_url}
                        </div>
                      ) : null}
                      <div style={{ marginTop: '12px', fontSize: '14px' }}>
                        <div><strong>Ngân hàng:</strong> {getBankDisplayName(existingPayment.acq_id)}</div>
                        <div><strong>Số tài khoản:</strong> {existingPayment.account_no || '-'}</div>
                        <div><strong>Tên tài khoản:</strong> {existingPayment.account_name || '-'}</div>
                      </div>
                      <button type="button" className="btn btn-outline-primary mt-3" onClick={handleRefreshQr} disabled={paymentLoading}>
                        {paymentLoading ? 'Đang tải QR...' : 'Tải lại VietQR'}
                      </button>
                    </div>
                  )}

                  {!paymentLoading && !hasQr && (existingPayment?.provider === 'vietqr' || existingPayment?.method === 'vietqr' || method === 'bank') && (
                    <div className="alert alert-warning" style={{ marginBottom: 0 }}>
                      {qrWarningMessage}
                    </div>
                  )}

                  {existingPayment?.checkout_url && (
                    <a
                      href={existingPayment.checkout_url}
                      style={{
                        display: 'inline-block',
                        textAlign: 'center',
                        padding: '12px 14px',
                        background: 'var(--primary)',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        fontWeight: 700
                      }}
                    >
                      Mở cổng thanh toán
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ height: 'fit-content' }}>
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: '8px', padding: '20px', boxShadow: 'var(--shadow)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '16px' }}>Tóm tắt thanh toán</h3>

              {hasExistingOrder && (
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
                  Mã đơn hàng: <strong>{orderId}</strong>
                </div>
              )}

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

              {!showPaymentResult && (
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
                  {loading
                    ? 'Đang xử lý...'
                    : hasExistingOrder
                      ? 'Thanh toán đơn hàng này'
                      : 'Đặt hàng và thanh toán'}
                </button>
              )}

              {showPaymentResult && (
                <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--muted)' }}>
                  Nếu bạn đã chuyển khoản, hãy refresh trạng thái sau khi giao dịch hoàn tất.
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
