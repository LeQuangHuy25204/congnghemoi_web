import { useState } from 'react';
import api from '../services/api.js';

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { role: 'bot', message: 'Chào bạn! Bạn cần tư vấn sản phẩm nào?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage = { role: 'user', message: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/chat', { message: userMessage.message });
      const reply = res.data?.reply || res.data?.response || res.data?.message || 'Mình sẽ phản hồi sớm nhé.';
      setMessages((prev) => [...prev, { role: 'bot', message: reply }]);
      const products = Array.isArray(res.data?.products) ? res.data.products : [];
      if (products.length > 0) {
        const list = products
          .map((p, idx) => `${idx + 1}. ${p.name} - ${Number(p.price).toLocaleString()}đ`)
          .join('\n');
        setMessages((prev) => [...prev, { role: 'bot', message: list }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'bot', message: 'Xin lỗi, hiện tại tôi chưa thể phản hồi.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-7">
        <h2 className="mb-3">Chatbot</h2>
        <div className="border rounded p-3 mb-3" style={{ minHeight: 300 }}>
          <div className="d-flex flex-column gap-2">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-2 rounded ${m.role === 'bot' ? 'bg-light' : 'bg-success text-white'}`}
              >
                {m.message}
              </div>
            ))}
          </div>
        </div>
        <form onSubmit={handleSend} className="d-flex gap-2">
          <input
            className="form-control"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the chatbot..."
          />
          <button className="btn btn-success" disabled={loading}>Send</button>
        </form>
      </div>
    </div>
  );
}


