import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { getStoredUser } from '../services/api.js';

const gatewayBaseUrl = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
const productMediaBaseUrl = import.meta.env.VITE_PRODUCT_MEDIA_BASE_URL || 'http://localhost:5002';

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price || 0);
};

const resolveImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://') ||
    imagePath.startsWith('data:')
  ) {
    return imagePath;
  }

  if (imagePath.startsWith('/img/') || imagePath.startsWith('img/')) {
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${productMediaBaseUrl}${normalizedPath}`;
  }

  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${gatewayBaseUrl}${normalizedPath}`;
};

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let active = true;
    api.get(`/products/${id}`)
      .then((res) => {
        if (!active) return;
        setProduct(res.data);
      })
      .catch(() => {
        if (!active) return;
        setProduct(null);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleAddToCart = async () => {
    setAlert(null);
    const user = getStoredUser();
    if (!user?._id) {
      setAlert({ type: 'warning', message: 'Vui lòng đăng nhập để thêm vào giỏ hàng' });
      return;
    }
    if (!product) {
      setAlert({ type: 'danger', message: 'Sản phẩm không tồn tại' });
      return;
    }
    try {
      await api.post('/cart/add', {
        user_id: user._id,
        product_id: product.id || product._id,
        product_name: product.name || product.title,
        price: product.price || 0,
        quantity: quantity
      });
      setAlert({ type: 'success', message: `✓ Đã thêm ${quantity} sản phẩm vào giỏ hàng` });
      setTimeout(() => setAlert(null), 2000);
    } catch (err) {
      setAlert({ type: 'danger', message: 'Thêm vào giỏ hàng thất bại' });
    }
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

  if (!product) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface-secondary)' }}>
        <div className="container-lg" style={{ paddingTop: '60px' }}>
          <div style={{ backgroundColor: 'var(--surface)', padding: '60px 40px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <h2 style={{ color: 'var(--primary-dark)', marginBottom: '12px' }}>Không tìm thấy sản phẩm</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>Sản phẩm bạn tìm kiếm không tồn tại.</p>
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
              Quay lại danh sách sản phẩm
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
            <Link to="/products" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
              Sản phẩm
            </Link>
            <span style={{ margin: '0 8px' }}>/</span>
            <span style={{ color: 'var(--ink)' }}>Chi tiết</span>
          </div>
        </div>
      </div>

      <div className="container-lg" style={{ paddingTop: '32px', paddingBottom: '40px' }}>
        {/* Alert */}
        {alert && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '24px',
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', '@media (max-width: 768px)': { gridTemplateColumns: '1fr' } }}>
          {/* Product Image */}
          <div>
            <div style={{
              backgroundColor: 'var(--surface)',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow)',
              marginBottom: '16px'
            }}>
              {product.image ? (
                <img
                  src={resolveImageUrl(product.image)}
                  alt={product.name || product.title}
                  style={{
                    width: '100%',
                    height: '500px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              ) : (
                <div style={{
                  height: '500px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--surface-light)',
                  fontSize: '64px'
                }}>
                  📷
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div>
            {/* Category */}
            {product.category && (
              <div style={{ marginBottom: '12px' }}>
                <span style={{
                  display: 'inline-block',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  {product.category}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 style={{
              fontSize: '32px',
              fontWeight: 700,
              color: 'var(--primary-dark)',
              marginBottom: '16px',
              lineHeight: '1.4'
            }}>
              {product.name || product.title}
            </h1>

            {/* Rating */}
            <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>⭐⭐⭐⭐⭐</span>
                <span style={{ color: 'var(--muted)', fontSize: '14px' }}>(45 đánh giá)</span>
              </div>
            </div>

            {/* Price */}
            <div style={{
              padding: '20px',
              backgroundColor: 'var(--primary-light)',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '14px', color: 'var(--primary-dark)', marginBottom: '8px' }}>
                💰 Giá hiện tại
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: 700,
                color: 'var(--primary)',
                marginBottom: '4px'
              }}>
                {formatPrice(product.price || 0)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--primary-dark)' }}>
                Giao hàng miễn phí cho đơn từ 100.000 VND
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '12px' }}>
                📝 Mô tả sản phẩm
              </h3>
              <p style={{
                color: 'var(--ink)',
                lineHeight: '1.6',
                fontSize: '14px'
              }}>
                {product.description || 'Không có mô tả chi tiết.'}
              </p>
            </div>

            {/* Stock Info */}
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'var(--surface-light)',
              borderRadius: '8px',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>📦 Kho hàng</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--success)' }}>
                  Còn hàng
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Bán được</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>
                  {Math.floor(Math.random() * 100) + 50}+ đơn
                </div>
              </div>
            </div>

            {/* Quantity & Add to Cart */}
            <div style={{
              backgroundColor: 'var(--surface)',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: 'var(--shadow)',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--primary-dark)',
                  marginBottom: '8px'
                }}>
                  Số lượng
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '16px'
                    }}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    style={{
                      width: '60px',
                      textAlign: 'center',
                      padding: '8px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '16px'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
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
                🛒 Thêm vào giỏ hàng
              </button>
            </div>

            {/* Link back */}
            <Link
              to="/products"
              style={{
                display: 'inline-block',
                marginTop: '16px',
                color: 'var(--primary)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              ← Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
