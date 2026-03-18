import { useEffect, useState } from 'react';
import api from '../services/api.js';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editForm, setEditForm] = useState({ name: '', phone: '', shippingAddress: '', role: 'customer' });

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data?.users || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Cannot load users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const beginEdit = (user) => {
    setSuccess('');
    setError('');
    setEditingId(user._id);
    setEditForm({
      name: user.name || '',
      phone: user.phone || '',
      shippingAddress: user.shippingAddress || '',
      role: user.role || 'customer'
    });
  };

  const cancelEdit = () => {
    setEditingId('');
    setEditForm({ name: '', phone: '', shippingAddress: '', role: 'customer' });
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const saveEdit = async (userId) => {
    setSuccess('');
    setError('');
    try {
      await api.put(`/auth/users/${userId}`, editForm);
      setSuccess('User updated successfully.');
      cancelEdit();
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Update user failed.');
    }
  };

  const toggleStatus = async (user) => {
    setSuccess('');
    setError('');
    try {
      await api.patch(`/auth/users/${user._id}/status`, { isActive: !user.isActive });
      setSuccess(`User ${user.isActive ? 'locked' : 'activated'} successfully.`);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Update status failed.');
    }
  };

  return (
    <div className="admin-page">
      <h2 className="mb-3">User Management</h2>
      <div className="card card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">All Users In Database</h5>
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchUsers} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}
        {success && <div className="alert alert-success py-2">{success}</div>}

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Shipping Address</th>
                <th>Role</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">No users found.</td>
                </tr>
              )}
              {users.map((user) => {
                const isEditing = editingId === user._id;
                return (
                  <tr key={user._id}>
                    <td>
                      {isEditing ? (
                        <input className="form-control form-control-sm" name="name" value={editForm.name} onChange={handleEditChange} />
                      ) : (
                        user.name || '-'
                      )}
                    </td>
                    <td>{user.email}</td>
                    <td>
                      {isEditing ? (
                        <input className="form-control form-control-sm" name="phone" value={editForm.phone} onChange={handleEditChange} />
                      ) : (
                        user.phone || '-'
                      )}
                    </td>
                    <td style={{ minWidth: '220px' }}>
                      {isEditing ? (
                        <textarea className="form-control form-control-sm" rows="2" name="shippingAddress" value={editForm.shippingAddress} onChange={handleEditChange} />
                      ) : (
                        user.shippingAddress || '-'
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select className="form-select form-select-sm" name="role" value={editForm.role} onChange={handleEditChange}>
                          <option value="customer">customer</option>
                          <option value="employee">employee</option>
                          <option value="admin">admin</option>
                        </select>
                      ) : (
                        <span className="text-capitalize">{user.role}</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${user.isActive === false ? 'bg-danger' : 'bg-success'}`}>
                        {user.isActive === false ? 'Locked' : 'Active'}
                      </span>
                    </td>
                    <td className="text-end">
                      {isEditing ? (
                        <div className="d-flex justify-content-end gap-2">
                          <button className="btn btn-sm btn-primary" onClick={() => saveEdit(user._id)}>Save</button>
                          <button className="btn btn-sm btn-outline-secondary" onClick={cancelEdit}>Cancel</button>
                        </div>
                      ) : (
                        <div className="d-flex justify-content-end gap-2">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => beginEdit(user)}>Edit</button>
                          <button
                            className={`btn btn-sm ${user.isActive === false ? 'btn-outline-success' : 'btn-outline-danger'}`}
                            onClick={() => toggleStatus(user)}
                          >
                            {user.isActive === false ? 'Activate' : 'Lock'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
