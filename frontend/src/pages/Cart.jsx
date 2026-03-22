import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getStoredUser } from '../services/api.js';

const extractItems = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.cart?.items)) return data.cart.items;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  return [];
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price || 0);
};

export default function Cart() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const getItemId = (item) => item.product_id || item.productId || item.id || item._id;

  const loadCart = () => {
    const user = getStoredUser();
    if (!user?._id) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    api.get(`/cart/${user._id}`)
      .then((res) => {
        const cartItems = extractItems(res.data);
        setItems(cartItems);
        setSelectedIds(cartItems.map((item) => getItemId(item)).filter(Boolean));
      })
      .catch(() => {
        setItems([]);
        setSelectedIds([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCart();
  }, []);

  const handleUpdate = async (productId, quantity) => {
    setAlert(null);
    const user = getStoredUser();
    if (quantity < 1) {
      setAlert({ type: 'warning', message: 'Số lượng phải >= 1' });
      return;
    }
    try {
      await api.put('/cart/update', { user_id: user._id, product_id: productId, quantity });
      setAlert({ type: 'success', message: '✓ Cập nhật thành công' });
      loadCart();
    } catch (err) {
      setAlert({ type: 'danger', message: 'Cập nhật thất bại' });
    }
  };

  const handleRemove = async (productId) => {
    setAlert(null);
    const user = getStoredUser();
    try {
      await api.delete('/cart/remove', { data: { user_id: user._id, product_id: productId } });
      setSelectedIds((prev) => prev.filter((id) => id !== productId));
      setAlert({ type: 'success', message: '✓ Xóa khỏi giỏ hàng thành công' });
      loadCart();
    } catch (err) {
      setAlert({ type: 'danger', message: 'Xóa thất bại' });
    }
  };

  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedIds.includes(getItemId(item)));
  }, [items, selectedIds]);

  const allSelected = items.length > 0 && selectedItems.length === items.length;

  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(items.map((item) => getItemId(item)).filter(Boolean));
      return;
    }
    setSelectedIds([]);
  };

  const toggleSelectItem = (itemId, checked) => {
    if (!itemId) return;
    if (checked) {
      setSelectedIds((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
      return;
    }
    setSelectedIds((prev) => prev.filter((id) => id !== itemId));
  };

  const total = useMemo(() => {
    return selectedItems.reduce((sum, i) => {
      const price = i.price || 0;
      const qty = i.quantity || 1;
      return sum + price * qty;
    }, 0);
  }, [selectedItems]);

  const handleCheckout = () => {
    if (items.length === 0 || selectedItems.length === 0) {
      setAlert({ type: 'warning', message: 'Vui lòng chọn ít nhất 1 sản phẩm để mua' });
      return;
    }

    const draft = {
      items: selectedItems.map((item) => ({
        product_id: getItemId(item),
        product_name: item.product_name || item.productName || 'Sản phẩm',
        variant: item.variant || item.classification || 'Mặc định',
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 1)
      })),
      createdAt: new Date().toISOString()
    };

    localStorage.setItem('checkoutDraft', JSON.stringify(draft));
    navigate('/checkout');
  };

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
            <Link to="/products" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
              Sản phẩm
            </Link>
            <span style={{ margin: '0 8px' }}>/</span>
            <span style={{ color: 'var(--ink)' }}>Giỏ hàng</span>
          </div>
        </div>
      </div>

      <div className="container-lg" style={{ paddingTop: '24px', paddingBottom: '40px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px', color: 'var(--primary-dark)' }}>
            🛒 Giỏ hàng của bạn
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '16px', margin: 0 }}>
            {items.length} sản phẩm trong giỏ
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
                  : alert.type === 'warning'
                    ? 'rgba(250, 173, 20, 0.1)'
                    : 'rgba(255, 77, 79, 0.1)',
              color:
                alert.type === 'success'
                  ? '#52c41a'
                  : alert.type === 'warning'
                    ? '#faad14'
                    : '#ff4d4f',
              border: `1px solid ${
                alert.type === 'success'
                  ? '#b7eb8f'
                  : alert.type === 'warning'
                    ? '#ffd591'
                    : '#ffccc7'
              }`
            }}
          >
            {alert.message}
          </div>
        )}

        {items.length === 0 ? (
          /* Empty Cart */
          <div
            style={{
              backgroundColor: 'var(--surface)',
              padding: '60px 20px',
              borderRadius: '8px',
              textAlign: 'center',
              boxShadow: 'var(--shadow)'
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛍️</div>
            <h3 style={{ color: 'var(--ink)', marginBottom: '8px' }}>Giỏ hàng trống</h3>
            <p style={{ color: 'var(--muted)', marginBottom: '24px', fontSize: '16px' }}>
              Hãy khám phá các sản phẩm tuyệt vời của chúng tôi
            </p>
            <Link
              to="/products"
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
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          /* Cart Content */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
            {/* Items List */}
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: '8px', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--primary-light)', borderBottom: '2px solid var(--primary-border)' }}>
                      <th style={{ padding: '12px 10px', textAlign: 'center', width: '5%' }}>
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={(e) => toggleSelectAll(e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--primary-dark)', width: '40%' }}>
                        Sản phẩm
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--primary-dark)', width: '20%' }}>
                        Đơn giá
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--primary-dark)', width: '15%' }}>
                        Số lượng
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--primary-dark)', width: '15%' }}>
                        Thành tiền
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--primary-dark)', width: '10%' }}>
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i, idx) => {
                      const id = getItemId(i);
                      const name = i.product_name || i.productName || 'Sản phẩm';
                      const variant = i.variant || i.classification || 'Mặc định';
                      const price = i.price || 0;
                      const qty = i.quantity || 1;
                      const subtotal = price * qty;

                      return (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid var(--border-light)',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-light)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <td style={{ padding: '16px 10px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(id)}
                              onChange={(e) => toggleSelectItem(id, e.target.checked)}
                              style={{ cursor: 'pointer' }}
                            />
                          </td>
                          <td style={{ padding: '16px', fontSize: '14px', fontWeight: 500, color: 'var(--primary-dark)' }}>
                            <div>{name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                              Phân loại: {variant}
                            </div>
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center', color: 'var(--ink)' }}>
                            {formatPrice(price)}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <input
                              type="number"
                              className="form-control"
                              min="1"
                              defaultValue={qty}
                              style={{
                                width: '70px',
                                textAlign: 'center',
                                padding: '6px 4px',
                                fontSize: '14px'
                              }}
                              onBlur={(e) => handleUpdate(id, Number(e.target.value) || 1)}
                            />
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)', fontSize: '16px' }}>
                            {formatPrice(subtotal)}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleRemove(id)}
                              style={{
                                padding: '6px 12px',
                                background: 'rgba(255, 77, 79, 0.1)',
                                color: '#ff4d4f',
                                border: '1px solid rgba(255, 77, 79, 0.3)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 600,
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#ff4d4f';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 77, 79, 0.1)';
                                e.currentTarget.style.color = '#ff4d4f';
                              }}
                            >
                              🗑️ Xóa
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Order Summary */}
              <div style={{ backgroundColor: 'var(--surface)', borderRadius: '8px', padding: '20px', boxShadow: 'var(--shadow)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '16px' }}>
                  Tóm tắt đơn hàng
                </h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ color: 'var(--muted)' }}>Đã chọn:</span>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{selectedItems.length}/{items.length}</span>
                </div>

                <div
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--primary-light)',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    border: '1px solid var(--primary-border)'
                  }}
                >
                  <div style={{ fontSize: '12px', color: 'var(--primary-dark)', marginBottom: '4px' }}>Tổng cộng</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--primary)' }}>
                    {formatPrice(total)}
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginBottom: '8px'
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
                  Đặt hàng
                </button>

                <Link
                  to="/products"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '12px 16px',
                    border: '1px solid var(--primary)',
                    color: 'var(--primary)',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '16px',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary-light)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Tiếp tục mua sắm
                </Link>
              </div>

              {/* Shipping Info */}
              <div style={{ backgroundColor: 'var(--surface)', borderRadius: '8px', padding: '16px', boxShadow: 'var(--shadow)' }}>
                <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '8px' }}>📦 Giao hàng</div>
                <div style={{ fontSize: '13px', color: 'var(--ink)' }}>
                  Giao hàng miễn phí cho đơn hàng từ 100.000 VND
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
