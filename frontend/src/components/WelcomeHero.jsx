import { Link } from 'react-router-dom';

export default function WelcomeHero({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  theme = 'light'
}) {
  const isDark = theme === 'dark';

  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '28px',
        padding: '36px',
        background: isDark
          ? 'radial-gradient(circle at top left, rgba(251,146,60,0.28), transparent 34%), linear-gradient(135deg, #0f172a 0%, #1e293b 48%, #334155 100%)'
          : 'radial-gradient(circle at top right, rgba(249,115,22,0.24), transparent 24%), linear-gradient(135deg, #fff7ed 0%, #ffffff 55%, #fff1e6 100%)',
        color: isDark ? '#f8fafc' : '#0f172a',
        boxShadow: '0 30px 70px rgba(15, 23, 42, 0.12)',
        border: isDark ? 'none' : '1px solid rgba(251,146,60,0.26)'
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 'auto -70px -90px auto',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(249,115,22,0.14)',
          filter: 'blur(8px)'
        }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '28px',
          alignItems: 'center',
          position: 'relative'
        }}
      >
        <div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 14px',
              borderRadius: '999px',
              background: isDark ? 'rgba(255,255,255,0.12)' : '#ffffffcc',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(251,146,60,0.2)'}`,
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: isDark ? '#fff7ed' : '#c2410c'
            }}
          >
            {eyebrow}
          </span>

          <h1
            style={{
              margin: '18px 0 14px',
              fontSize: 'clamp(30px, 5vw, 52px)',
              lineHeight: 1.08,
              color: isDark ? '#fff7ed' : '#0f172a'
            }}
          >
            {title}
          </h1>

          <p
            style={{
              maxWidth: '640px',
              margin: 0,
              color: isDark ? 'rgba(248,250,252,0.82)' : '#475569',
              fontSize: '16px',
              lineHeight: 1.8
            }}
          >
            {description}
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '24px' }}>
            {primaryAction && (
              <Link
                to={primaryAction.to}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '170px',
                  padding: '14px 20px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  color: '#fff',
                  textDecoration: 'none',
                  fontWeight: 700,
                  boxShadow: '0 18px 30px rgba(249,115,22,0.22)'
                }}
              >
                {primaryAction.label}
              </Link>
            )}

            {secondaryAction && (
              <Link
                to={secondaryAction.to}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '170px',
                  padding: '14px 20px',
                  borderRadius: '14px',
                  background: isDark ? 'rgba(255,255,255,0.08)' : '#ffffffcc',
                  color: isDark ? '#fff' : '#0f172a',
                  textDecoration: 'none',
                  fontWeight: 700,
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(148,163,184,0.2)'}`
                }}
              >
                {secondaryAction.label}
              </Link>
            )}
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            minHeight: '320px',
            display: 'grid',
            placeItems: 'center'
          }}
        >
          <div className={`welcome-hero__orb ${isDark ? 'welcome-hero__orb--dark' : ''}`} />
          <div className={`welcome-hero__device ${isDark ? 'welcome-hero__device--dark' : ''}`}>
            <div className="welcome-hero__notch" />
            <div className="welcome-hero__screen">
              <div className="welcome-hero__badge">Xin chào</div>
              <div className="welcome-hero__screen-title">Chào mừng bạn đến với ShopHub</div>
              <div className="welcome-hero__screen-text">
                Khám phá điện thoại, tablet và phụ kiện theo từng cụm rõ ràng, dễ chọn hơn.
              </div>
              <div className="welcome-hero__floating-row">
                <div className="welcome-hero__mini-card">
                  <span className="welcome-hero__mini-dot" />
                  Ưu đãi mới
                </div>
                <div className="welcome-hero__mini-card">
                  <span className="welcome-hero__mini-dot welcome-hero__mini-dot--accent" />
                  Giao nhanh
                </div>
              </div>
            </div>
          </div>

          <div className="welcome-hero__tag welcome-hero__tag--top">Mẫu mới</div>
          <div className="welcome-hero__tag welcome-hero__tag--bottom">Giá tốt hôm nay</div>
        </div>
      </div>
    </section>
  );
}
