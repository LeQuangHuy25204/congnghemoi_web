import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getStoredUser } from '../services/api.js';

const gatewayBaseUrl = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
const productMediaBaseUrl = import.meta.env.VITE_PRODUCT_MEDIA_BASE_URL || 'http://localhost:5002';

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

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price || 0);
};

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    let active = true;
    api.get('/products')
      .then((res) => {
        if (!active) return;
        const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setProducts(data);
      })
      .catch(() => {
        if (!active) return;
        setProducts([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleAddToCart = async (product) => {
    setAlert(null);
    const user = getStoredUser();
    if (!user?._id) {
      setAlert({ type: 'warning', message: 'Vui lòng đăng nhập để thêm vào giỏ hàng' });
      return;
    }
    try {
      await api.post('/cart/add', {
        user_id: user._id,
        product_id: product.id || product._id,
        product_name: product.name || product.title,
        price: product.price || 0,
        quantity: 1
      });
      setAlert({ type: 'success', message: '✓ Thêm vào giỏ hàng thành công' });
      setTimeout(() => setAlert(null), 2000);
    } catch (err) {
      setAlert({ type: 'danger', message: 'Thêm vào giỏ hàng thất bại' });
    }
  };

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const pName = (p.name || p.title || '').toLowerCase();
      const pCategory = (p.category || '').toLowerCase();
      const pBrand = (p.brand || '').toLowerCase();
      return pName.includes(q) || pCategory.includes(q) || pBrand.includes(q);
    });
  }, [products, query]);

  const handleSearch = () => {
    setQuery(queryInput);
  };

  const handleReset = () => {
    setQueryInput('');
    setQuery('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

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
            <span style={{ color: 'var(--ink)' }}>Danh sách sản phẩm</span>
          </div>
        </div>
      </div>

      <div className="container-lg" style={{ paddingTop: '24px', paddingBottom: '40px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px', color: 'var(--primary-dark)' }}>
            📦 Danh sách sản phẩm
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '16px', margin: 0 }}>
            Khám phá bộ sưu tập sản phẩm chất lượng cao của chúng tôi
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
              }`,
              animation: 'slideInDown 0.3s ease'
            }}
          >
            {alert.message}
          </div>
        )}

        {/* Search & Filter Bar */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '24px',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}
        >
          <input
            className="form-control"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="🔍 Tìm kiếm sản phẩm, danh mục..."
            style={{ flex: '1 1 250px', minWidth: '200px' }}
          />
          <button
            className="btn btn-primary"
            onClick={handleSearch}
            style={{ padding: '8px 24px', whiteSpace: 'nowrap' }}
          >
            Tìm kiếm
          </button>
          <button
            className="btn"
            onClick={handleReset}
            style={{
              padding: '8px 24px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--ink)',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            Đặt lại
          </button>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--muted)' }}>
              {filteredProducts.length} sản phẩm
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '6px 12px',
                  border: viewMode === 'grid' ? '1px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: viewMode === 'grid' ? 'var(--primary-light)' : 'transparent',
                  color: viewMode === 'grid' ? 'var(--primary)' : 'var(--muted)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ⊞ Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '6px 12px',
                  border: viewMode === 'list' ? '1px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: viewMode === 'list' ? 'var(--primary-light)' : 'transparent',
                  color: viewMode === 'list' ? 'var(--primary)' : 'var(--muted)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ≡ List
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
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
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <p style={{ marginTop: '16px', color: 'var(--muted)' }}>Đang tải sản phẩm...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            style={{
              backgroundColor: 'var(--surface)',
              padding: '60px 20px',
              borderRadius: '8px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <p style={{ fontSize: '18px', color: 'var(--ink)', marginBottom: '8px' }}>
              Không tìm thấy sản phẩm nào
            </p>
            <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>
              Hãy thử tìm kiếm với từ khóa khác
            </p>
            <button
              onClick={handleReset}
              style={{
                padding: '10px 24px',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px'
            }}
          >
            {filteredProducts.map((p) => (
              <div
                key={p.id || p._id}
                style={{
                  backgroundColor: 'var(--surface)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Image */}
                <div style={{ position: 'relative', overflow: 'hidden', height: '240px', backgroundColor: 'var(--surface-light)' }}>
                  {p.image ? (
                    <img
                      src={resolveImageUrl(p.image)}
                      alt={p.name || p.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                      📷 No Image
                    </div>
                  )}
                  {p.category && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      {p.category}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h5
                    style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--primary-dark)',
                      marginBottom: '8px',
                      lineHeight: '1.4',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {p.name || p.title}
                  </h5>
                  <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 12px 0', flex: 1 }}>
                    {p.description ? p.description.slice(0, 60) + '...' : 'Không có mô tả'}
                  </p>

                  {/* Price */}
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: 'var(--surface-light)',
                      borderRadius: '6px',
                      marginBottom: '12px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '4px' }}>Giá</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary)' }}>
                      {formatPrice(p.price || 0)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link
                      to={`/products/${p.id || p._id}`}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: '1px solid var(--primary)',
                        color: 'var(--primary)',
                        textAlign: 'center',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--primary-light)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      Chi tiết
                    </Link>
                    <button
                      onClick={() => handleAddToCart(p)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--primary-dark)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--primary)';
                      }}
                    >
                      🛒 Thêm
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '8px', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--primary-light)', borderBottom: '2px solid var(--primary-border)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--primary-dark)' }}>
                      Sản phẩm
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--primary-dark)' }}>
                      Danh mục
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--primary-dark)' }}>
                      Giá
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--primary-dark)' }}>
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr
                      key={p.id || p._id}
                      style={{
                        borderBottom: '1px solid var(--border-light)',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-light)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '16px', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {p.image && (
                            <img
                              src={resolveImageUrl(p.image)}
                              alt={p.name}
                              style={{
                                width: '48px',
                                height: '48px',
                                objectFit: 'cover',
                                borderRadius: '4px'
                              }}
                            />
                          )}
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary-dark)' }}>
                              {p.name || p.title}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                              {p.description ? p.description.slice(0, 50) : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
                        {p.category || 'N/A'}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)', fontSize: '16px' }}>
                        {formatPrice(p.price || 0)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <Link
                            to={`/products/${p.id || p._id}`}
                            style={{
                              padding: '6px 12px',
                              border: '1px solid var(--primary)',
                              color: 'var(--primary)',
                              borderRadius: '4px',
                              textDecoration: 'none',
                              fontSize: '12px',
                              fontWeight: 600
                            }}
                          >
                            Chi tiết
                          </Link>
                          <button
                            onClick={() => handleAddToCart(p)}
                            style={{
                              padding: '6px 12px',
                              background: 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Thêm
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
