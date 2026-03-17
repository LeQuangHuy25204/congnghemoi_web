import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getStoredUser } from '../services/api.js';

const extractItems = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.cart?.items)) return data.cart.items;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  return [];
};

export default function Cart() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const loadCart = () => {
    const user = getStoredUser();
    if (!user?._id) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    api.get(`/cart/${user._id}`)
      .then((res) => {
        setItems(extractItems(res.data));
      })
      .catch(() => {
        setItems([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCart();
  }, []);

  const handleUpdate = async (productId, quantity) => {
    setAlert(null);
    const user = getStoredUser();
    try {
      await api.put('/cart/update', { user_id: user._id, product_id: productId, quantity });
      setAlert({ type: 'success', message: 'Update success.' });
      loadCart();
    } catch (err) {
      setAlert({ type: 'danger', message: 'Update failed.' });
    }
  };

  const handleRemove = async (productId) => {
    setAlert(null);
    const user = getStoredUser();
    try {
      await api.delete('/cart/remove', { data: { user_id: user._id, product_id: productId } });
      setAlert({ type: 'success', message: 'Delete success.' });
      loadCart();
    } catch (err) {
      setAlert({ type: 'danger', message: 'Delete failed.' });
    }
  };

  const total = useMemo(() => {
    return items.reduce((sum, i) => {
      const price = i.price || 0;
      const qty = i.quantity || 1;
      return sum + price * qty;
    }, 0);
  }, [items]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="mb-3">Shopping Cart</h2>
      {alert && (
        <div className={`alert alert-${alert.type}`}>{alert.message}</div>
      )}
      {items.length === 0 ? (
        <div className="text-muted">Cart is empty.</div>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => {
                const id = i.product_id || i.productId || i.id || i._id;
                const name = i.product_name || i.productName || 'Item';
                const price = i.price || 0;
                return (
                  <tr key={id}>
                    <td>{name}</td>
                    <td>{price}</td>
                    <td style={{ maxWidth: 120 }}>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        defaultValue={i.quantity || 1}
                        onBlur={(e) => handleUpdate(id, Number(e.target.value) || 1)}
                      />
                    </td>
                    <td>
                      <button className="btn btn-outline-danger btn-sm" onClick={() => handleRemove(id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="fw-bold">Total: {total}</div>
        <Link className="btn btn-primary" to="/orders">Order</Link>
      </div>
    </div>
  );
}
