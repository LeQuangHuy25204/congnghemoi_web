import { useEffect, useState } from 'react';
import api, { getStoredUser } from '../services/api.js';

const STATUS_OPTIONS = ['open', 'pending', 'resolved', 'closed'];

export default function EmployeeSupport() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [statusInput, setStatusInput] = useState('open');
  const [staffId, setStaffId] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [alert, setAlert] = useState(null);

  const loadTickets = () => {
    setAlert(null);
    api
      .get('/support/tickets')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setTickets(data);
        if (data.length && !selectedTicket) {
          setSelectedTicket(data[0]);
        }
      })
      .catch(() => {
        setAlert({ type: 'danger', message: 'Load tickets failed.' });
        setTickets([]);
      });
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
    const user = getStoredUser();
    if (user?._id) setStaffId(user._id);
    loadTickets();
  }, []);

  useEffect(() => {
    const ticketId = selectedTicket?._id || selectedTicket?.id;
    if (!ticketId) return;
    setStatusInput(selectedTicket.status || 'open');
    loadMessages(ticketId);
    loadHistory(ticketId);
  }, [selectedTicket]);

  const handleUpdateStatus = async () => {
    const user = getStoredUser();
    const ticketId = selectedTicket?._id || selectedTicket?.id;
    if (!ticketId) return;
    try {
      await api.patch(`/support/ticket/${ticketId}/status`, {
        status: statusInput,
        actor_id: user?._id || staffId,
        actor_role: 'employee'
      });
      loadTickets();
      loadHistory(ticketId);
    } catch {
      setAlert({ type: 'danger', message: 'Update status failed.' });
    }
  };

  const handleAssign = async () => {
    const user = getStoredUser();
    const ticketId = selectedTicket?._id || selectedTicket?.id;
    if (!ticketId || !staffId) return;
    try {
      await api.patch(`/support/ticket/${ticketId}/assign`, {
        staff_id: staffId,
        actor_id: user?._id || staffId,
        actor_role: 'employee'
      });
      loadTickets();
      loadHistory(ticketId);
    } catch {
      setAlert({ type: 'danger', message: 'Assign ticket failed.' });
    }
  };

  const handleSendMessage = async () => {
    const user = getStoredUser();
    const ticketId = selectedTicket?._id || selectedTicket?.id;
    if (!ticketId || !chatInput.trim()) return;
    try {
      await api.post(`/support/ticket/${ticketId}/message`, {
        sender_id: user?._id || staffId,
        sender_role: 'employee',
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
    <div className="admin-page">
      <h2 className="mb-3">Support Desk</h2>
      {alert && <div className={`alert alert-${alert.type}`}>{alert.message}</div>}

      <div className="row g-3">
        <div className="col-lg-4">
          <div className="card card-body mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Tickets</h6>
              <button className="btn btn-sm btn-outline-primary" onClick={loadTickets}>
                Refresh
              </button>
            </div>
          </div>

          {tickets.length === 0 ? (
            <div className="text-muted">No tickets found.</div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {tickets.map((t) => {
                const isActive = (selectedTicket?._id || selectedTicket?.id) === (t._id || t.id);
                return (
                  <button
                    key={t._id || t.id}
                    type="button"
                    className={`text-start p-2 rounded border ${isActive ? 'border-primary' : 'border-light'} bg-light`}
                    onClick={() => setSelectedTicket(t)}
                  >
                    <div className="fw-bold">{t.title}</div>
                    <div className="text-muted small">{t.user_id}</div>
                    <div className="small">Status: {t.status}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="col-lg-8">
          {!selectedTicket ? (
            <div className="text-muted">Select a ticket to manage.</div>
          ) : (
            <div className="card card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <div className="fw-bold">{selectedTicket.title}</div>
                  <div className="text-muted">{selectedTicket.message}</div>
                  <div className="small text-muted">User: {selectedTicket.user_id}</div>
                </div>
                <div className="badge text-bg-secondary">{selectedTicket.status}</div>
              </div>

              <div className="row g-2 align-items-end mb-3">
                <div className="col-md-4">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <button className="btn btn-outline-primary w-100" onClick={handleUpdateStatus}>
                    Update
                  </button>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Assign To (employee id)</label>
                  <input
                    className="form-control"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    placeholder="employee_id"
                  />
                </div>
                <div className="col-md-2">
                  <button className="btn btn-outline-secondary w-100" onClick={handleAssign}>
                    Assign
                  </button>
                </div>
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

              <div className="d-flex gap-2 mb-4">
                <input
                  className="form-control"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a reply..."
                />
                <button className="btn btn-outline-primary" type="button" onClick={handleSendMessage}>
                  Send
                </button>
              </div>

              <div>
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
  );
}
