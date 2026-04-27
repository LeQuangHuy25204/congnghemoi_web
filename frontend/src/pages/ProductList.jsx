import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { getStoredUser } from '../services/api.js';
import WelcomeHero from '../components/WelcomeHero.jsx';

const gatewayBaseUrl = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
const productMediaBaseUrl = import.meta.env.VITE_PRODUCT_MEDIA_BASE_URL || gatewayBaseUrl;

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

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price || 0);

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const getCategoryMeta = (category) => {
  const normalized = normalizeText(category);

  if (normalized.includes('iphone')) {
    return {
      title: 'Khu iPhone',
      description: 'Tập trung các mẫu iPhone theo cùng nhóm để người dùng so sánh nhanh.',
      accent: '#c2410c',
      surface: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)'
    };
  }

  if (normalized.includes('ipad') || normalized.includes('tablet')) {
    return {
      title: 'Khu máy tính bảng',
      description: 'Nhóm tablet dành cho học tập, giải trí và làm việc di động.',
      accent: '#ea580c',
      surface: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)'
    };
  }

  if (normalized.includes('bàn phím') || normalized.includes('keyboard')) {
    return {
      title: 'Khu bàn phím',
      description: 'Các mẫu bàn phím được gom thành một cụm riêng để dễ chọn theo nhu cầu làm việc và giải trí.',
      accent: '#f97316',
      surface: 'linear-gradient(135deg, #fff7ed 0%, #fdba74 100%)'
    };
  }

  if (
    normalized.includes('tai nghe') ||
    normalized.includes('phụ kiện') ||
    normalized.includes('accessor')
  ) {
    return {
      title: 'Khu phụ kiện',
      description: 'Tai nghe, sạc và phụ kiện đi kèm được tách thành một cụm riêng.',
      accent: '#c2410c',
      surface: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)'
    };
  }

  return {
    title: 'Khu điện thoại',
    description: 'Các mẫu smartphone được gom chung theo danh mục và lọc thêm theo hãng.',
    accent: '#ea580c',
    surface: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)'
  };
};

const buildGroupedProducts = (items) =>
  Array.from(
    items.reduce((map, product) => {
      const category = product.category || 'Khác';
      if (!map.has(category)) map.set(category, []);
      map.get(category).push(product);
      return map;
    }, new Map())
  )
    .map(([category, products]) => {
      const sortedProducts = [...products].sort((a, b) => (b.price || 0) - (a.price || 0));
      const brands = Array.from(new Set(products.map((item) => item.brand).filter(Boolean)));

      return {
        category,
        products: sortedProducts,
        brands,
        meta: getCategoryMeta(category)
      };
    })
    .sort((a, b) => b.products.length - a.products.length);

