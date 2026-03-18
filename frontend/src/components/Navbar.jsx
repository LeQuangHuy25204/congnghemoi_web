import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { clearAuth, getStoredUser } from '../services/api.js';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser());

  useEffect(() => {
    const sync = () => setUser(getStoredUser());
    sync();
    window.addEventListener('authChanged', sync);
    return () => window.removeEventListener('authChanged', sync);
  }, [location.pathname]);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const role = user?.role;

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light border-bottom">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">Shop</Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="mainNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {role !== 'employee' && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/">Home</NavLink>
              </li>
            )}
            {role === 'customer' && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/cart">Cart</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/orders">Orders</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/support">Support</NavLink>
                </li>
              </>
            )}
            {role === 'admin' && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/admin/products">Products</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/admin/users">Users</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/admin/orders">Orders</NavLink>
                </li>
              </>
            )}
            {role === 'employee' && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/employee/support">Support Desk</NavLink>
              </li>
            )}
            <li className="nav-item">
              <NavLink className="nav-link" to="/chatbot">Chatbot</NavLink>
            </li>
          </ul>
          {user ? (
            <div className="d-flex align-items-center gap-2">
              <Link className="text-decoration-none text-muted" to="/profile">
                {user.name || user.email} ({role})
              </Link>
              <button className="btn btn-outline-secondary" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <div className="d-flex gap-2">
              <NavLink className="btn btn-outline-primary" to="/login">Login</NavLink>
              <NavLink className="btn btn-primary" to="/register">Register</NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
