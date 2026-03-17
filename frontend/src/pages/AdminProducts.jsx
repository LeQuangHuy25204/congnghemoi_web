import { useEffect, useState } from 'react';
import api from '../services/api.js';

const emptyForm = {
  name: '',
  category: '',
  brand: '',
  price: '',
  stock: '',
  image: ''
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [alert, setAlert] = useState(null);

  const loadProducts = () => {
    api.get('/products')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setProducts(data);
      })
      .catch(() => setProducts([]));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEdit = (p) => {
    setEditingId(p.id || p._id);
    setForm({
      name: p.name || '',
      category: p.category || '',
      brand: p.brand || '',
      price: p.price || '',
      stock: p.stock || '',
      image: p.image || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, {
          ...form,
          price: Number(form.price),
          stock: Number(form.stock)
        });
        setAlert({ type: 'success', message: 'Update success.' });
      } else {
        await api.post('/products', {
          ...form,
          price: Number(form.price),
          stock: Number(form.stock)
        });
        setAlert({ type: 'success', message: 'Create success.' });
      }
      setForm(emptyForm);
      setEditingId(null);
      loadProducts();
    } catch (err) {
      setAlert({ type: 'danger', message: 'Save failed.' });
    }
  };

  const handleDelete = async (id) => {
    setAlert(null);
    try {
      await api.delete(`/products/${id}`);
      setAlert({ type: 'success', message: 'Delete success.' });
      loadProducts();
    } catch (err) {
      setAlert({ type: 'danger', message: 'Delete failed.' });
    }
  };

  return (
    <div className="admin-page">
      <h2 className="mb-3">Product Management</h2>
      {alert && (
        <div className={`alert alert-${alert.type}`}>{alert.message}</div>
      )}

      <div className="row g-4">
        <div className="col-md-5">
          <form onSubmit={handleSubmit} className="card card-body">
            <h5 className="mb-3">{editingId ? 'Edit Product' : 'Create Product'}</h5>
            <div className="mb-2">
              <label className="form-label">Name</label>
              <input className="form-control" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="mb-2">
              <label className="form-label">Category</label>
              <input className="form-control" name="category" value={form.category} onChange={handleChange} />
            </div>
            <div className="mb-2">
              <label className="form-label">Brand</label>
              <input className="form-control" name="brand" value={form.brand} onChange={handleChange} />
            </div>
            <div className="mb-2">
              <label className="form-label">Price</label>
              <input type="number" className="form-control" name="price" value={form.price} onChange={handleChange} required />
            </div>
            <div className="mb-2">
              <label className="form-label">Stock</label>
              <input type="number" className="form-control" name="stock" value={form.stock} onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Image URL</label>
              <input className="form-control" name="image" value={form.image} onChange={handleChange} />
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-primary" type="submit">
                {editingId ? 'Update' : 'Create'}
              </button>
              {editingId && (
                <button className="btn btn-outline-secondary" type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="col-md-7">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id || p._id}>
                    <td>{p.name}</td>
                    <td>{p.price}</td>
                    <td>{p.stock}</td>
                    <td className="d-flex gap-2">
                      <button className="btn btn-outline-primary btn-sm" onClick={() => handleEdit(p)}>Edit</button>
                      <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(p.id || p._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
