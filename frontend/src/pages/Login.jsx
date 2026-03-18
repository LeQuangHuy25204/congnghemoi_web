import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { normalizeUser, setStoredUser } from '../services/api.js';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      const token = res.data?.token || res.data?.accessToken;
      if (token) {
        localStorage.setItem('token', token);
      }

      let user = normalizeUser(res.data?.user || res.data?.data || null);
      if (!user && token) {
        try {
          const verify = await api.get('/auth/verify');
          user = normalizeUser(verify.data?.user || verify.data || null);
        } catch {
          user = null;
        }
      }

      if (!user) {
        user = { email: form.email, role: 'customer', _id: 'unknown' };
      }

      setStoredUser(user);
      setAlert({ type: 'success', message: 'Login success.' });
      navigate(user.role === 'admin' ? '/admin/users' : '/');
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Login failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-5">
        <h2 className="mb-3">Login</h2>
        {alert && (
          <div className={`alert alert-${alert.type}`}>{alert.message}</div>
        )}
        <form onSubmit={handleSubmit} className="card card-body">
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
        <div className="mt-3">
          No account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}
