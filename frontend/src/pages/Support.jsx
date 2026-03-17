import { useEffect, useState } from 'react';
import api, { getStoredUser } from '../services/api.js';

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ title: '', message: '' });
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadTickets = () => {
    const user = getStoredUser();
    if (!user?._id) return;
    api.get(`/support/tickets/${user._id}`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setTickets(data);
      })
      .catch(() => setTickets([]));
  };

  useEffect(() => {
    loadTickets();
  }, []);

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
        status: 'open'
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

  return (
    <div className="row justify-content-center">
      <div className="col-md-7">
        <h2 className="mb-3">Customer Support</h2>
        {alert && (
          <div className={`alert alert-${alert.type}`}>{alert.message}</div>
        )}
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
          <button className="btn btn-primary" disabled={loading}>Submit Ticket</button>
        </form>

        <div className="border rounded p-3">
          <h5>Your Tickets</h5>
          {tickets.length === 0 ? (
            <div className="text-muted">No tickets found.</div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {tickets.map((t) => (
                <div key={t._id || t.id} className="p-2 rounded bg-light">
                  <div className="fw-bold">{t.title}</div>
                  <div className="text-muted">{t.message}</div>
                  <div className="small">Status: {t.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
