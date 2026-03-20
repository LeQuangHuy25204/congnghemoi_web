import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getStoredUser } from '../services/api.js';

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'bot', message: 'Chào bạn! Bạn cần tư vấn sản phẩm nào?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      message: input,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const currentUser = getStoredUser();
      const userId = currentUser?._id || currentUser?.id || null;
      const res = await api.post('/chat', { message: input, user_id: userId });
      
      const reply = res.data?.reply || res.data?.response || res.data?.message || 'Xin lỗi, tôi chưa có thông tin về câu hỏi của bạn. Vui lòng liên hệ hỗ trợ viên.';
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          role: 'bot',
          message: reply,
          timestamp: new Date()
        }
      ]);

      const products = Array.isArray(res.data?.products) ? res.data.products : [];
      if (products.length > 0) {
        const productList = products.map((p) => ({
          id: p._id || p.id,
          name: p.name || p.title,
          price: p.price || 0,
          image: p.image
        }));
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            role: 'bot',
            message: 'Dưới đây là một số sản phẩm liên quan:',
            products: productList,
            timestamp: new Date()
          }
        ]);
      }
    } catch (err) {
      const status = err?.response?.status;
      let errorMessage = 'Xin lỗi, hiện tại tôi chưa thể phản hồi. Vui lòng thử lại sau.';
      if (status === 401 || status === 403) {
        errorMessage = 'Bạn cần đăng nhập để sử dụng các tính năng nâng cao.';
      }
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          role: 'bot',
          message: errorMessage,
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface-secondary)' }}>
      <div style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border-light)', padding: '12px 0' }}>
        <div className="container-lg">
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
            <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Trang chủ</Link>
            <span style={{ margin: '0 8px' }}>/</span>
            <span style={{ color: 'var(--ink)' }}>Chatbot</span>
          </div>
        </div>
      </div>
      <div className="container-lg" style={{ paddingTop: '32px', paddingBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '32px' }}>🤖 Trợ lý ảo ShopHub</h1>
        <div style={{ backgroundColor: 'var(--surface)', borderRadius: '8px', boxShadow: 'var(--shadow)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', height: '700px', maxWidth: '700px' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--primary-light)', borderRadius: '8px 8px 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '28px' }}>🤖</div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-dark)' }}>ShopHub Chatbot</div>
                <div style={{ fontSize: '12px', color: 'var(--primary)' }}>⚫ Đang hoạt động</div>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--surface-light)' }}>
            {messages.map((m) => (
              <div key={m.id} style={{ display: 'flex', justifyContent: m.role === 'bot' ? 'flex-start' : 'flex-end', gap: '8px' }}>
                {m.role === 'bot' && <div style={{ fontSize: '24px', flexShrink: 0 }}>🤖</div>}
                <div style={{ maxWidth: '80%', padding: '12px 16px', borderRadius: '12px', backgroundColor: m.role === 'bot' ? 'white' : 'var(--primary)', color: m.role === 'bot' ? 'var(--ink)' : 'white', border: m.role === 'bot' ? '1px solid var(--border-light)' : 'none', wordWrap: 'break-word' }}>
                  <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{m.message}</div>
                  <div style={{ fontSize: '11px', marginTop: '6px', opacity: 0.7 }}>{m.timestamp ? new Date(m.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                  {m.products && m.products.length > 0 && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {m.products.map((p) => (
                        <Link key={p.id} to={`/products/${p.id}`} style={{ padding: '10px 12px', backgroundColor: m.role === 'bot' ? 'var(--primary-light)' : 'rgba(255,255,255,0.1)', borderRadius: '6px', textDecoration: 'none', color: m.role === 'bot' ? 'var(--primary)' : 'white', fontSize: '13px', fontWeight: 600 }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = m.role === 'bot' ? 'var(--primary)' : 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateX(4px)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = m.role === 'bot' ? 'var(--primary-light)' : 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateX(0)'; }}>📦 {p.name} - {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}</Link>
                      ))}
                    </div>
                  )}
                </div>
                {m.role === 'user' && <div style={{ fontSize: '24px', flexShrink: 0 }}>👤</div>}
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-start', alignItems: 'center' }}>
                <div style={{ fontSize: '24px' }}>🤖</div>
                <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: 'white', border: '1px solid var(--border-light)', display: 'flex', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)', animation: 'bounce 1.4s ease-in-out infinite' }} />
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)', animation: 'bounce 1.4s ease-in-out infinite', animationDelay: '0.2s' }} />
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)', animation: 'bounce 1.4s ease-in-out infinite', animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSend} style={{ padding: '16px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '8px', backgroundColor: 'var(--surface)' }}>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }} placeholder="Nhập câu hỏi của bạn..." disabled={loading} style={{ flex: 1, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
            <button type="submit" disabled={loading || !input.trim()} style={{ padding: '10px 20px', backgroundColor: loading || !input.trim() ? '#ccc' : 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '14px' }} onMouseEnter={(e) => { if (!loading && input.trim()) { e.currentTarget.style.backgroundColor = 'var(--primary-dark)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; } }} onMouseLeave={(e) => { if (!loading && input.trim()) { e.currentTarget.style.backgroundColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; } }}>{loading ? '⏳' : '📤 Gửi'}</button>
          </form>
        </div>
      </div>
      <style>{`@keyframes bounce { 0%, 80%, 100% { opacity: 0.5; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-10px); } }`}</style>
    </div>
  );
}


