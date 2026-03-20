import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getStoredUser } from '../services/api.js';

const extractItems = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.cart?.items)) return data.cart.items;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  return [];
};

const getPaidIds = () => {
  try {
    const raw = localStorage.getItem('paidOrderIds');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const formatMoney = (value) => {
  const amount = Number(value || 0);
  return `${amount.toLocaleString('vi-VN')} VND`;
};

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [creating, setCreating] = useState(false);

  const loadOrders = () => {
    api.get('/orders/my')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
        const paidIds = getPaidIds();
        setOrders(data.filter((o) => !paidIds.includes(o._id || o.id)));
      })
      .catch(() => setOrders([]));
  };

  const loadCart = (userId) => {
    api.get(`/cart/${userId}`)
      .then((res) => {
        setCartItems(extractItems(res.data));
      })
      .catch(() => setCartItems([]));
  };

  useEffect(() => {
    const user = getStoredUser();
    if (!user?._id) {
      setOrders([]);
      setCartItems([]);
      setLoading(false);
      return;
    }
    loadOrders();
    loadCart(user._id);
    setLoading(false);
  }, []);

  useEffect(() => {
    const onPaid = (event) => {
      const paidId = event?.detail?.orderId;
      if (paidId) {
        setOrders((prev) => prev.filter((o) => (o._id || o.id) !== paidId));
      }
    };
    window.addEventListener('orderPaid', onPaid);
    return () => window.removeEventListener('orderPaid', onPaid);
  }, []);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);
  }, [cartItems]);

  const handleCreateOrder = async () => {
    setAlert(null);
    const user = getStoredUser();
    if (!user?._id || cartItems.length === 0) return;
    setCreating(true);
    try {
      const payload = {
        user_id: user._id,
        items: cartItems.map((i) => ({
          product_id: i.product_id,
          product_name: i.product_name,
          price: i.price,
          quantity: i.quantity || 1
        })),
        status: 'pending'
      };
      const res = await api.post('/orders', payload);
      const order = res.data?.order || res.data || null;
      if (order) {
        localStorage.setItem('lastOrder', JSON.stringify(order));
      }
      setAlert({ type: 'success', message: 'Order created. You can proceed to payment.' });
      loadOrders();
      navigate('/checkout');
    } catch (err) {
      setAlert({ type: 'danger', message: 'Create order failed.' });
    } finally {
      setCreating(false);
    }
  };

  const handlePay = (order) => {
    localStorage.setItem('selectedOrder', JSON.stringify(order));
    navigate('/checkout');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="mb-3">My Orders</h2>
      {alert && (
        <div className={`alert alert-${alert.type}`}>{alert.message}</div>
      )}

      <div className="card card-body mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <div className="fw-bold">Cart summary</div>
            <div className="text-muted">Items: {cartItems.length} | Total: {cartTotal}</div>
          </div>
          <button className="btn btn-primary" onClick={handleCreateOrder} disabled={creating || cartItems.length === 0}>
            {creating ? 'Creating...' : 'Order'}
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-muted">No orders found.</div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {orders.map((o) => (
            <div key={o._id || o.id} className="card card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-bold">Order #{o._id || o.id}</div>
                  <div className="text-muted">Status: {o.status || 'pending'}</div>
                </div>
                <div className="fw-bold">Total: {formatMoney(o.total_price || o.total)}</div>
              </div>
              {Array.isArray(o.items) && o.items.length > 0 && (
                <ul className="list-group mt-3">
                  {o.items.map((i, idx) => (
                    <li key={idx} className="list-group-item d-flex justify-content-between">
                      <span>{i.product_name}</span>
                      <span>{i.quantity} x {i.price}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3">
                <button className="btn btn-outline-primary" onClick={() => handlePay(o)}>Payment</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
