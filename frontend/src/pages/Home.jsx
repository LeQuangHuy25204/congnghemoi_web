import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '900px',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border-light)',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-lg)',
        padding: '48px 28px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '56px', marginBottom: '12px' }}>🛍️</div>
        <h1 style={{
          fontSize: '36px',
          margin: '0 0 12px',
          color: 'var(--primary-dark)',
          fontWeight: 800
        }}>
          Chào mừng đến với ShopHub
        </h1>
        <p style={{
          margin: '0 auto 26px',
          maxWidth: '680px',
          color: 'var(--muted)',
          fontSize: '16px',
          lineHeight: 1.7
        }}>
          Nền tảng mua sắm hiện đại với trải nghiệm nhanh, dễ dùng và hỗ trợ AI.
          Hãy khám phá danh sách sản phẩm để tìm món đồ phù hợp với bạn.
        </p>
        <Link
          to="/products"
          style={{
            display: 'inline-block',
            backgroundColor: 'var(--primary)',
            color: 'white',
            textDecoration: 'none',
            fontWeight: 700,
            padding: '12px 18px',
            borderRadius: '10px'
          }}
        >
          Xem sản phẩm
        </Link>
      </div>
    </div>
  );
}
