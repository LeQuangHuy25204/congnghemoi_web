import { useEffect, useState } from 'react';
import api, { getStoredUser } from '../services/api.js';

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({ title: '', message: '' });
  const [chatInput, setChatInput] = useState('');
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadTickets = () => {
    const user = getStoredUser();
    if (!user?._id) return;
    api
      .get(`/support/tickets/${user._id}`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setTickets(data);
        if (data.length && !selectedTicket) {
          setSelectedTicket(data[0]);
        }
      })
      .catch(() => setTickets([]));
  };

  const loadMessages = (ticketId) => {
    if (!ticketId) return;
    api
      .get(`/support/ticket/${ticketId}/messages`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setMessages(data);
      })
      .catch(() => setMessages([]));
  };

  const loadHistory = (ticketId) => {
    if (!ticketId) return;
    api
      .get(`/support/ticket/${ticketId}/history`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setHistory(data);
      })
      .catch(() => setHistory([]));
  };

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    const ticketId = selectedTicket?._id || selectedTicket?.id;
    loadMessages(ticketId);
    loadHistory(ticketId);
  }, [selectedTicket]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);
    const user = getStoredUser();
    try {
      await api.post('/support/ticket', {
        user_id: user._id,
        title: form.title,
        message: form.message,
        status: 'open',
        actor_id: user._id,
        actor_role: 'customer'
      });
      setAlert({ type: 'success', message: 'Ticket created.' });
      setForm({ title: '', message: '' });
      loadTickets();
    } catch (err) {
      setAlert({ type: 'danger', message: 'Create ticket failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const user = getStoredUser();
    const ticketId = selectedTicket?._id || selectedTicket?.id;
    if (!ticketId || !chatInput.trim()) return;
    try {
      await api.post(`/support/ticket/${ticketId}/message`, {
        sender_id: user._id,
        sender_role: 'customer',
        content: chatInput.trim()
      });
      setChatInput('');
      loadMessages(ticketId);
      loadHistory(ticketId);
    } catch {
      setAlert({ type: 'danger', message: 'Send message failed.' });
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-10">
        <h2 className="mb-3">Customer Support</h2>
        {alert && <div className={`alert alert-${alert.type}`}>{alert.message}</div>}

        <div className="row g-3">
          <div className="col-lg-5">
            <form onSubmit={handleSubmit} className="card card-body mb-3">
              <div className="mb-3">
                <label className="form-label">Title</label>
                <input
                  className="form-control"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Message</label>
                <textarea
                  className="form-control"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows="3"
                  required
                />
              </div>
              <button className="btn btn-primary" disabled={loading}>
                Submit Ticket
              </button>
            </form>

            <div className="border rounded p-3">
              <h5>Your Tickets</h5>
              {tickets.length === 0 ? (
                <div className="text-muted">No tickets found.</div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {tickets.map((t) => {
                    const isActive = (selectedTicket?._id || selectedTicket?.id) === (t._id || t.id);
                    return (
                      <button
                        type="button"
                        key={t._id || t.id}
                        className={`text-start p-2 rounded border ${isActive ? 'border-primary' : 'border-light'} bg-light`}
                        onClick={() => setSelectedTicket(t)}
                      >
                        <div className="fw-bold">{t.title}</div>
                        <div className="text-muted">{t.message}</div>
                        <div className="small">Status: {t.status}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="col-lg-7">
            {!selectedTicket ? (
              <div className="text-muted">Select a ticket to view conversation.</div>
            ) : (
              <div className="card card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <div className="fw-bold">{selectedTicket.title}</div>
                    <div className="text-muted">{selectedTicket.message}</div>
                  </div>
                  <div className="badge text-bg-secondary">{selectedTicket.status}</div>
                </div>

                <div className="border rounded p-2 mb-3" style={{ maxHeight: 240, overflowY: 'auto' }}>
                  {messages.length === 0 ? (
                    <div className="text-muted">No messages yet.</div>
                  ) : (
                    messages.map((m) => (
                      <div key={m._id || m.id} className="mb-2">
                        <div className="small text-muted">
                          {m.sender_role} • {new Date(m.createdAt).toLocaleString()}
                        </div>
                        <div>{m.content}</div>
                      </div>
                    ))
                  )}
                </div>

                <div className="d-flex gap-2">
                  <input
                    className="form-control"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type your message..."
                  />
                  <button className="btn btn-outline-primary" type="button" onClick={handleSendMessage}>
                    Send
                  </button>
                </div>

                <div className="mt-4">
                  <h6>Support History</h6>
                  {history.length === 0 ? (
                    <div className="text-muted">No history.</div>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {history.map((h) => (
                        <div key={h._id || h.id} className="border rounded p-2">
                          <div className="small text-muted">
                            {h.action} • {new Date(h.createdAt).toLocaleString()}
                          </div>
                          <div>{h.note || '-'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
