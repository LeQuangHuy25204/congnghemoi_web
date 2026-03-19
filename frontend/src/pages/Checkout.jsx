import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getStoredUser } from '../services/api.js';

const getPaidIds = () => {
  try {
    const raw = localStorage.getItem('paidOrderIds');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const addPaidId = (id) => {
  const current = getPaidIds();
  if (!current.includes(id)) {
    const next = [...current, id];
    localStorage.setItem('paidOrderIds', JSON.stringify(next));
  }
};

export default function Checkout() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ method: 'momo' });
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const selected = localStorage.getItem('selectedOrder');
  const stored = localStorage.getItem('lastOrder');
  const order = selected ? JSON.parse(selected) : stored ? JSON.parse(stored) : null;

  const amount = useMemo(() => {
    if (!order) return 0;
    if (order.total_price) return order.total_price;
    if (order.total) return order.total;
    if (Array.isArray(order.items)) {
      return order.items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);
    }
    return 0;
  }, [order]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);
    try {
      const user = getStoredUser();
      if (!user?._id || !order?._id) {
        setAlert({ type: 'danger', message: 'Missing order information.' });
        setLoading(false);
        return;
      }
      await api.post('/payment', {
        order_id: order._id,
        user_id: user._id,
        amount,
        method: form.method,
        status: 'pending'
      });
      addPaidId(order._id);
      localStorage.removeItem('lastOrder');
      localStorage.removeItem('selectedOrder');
      window.dispatchEvent(new CustomEvent('orderPaid', { detail: { orderId: order._id } }));
      setAlert({ type: 'success', message: 'Payment recorded.' });
      navigate('/orders');
    } catch (err) {
      setAlert({ type: 'danger', message: 'Payment failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <h2 className="mb-3">Payment</h2>
        {!order ? (
          <div className="text-muted">No order selected. Please create an order first.</div>
        ) : (
          <>
            <div className="card card-body mb-3">
              <div className="d-flex justify-content-between">
                <span>Order ID</span>
                <span className="fw-bold">{order._id}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Amount</span>
                <span className="fw-bold">{amount}</span>
              </div>
            </div>
            {alert && (
              <div className={`alert alert-${alert.type}`}>{alert.message}</div>
            )}
            <form onSubmit={handleSubmit} className="card card-body">
              <div className="mb-3">
                <label className="form-label">Method</label>
                <select className="form-select" name="method" value={form.method} onChange={handleChange}>
                  <option value="momo">momo</option>
                  <option value="cod">cod</option>
                  <option value="bank">bank</option>
                </select>
              </div>
              <div className="text-muted mb-3">Status is set automatically by the system.</div>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? 'Processing...' : 'Pay'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
