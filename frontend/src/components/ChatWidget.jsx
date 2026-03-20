import { useEffect, useMemo, useRef, useState } from 'react';
import api, { getStoredUser } from '../services/api.js';

const initialMessages = [
  { role: 'bot', message: 'Xin chao Anh/Chi! Em la tro ly AI cua Shop.' },
  { role: 'bot', message: 'Em rat san long ho tro Anh/Chi.' }
];

export default function ChatWidget() {
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef(null);

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, open]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!canSend) return;

    const userText = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', message: userText }]);
    setLoading(true);

    try {
      const currentUser = getStoredUser();
      const userId = currentUser?._id || currentUser?.id || null;
      const res = await api.post('/chat', { message: userText, user_id: userId });
      const reply = res.data?.reply || res.data?.response || res.data?.message || 'Cam on ban, minh da ghi nhan.';
      setMessages((prev) => [...prev, { role: 'bot', message: reply }]);

      const products = Array.isArray(res.data?.products) ? res.data.products : [];
      if (products.length > 0) {
        const list = products
          .slice(0, 5)
          .map((p, idx) => `${idx + 1}. ${p.name} - ${Number(p.price || 0).toLocaleString()}d`)
          .join('\n');
        setMessages((prev) => [...prev, { role: 'bot', message: list }]);
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setMessages((prev) => [
          ...prev,
          { role: 'bot', message: 'Ban hay dang nhap de su dung tro ly chat.' }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'bot', message: 'Xin loi, he thong chat dang ban. Vui long thu lai sau.' }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          className="chat-fab"
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open chat"
        >
          Chat
        </button>
      )}

      {open && (
        <div className="chat-widget" role="dialog" aria-label="Chat support">
          <div className="chat-widget__header">
            <div className="chat-widget__brand">
              <span className="chat-widget__dot" />
              <span>Shop Assistant</span>
            </div>
            <button
              type="button"
              className="chat-widget__minimize"
              onClick={() => setOpen(false)}
              aria-label="Minimize chat"
            >
              -
            </button>
          </div>

          <div className="chat-widget__messages" ref={messagesRef}>
            {messages.map((m, idx) => (
              <div key={idx} className={`chat-msg chat-msg--${m.role}`}>
                <pre>{m.message}</pre>
              </div>
            ))}
            {loading && (
              <div className="chat-msg chat-msg--bot">
                <pre>Dang tra loi...</pre>
              </div>
            )}
          </div>

          <form className="chat-widget__input" onSubmit={handleSend}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhap tin nhan..."
            />
            <button type="submit" disabled={!canSend}>
              Gui
            </button>
          </form>
        </div>
      )}
    </>
  );
}
