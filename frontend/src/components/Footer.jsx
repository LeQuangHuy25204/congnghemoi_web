import { Link } from 'react-router-dom';

const trustItems = [
  'Vận chuyển toàn quốc',
  '1 đổi 1 trong 30 ngày',
  'Giá chuẩn, không sốc giá',
  'Bảo hành máy 12 tháng'
];

function FooterColumn({ title, children }) {
  return (
    <div className="footer__column">
      <div className="footer__heading">{title}</div>
      <div className="footer__links">{children}</div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__trust-row">
          {trustItems.map((item, index) => (
            <div key={item} className="site-footer__trust-item">
              <span className="site-footer__trust-icon">
                {index === 0 && '🚚'}
                {index === 1 && '↔'}
                {index === 2 && '🏷'}
                {index === 3 && '🛡'}
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="site-footer__panel">
          <FooterColumn title="Chăm sóc khách hàng">
            <Link to="/support" className="footer__link">Hướng dẫn thanh toán</Link>
            <Link to="/products" className="footer__link">Hướng dẫn đặt hàng</Link>
            <Link to="/checkout" className="footer__link">Hướng dẫn mua trả góp</Link>
            <Link to="/support" className="footer__link">Quy định bảo hành - đổi trả</Link>
            <Link to="/support" className="footer__link">Chính sách giao hàng tận nơi</Link>
          </FooterColumn>

          <FooterColumn title="Về ShopHub">
            <Link to="/" className="footer__link">Giới thiệu ShopHub</Link>
            <Link to="/" className="footer__link">Tuyển dụng</Link>
            <Link to="/" className="footer__link">Điều khoản sử dụng</Link>
            <Link to="/" className="footer__link">Chính sách chất lượng</Link>
            <Link to="/" className="footer__link">Bảo mật thông tin</Link>
            <Link to="/chatbot" className="footer__link">App Chiến Thần Định Giá</Link>
          </FooterColumn>

          <FooterColumn title="Liên hệ nhanh">
            <div className="footer__contact-line">Tổng đài hỗ trợ - mua hàng: <a href="tel:0938060080" className="footer__contact-highlight">0938.060.080</a></div>
            <div className="footer__contact-line">- CN: 27 Lê Văn Việt, P.Tăng Nhơn Phú, TPHCM: <a href="tel:0934060080" className="footer__contact-highlight">0934.060.080</a></div>
            <div className="footer__contact-line">- CN: 174 Cao Thắng, P.Vườn Lài, TPHCM: <a href="tel:0938460246" className="footer__contact-highlight">0938.460.246</a></div>
            <div className="footer__contact-line">- CN: 327 Nguyễn An Ninh, P.Dĩ An, TPHCM: <a href="tel:0931460246" className="footer__contact-highlight">0931.460.246</a></div>
            <div className="footer__contact-line">Mua hàng từ xa: <a href="tel:0896612468" className="footer__contact-highlight">089.661.2468</a></div>
            <div className="footer__contact-line">Tra cứu tiến độ bảo hành: <a href="tel:0932689889" className="footer__contact-highlight">0932.689.889</a></div>
            <div className="footer__contact-line">Góp ý, khiếu nại: <a href="tel:0919509193" className="footer__contact-highlight">09195.09193</a></div>
            <div className="footer__contact-line">Liên hệ hợp tác bán buôn: <a href="tel:0937070491" className="footer__contact-highlight">093.7070.491</a></div>
          </FooterColumn>

          <FooterColumn title="Hỗ trợ thanh toán">
            <div className="footer__payment-list">
              <span className="footer__payment-badge">ATM</span>
              <span className="footer__payment-badge">VISA</span>
              <span className="footer__payment-badge">MasterCard</span>
            </div>
            <div className="footer__social-list">
              <span className="footer__social-badge">f</span>
              <span className="footer__social-badge">▶</span>
              <span className="footer__social-badge">Zalo</span>
              <span className="footer__social-badge">♪</span>
            </div>
            <div className="footer__cert-list">
              <span className="footer__cert-badge">Đã thông báo</span>
              <span className="footer__cert-badge">DMCA</span>
            </div>
          </FooterColumn>
        </div>

        <div className="site-footer__bottom">
          <span>Website thuộc sở hữu của CÔNG TY TNHH CÔNG NGHỆ KỸ THUẬT VTL.</span>
          <span>Giấy chứng nhận ĐKKD số 0319050534 do Sở Tài Chính TPHCM cấp ngày 24/07/2025.</span>
        </div>
      </div>
    </footer>
  );
}
