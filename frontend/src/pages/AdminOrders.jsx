import { useState } from 'react';
import api from '../services/api.js';

export default function AdminOrders() {
  const [orderUserId, setOrderUserId] = useState('');
  const [orders, setOrders] = useState([]);
  const [orderAlert, setOrderAlert] = useState(null);
  const [statusForm, setStatusForm] = useState({ orderId: '', status: 'shipping' });

  const handleLoadOrders = async () => {
    setOrderAlert(null);
    if (!orderUserId) return;
    try {
      const res = await api.get(`/orders/${orderUserId}`);
      const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setOrders(data);
    } catch (err) {
      setOrderAlert({ type: 'danger', message: 'Load orders failed.' });
    }
  };

  const handleUpdateStatus = async () => {
    setOrderAlert(null);
    if (!statusForm.orderId) return;
    try {
      await api.put(`/orders/${statusForm.orderId}/status`, { status: statusForm.status });
      setOrderAlert({ type: 'success', message: 'Update order status success.' });
    } catch (err) {
      setOrderAlert({ type: 'danger', message: 'Update order status failed.' });
    }
  };

  return (
    <div className="admin-page">
      <h2 className="mb-3">Order Management</h2>
      <div className="row g-4">
        <div className="col-lg-7 col-md-9">
          <div className="card card-body mb-4">
            <h5 className="mb-3">Find Orders By User</h5>
            {orderAlert && (
              <div className={`alert alert-${orderAlert.type}`}>{orderAlert.message}</div>
            )}
            <div className="mb-2">
              <label className="form-label">User ID</label>
              <div className="d-flex gap-2">
                <input
                  className="form-control"
                  value={orderUserId}
                  onChange={(e) => setOrderUserId(e.target.value)}
                  placeholder="Enter user_id"
                />
                <button className="btn btn-outline-primary" onClick={handleLoadOrders}>Load</button>
              </div>
            </div>
            {orders.length > 0 && (
              <div className="mb-3">
                <div className="small text-muted">Orders: {orders.length}</div>
                <ul className="list-group mt-2">
                  {orders.map((o) => (
                    <li key={o._id || o.id} className="list-group-item d-flex justify-content-between">
                      <span>{o._id || o.id}</span>
                      <span>{o.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="card card-body">
            <div className="fw-bold mb-2">Update Order Status</div>
            <div className="mb-2">
              <label className="form-label">Order ID</label>
              <input
                className="form-control"
                value={statusForm.orderId}
                onChange={(e) => setStatusForm((prev) => ({ ...prev, orderId: e.target.value }))}
                placeholder="Enter order_id"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={statusForm.status}
                onChange={(e) => setStatusForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="pending">pending</option>
                <option value="shipping">shipping</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleUpdateStatus}>Update Status</button>
          </div>
        </div>
      </div>
    </div>
  );
}
