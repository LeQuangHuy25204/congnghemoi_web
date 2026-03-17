import { useState } from 'react';
import api from '../services/api.js';

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { role: 'bot', message: 'Hi! Ask me anything about products or orders.' }
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
      const res = await api.post('/chatbot/messages', { message: userMessage.message });
      const reply = res.data?.reply || res.data?.message || 'Thanks! We will get back to you.';
      setMessages((prev) => [...prev, { role: 'bot', message: reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'bot', message: 'Sorry, I cannot respond right now.' }]);
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