function ProductCard({ product, accent, onAddToCart }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '22px',
        overflow: 'hidden',
        background: '#ffffff',
        border: '1px solid rgba(148,163,184,0.18)',
        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)'
      }}
    >
      <div
        style={{
          position: 'relative',
          height: '220px',
          background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)'
        }}
      >
        {product.image ? (
          <img
            src={resolveImageUrl(product.image)}
            alt={product.name || product.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div
            style={{
              height: '100%',
              display: 'grid',
              placeItems: 'center',
              color: '#64748b',
              fontWeight: 600
            }}
          >
            Không có ảnh
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            top: '14px',
            left: '14px',
            padding: '7px 12px',
            borderRadius: '999px',
            background: '#fffffff2',
            color: accent,
            fontSize: '12px',
            fontWeight: 700
          }}
        >
          {product.brand || product.category || 'Sản phẩm'}
        </div>
      </div>

      <div style={{ padding: '18px', display: 'grid', gap: '12px', flex: 1 }}>
        <div>
          <div
            style={{
              minHeight: '52px',
              fontSize: '17px',
              fontWeight: 700,
              lineHeight: 1.5,
              color: '#0f172a'
            }}
          >
            {product.name || product.title}
          </div>
          <div style={{ marginTop: '8px', color: '#64748b', fontSize: '14px', lineHeight: 1.7 }}>
            {product.description
              ? `${product.description.slice(0, 88)}${product.description.length > 88 ? '...' : ''}`
              : 'Thông tin mô tả đang được cập nhật.'}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            borderRadius: '16px',
            background: '#f8fafc'
          }}
        >
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Giá bán</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: accent }}>
              {formatPrice(product.price || 0)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Tồn kho</div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{product.stock ?? 0}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            to={`/products/${product.id || product._id}`}
            style={{
              flex: 1,
              textDecoration: 'none',
              textAlign: 'center',
              padding: '12px 14px',
              borderRadius: '14px',
              border: `1px solid ${accent}55`,
              color: accent,
              fontWeight: 700
            }}
          >
            Xem chi tiết
          </Link>
          <button
            onClick={() => onAddToCart(product)}
            style={{
              flex: 1,
              padding: '12px 14px',
              borderRadius: '14px',
              border: 'none',
              background: accent,
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Thêm vào giỏ
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductRow({ product, accent, onAddToCart }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '120px minmax(0, 1fr) auto',
        gap: '16px',
        alignItems: 'center',
        padding: '16px',
        borderRadius: '20px',
        background: '#ffffff',
        border: '1px solid rgba(148,163,184,0.18)'
      }}
    >
      <div
        style={{
          height: '96px',
          borderRadius: '16px',
          overflow: 'hidden',
          background: '#e2e8f0'
        }}
      >
        {product.image ? (
          <img
            src={resolveImageUrl(product.image)}
            alt={product.name || product.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : null}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <span
            style={{
              padding: '6px 10px',
              borderRadius: '999px',
              background: `${accent}15`,
              color: accent,
              fontSize: '12px',
              fontWeight: 700
            }}
          >
            {product.category || 'Danh mục'}
          </span>
          {product.brand && (
            <span
              style={{
                padding: '6px 10px',
                borderRadius: '999px',
                background: '#f1f5f9',
                color: '#334155',
                fontSize: '12px',
                fontWeight: 700
              }}
            >
              {product.brand}
            </span>
          )}
        </div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', lineHeight: 1.5 }}>
          {product.name || product.title}
        </div>
        <div style={{ marginTop: '8px', color: '#64748b', fontSize: '14px', lineHeight: 1.7 }}>
          {product.description
            ? `${product.description.slice(0, 110)}${product.description.length > 110 ? '...' : ''}`
            : 'Thông tin mô tả đang được cập nhật.'}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '10px', justifyItems: 'end' }}>
        <div style={{ fontSize: '22px', fontWeight: 800, color: accent }}>
          {formatPrice(product.price || 0)}
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'end' }}>
          <Link
            to={`/products/${product.id || product._id}`}
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              border: `1px solid ${accent}55`,
              color: accent,
              textDecoration: 'none',
              fontWeight: 700
            }}
          >
            Chi tiết
          </Link>
          <button
            onClick={() => onAddToCart(product)}
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              border: 'none',
              background: accent,
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Thêm giỏ
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeBrand, setActiveBrand] = useState('all');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const presetCategory = searchParams.get('category');
    if (presetCategory) {
      setActiveCategory(presetCategory);
    }
  }, [searchParams]);

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
      setAlert({ type: 'warning', message: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.' });
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
      setAlert({ type: 'success', message: 'Đã thêm sản phẩm vào giỏ hàng.' });
      setTimeout(() => setAlert(null), 2500);
    } catch {
      setAlert({ type: 'danger', message: 'Không thể thêm sản phẩm vào giỏ hàng.' });
    }
  };

  const categories = useMemo(
    () => Array.from(new Set(products.map((item) => item.category).filter(Boolean))).sort(),
    [products]
  );

  const brands = useMemo(() => {
    const source =
      activeCategory === 'all'
        ? products
        : products.filter((item) => (item.category || '') === activeCategory);

    return Array.from(new Set(source.map((item) => item.brand).filter(Boolean))).sort();
  }, [products, activeCategory]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    return products.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        normalizeText(product.name || product.title).includes(normalizedQuery) ||
        normalizeText(product.category).includes(normalizedQuery) ||
        normalizeText(product.brand).includes(normalizedQuery);

      const matchesCategory =
        activeCategory === 'all' || (product.category || '') === activeCategory;

      const matchesBrand = activeBrand === 'all' || (product.brand || '') === activeBrand;

      return matchesQuery && matchesCategory && matchesBrand;
    });
  }, [products, query, activeCategory, activeBrand]);

  const groupedProducts = useMemo(
    () => buildGroupedProducts(filteredProducts),
    [filteredProducts]
  );

  const handleSearch = () => {
    setQuery(queryInput);
  };

  const handleReset = () => {
    setQueryInput('');
    setQuery('');
    setActiveCategory('all');
    setActiveBrand('all');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') handleSearch();
  };

  return (
    <div style={{ display: 'grid', gap: '24px', paddingBottom: '28px' }}>
      <WelcomeHero
        eyebrow="Sản phẩm"
        title="Chào mừng bạn đến khu trưng bày sản phẩm của ShopHub."
        description=""
        primaryAction={{ to: '/products', label: 'Xem sản phẩm mới' }}
        secondaryAction={{ to: '/', label: 'Về trang chủ' }}
        theme="light"
      />

      {alert && (
        <div
          style={{
            padding: '14px 16px',
            borderRadius: '16px',
            border: `1px solid ${
              alert.type === 'success'
                ? '#86efac'
                : alert.type === 'warning'
                  ? '#fdba74'
                  : '#fca5a5'
            }`,
            background:
              alert.type === 'success'
                ? '#f0fdf4'
                : alert.type === 'warning'
                  ? '#fff7ed'
                  : '#fef2f2',
            color:
              alert.type === 'success'
                ? '#166534'
                : alert.type === 'warning'
                  ? '#9a3412'
                  : '#b91c1c'
          }}
        >
          {alert.message}
        </div>
      )}

      <section
        style={{
          background: 'linear-gradient(135deg, #f97316 0%, #fdba74 100%)',
          borderRadius: '24px',
          padding: '22px',
          border: '1px solid rgba(234,88,12,0.2)',
          boxShadow: '0 24px 48px rgba(234, 88, 12, 0.18)'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(220px, 1.2fr) repeat(2, minmax(180px, 0.7fr)) auto',
            gap: '12px',
            alignItems: 'center'
          }}
        >
          <input
            className="form-control"
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm theo tên, danh mục hoặc thương hiệu"
            style={{ minHeight: '48px', borderRadius: '14px' }}
          />

          <select
            className="form-select"
            value={activeCategory}
            onChange={(event) => {
              setActiveCategory(event.target.value);
              setActiveBrand('all');
            }}
            style={{ minHeight: '48px', borderRadius: '14px' }}
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            value={activeBrand}
            onChange={(event) => setActiveBrand(event.target.value)}
            style={{ minHeight: '48px', borderRadius: '14px' }}
          >
            <option value="all">Tất cả thương hiệu</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'end', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={handleSearch}
              style={{
                minWidth: '108px'
              }}
            >
              Tìm kiếm
            </button>
            <button
              className="btn"
              onClick={handleReset}
              style={{
                minWidth: '108px',
                border: '1px solid rgba(255,255,255,0.55)',
                background: '#fff',
                color: '#9a3412'
              }}
            >
              Đặt lại
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginTop: '16px'
          }}
        >
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {categories.slice(0, 8).map((category) => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  setActiveBrand('all');
                }}
                style={{
                  padding: '9px 14px',
                  borderRadius: '999px',
                  border: activeCategory === category ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.55)',
                  background: activeCategory === category ? '#fff7ed' : 'rgba(255,255,255,0.92)',
                  color: activeCategory === category ? '#c2410c' : '#7c2d12',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {category}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {['grid', 'list'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '9px 14px',
                  borderRadius: '999px',
                  border: viewMode === mode ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.55)',
                  background: viewMode === mode ? '#fff7ed' : 'rgba(255,255,255,0.92)',
                  color: viewMode === mode ? '#c2410c' : '#7c2d12',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {mode === 'grid' ? 'Dạng thẻ' : 'Dạng danh sách'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <section
          style={{
            padding: '40px',
            borderRadius: '24px',
            background: '#ffffff',
            border: '1px solid rgba(148,163,184,0.18)',
            color: '#64748b'
          }}
        >
          Đang tải dữ liệu sản phẩm...
        </section>
      ) : groupedProducts.length === 0 ? (
        <section
          style={{
            padding: '40px',
            borderRadius: '24px',
            background: '#ffffff',
            border: '1px solid rgba(148,163,184,0.18)'
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
            Không tìm thấy sản phẩm phù hợp
          </div>
          <div style={{ color: '#64748b', marginBottom: '18px' }}>
            Hãy thử đổi từ khóa, danh mục hoặc thương hiệu để nới rộng kết quả.
          </div>
          <button className="btn btn-primary" onClick={handleReset}>
            Xóa bộ lọc
          </button>
        </section>
      ) : (
        groupedProducts.map((group) => (
          <section
            key={group.category}
            style={{
              borderRadius: '28px',
              padding: '24px',
              background: group.meta.surface,
              border: `1px solid ${group.meta.accent}22`,
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.06)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '18px',
                alignItems: 'end',
                flexWrap: 'wrap',
                marginBottom: '20px'
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    padding: '7px 12px',
                    borderRadius: '999px',
                    background: '#ffffffd9',
                    color: group.meta.accent,
                    fontSize: '12px',
                    fontWeight: 700,
                    marginBottom: '12px'
                  }}
                >
                  {group.meta.title}
                </div>
                <h2 style={{ margin: '0 0 8px', fontSize: '30px', color: '#0f172a' }}>{group.category}</h2>
                <p style={{ margin: 0, color: '#475569', lineHeight: 1.7 }}>{group.meta.description}</p>
              </div>

              <div style={{ display: 'grid', gap: '8px', justifyItems: 'end' }}>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  {group.products.length} sản phẩm trong cụm này
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'end' }}>
                  {group.brands.slice(0, 6).map((brand) => (
                    <button
                      key={brand}
                      onClick={() => {
                        setActiveCategory(group.category);
                        setActiveBrand(brand);
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '999px',
                        border: activeBrand === brand ? `1px solid ${group.meta.accent}` : '1px solid transparent',
                        background: activeBrand === brand ? '#ffffff' : '#ffffffb8',
                        color: activeBrand === brand ? group.meta.accent : '#334155',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '18px'
                }}
              >
                {group.products.map((product) => (
                  <ProductCard
                    key={product.id || product._id}
                    product={product}
                    accent={group.meta.accent}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '14px' }}>
                {group.products.map((product) => (
                  <ProductRow
                    key={product.id || product._id}
                    product={product}
                    accent={group.meta.accent}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </section>
        ))
      )}
    </div>
  );
}
