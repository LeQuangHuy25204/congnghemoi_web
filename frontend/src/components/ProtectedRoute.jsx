import { Navigate, Outlet } from 'react-router-dom';
import { getStoredToken, getStoredUser } from '../services/api.js';

export default function ProtectedRoute({ role }) {
  const token = getStoredToken();
  const user = getStoredUser();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
