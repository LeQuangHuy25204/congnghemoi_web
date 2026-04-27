import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import WelcomeHero from '../components/WelcomeHero.jsx';

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
      label: 'iPhone',
      accent: '#c2410c',
      background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
      description: 'Dòng iPhone nổi bật với thiết kế cao cấp, hiệu năng mạnh và camera ổn định.'
    };
  }

  if (normalized.includes('ipad') || normalized.includes('tablet')) {
    return {
      label: 'Máy tính bảng',
      accent: '#ea580c',
      background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
      description: 'Tablet phục vụ học tập, giải trí và làm việc di động với màn hình lớn.'
    };
  }

  if (normalized.includes('watch') || normalized.includes('đồng hồ')) {
    return {
      label: 'Smart Watch',
      accent: '#f97316',
      background: 'linear-gradient(135deg, #fff7ed 0%, #fdba74 100%)',
      description: 'Thiết bị đeo thông minh theo dõi sức khỏe và đồng bộ nhanh với điện thoại.'
    };
  }

  if (
    normalized.includes('tai nghe') ||
    normalized.includes('phụ kiện') ||
    normalized.includes('accessor')
  ) {
    return {
      label: 'Phụ kiện',
      accent: '#c2410c',
      background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
      description: 'Nhóm phụ kiện công nghệ giúp hoàn thiện trải nghiệm sử dụng hằng ngày.'
    };
  }

  return {
    label: category || 'Điện thoại',
    accent: '#ea580c',
    background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
    description: 'Các mẫu điện thoại theo nhiều phân khúc giá và thương hiệu phổ biến.'
  };
};

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    api.get('/products')
      .then((res) => {
        if (!active) return;
        const items = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setProducts(items);
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

  const categoryHighlights = useMemo(() => {
    const grouped = new Map();

    products.forEach((product) => {
      const category = product.category || 'Điện thoại';
      if (!grouped.has(category)) grouped.set(category, []);
      grouped.get(category).push(product);
    });

    return Array.from(grouped.entries())
      .map(([category, items]) => {
        const meta = getCategoryMeta(category);
        const sorted = [...items].sort((a, b) => (b.price || 0) - (a.price || 0));
        const brands = Array.from(
          new Set(items.map((item) => item.brand).filter(Boolean))
        ).slice(0, 4);

        return {
          category,
          meta,
          count: items.length,
          brands,
          heroProduct: sorted[0]
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [products]);

  const featuredProducts = useMemo(
    () =>
      [...products]
        .sort((a, b) => (b.price || 0) - (a.price || 0))
        .slice(0, 6),
    [products]
  );

  return (
    <div style={{ display: 'grid', gap: '28px', paddingBottom: '24px' }}>
      <WelcomeHero
        eyebrow="Chào mừng"
        title="Không gian mua sắm công nghệ gọn gàng, hiện đại và dễ chọn hơn."
        description=""
        primaryAction={{ to: '/products', label: 'Xem toàn bộ sản phẩm' }}
        secondaryAction={{ to: '/products', label: 'Khám phá ngay' }}
        theme="light"
      />

      <section
        id="danh-muc-noi-bat"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px'
        }}
      >
        {categoryHighlights.map((group) => (
          <Link
            key={group.category}
            to={`/products?category=${encodeURIComponent(group.category)}`}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              borderRadius: '24px',
              padding: '22px',
              background: group.meta.background,
              border: `1px solid ${group.meta.accent}22`,
              boxShadow: '0 16px 32px rgba(15, 23, 42, 0.08)'
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                padding: '7px 12px',
                borderRadius: '999px',
                background: '#ffffffcc',
                color: group.meta.accent,
                fontWeight: 700,
                fontSize: '13px'
              }}
            >
              {group.meta.label}
            </div>
            <h3 style={{ margin: '14px 0 10px', fontSize: '22px', color: '#0f172a' }}>
              {group.category}
            </h3>
            <p style={{ margin: '0 0 14px', color: '#334155', lineHeight: 1.7 }}>
              {group.meta.description}
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {group.brands.map((brand) => (
                <span
                  key={brand}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '999px',
                    background: '#ffffffb5',
                    color: '#0f172a',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {brand}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'end' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#475569' }}>Sản phẩm trong cụm</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: group.meta.accent }}>{group.count}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', color: '#475569' }}>Mức giá cao nhất</div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>
                  {formatPrice(group.heroProduct?.price || 0)}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <section
        style={{
          background: '#ffffff',
          borderRadius: '28px',
          padding: '28px',
          border: '1px solid rgba(148,163,184,0.18)',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.06)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '16px',
            alignItems: 'end',
            flexWrap: 'wrap',
            marginBottom: '22px'
          }}
        >
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f97316', textTransform: 'uppercase' }}>
              Gợi ý nổi bật
            </div>
            <h2 style={{ margin: '8px 0 6px', fontSize: '30px', color: '#0f172a' }}>
              Sản phẩm giá trị cao đang được ưu tiên hiển thị
            </h2>
            <p style={{ margin: 0, color: '#64748b', lineHeight: 1.7 }}>
              Khu vực này giúp trang chủ có chiều sâu hơn thay vì chỉ là một lời chào tĩnh.
            </p>
          </div>
          <Link
            to="/products"
            style={{
              color: '#ea580c',
              textDecoration: 'none',
              fontWeight: 700
            }}
          >
            Đi tới trang sản phẩm
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '32px 0', color: '#64748b' }}>Đang tải dữ liệu sản phẩm...</div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '18px'
            }}
          >
            {featuredProducts.map((product) => (
              <div
                key={product._id || product.id}
                style={{
                  padding: '18px',
                  borderRadius: '20px',
                  background: 'linear-gradient(180deg, #fff 0%, #fff7ed 100%)',
                  border: '1px solid #fed7aa'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#c2410c', marginBottom: '10px' }}>
                  {product.category || 'Danh mục'}
                </div>
                <div
                  style={{
                    minHeight: '48px',
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#0f172a',
                    lineHeight: 1.5
                  }}
                >
                  {product.name}
                </div>
                <div style={{ marginTop: '10px', color: '#64748b', fontSize: '14px' }}>
                  {product.brand || 'Thương hiệu đang cập nhật'}
                </div>
                <div style={{ marginTop: '14px', fontSize: '20px', fontWeight: 800, color: '#ea580c' }}>
                  {formatPrice(product.price || 0)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
