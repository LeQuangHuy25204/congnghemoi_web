import { useState } from 'react';
import api from '../services/api.js';

export default function EmployeeSupport() {
  const [userId, setUserId] = useState('');
  const [tickets, setTickets] = useState([]);
  const [alert, setAlert] = useState(null);

  const handleLoad = async () => {
    setAlert(null);
    if (!userId) return;
    try {
      const res = await api.get(`/support/tickets/${userId}`);
      const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setTickets(data);
    } catch (err) {
      setAlert({ type: 'danger', message: 'Load tickets failed.' });
      setTickets([]);
    }
  };

  return (
    <div className="admin-page">
      <h2 className="mb-3">Support Desk</h2>
      {alert && (
        <div className={`alert alert-${alert.type}`}>{alert.message}</div>
      )}
      <div className="row g-3">
        <div className="col-lg-7 col-md-9">
          <div className="card card-body">
            <label className="form-label">User ID</label>
            <div className="d-flex gap-2">
              <input
                className="form-control"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user_id"
              />
              <button className="btn btn-outline-primary" onClick={handleLoad}>Load</button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        {tickets.length === 0 ? (
          <div className="text-muted">No tickets found.</div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {tickets.map((t) => (
              <div key={t._id || t.id} className="card card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <div className="fw-bold">{t.title}</div>
                    <div className="text-muted">{t.message}</div>
                  </div>
                  <div className="text-muted">{t.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
