import { useEffect, useState } from 'react';
import api, { getStoredUser, setStoredUser } from '../services/api.js';

export default function Profile() {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', shippingAddress: '' });

  const syncForm = (nextUser) => {
    setForm({
      name: nextUser?.name || '',
      email: nextUser?.email || '',
      phone: nextUser?.phone || '',
      shippingAddress: nextUser?.shippingAddress || ''
    });
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/auth/verify');
        const nextUser = res.data?.user || res.data || null;
        if (nextUser) {
          setUser(nextUser);
          setStoredUser(nextUser);
          syncForm(nextUser);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Cannot load user profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.put('/auth/me', form);
      const updatedUser = res.data?.user || null;
      if (updatedUser) {
        setUser(updatedUser);
        setStoredUser(updatedUser);
        syncForm(updatedUser);
      }
      setSuccess('Profile updated successfully.');
      setEditMode(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Update profile failed.');
    } finally {
      setSaving(false);
    }
  };

  const canEditProfile = user?.role === 'customer';

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8 col-md-10">
        <h2 className="mb-3">User Profile</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <div className="card card-body">
          {loading ? (
            <div>Loading profile...</div>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="text-muted small">Customers can edit personal contact and shipping information.</div>
                {canEditProfile && !editMode && (
                  <button className="btn btn-outline-primary btn-sm" onClick={() => setEditMode(true)}>
                    Edit Profile
                  </button>
                )}
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label text-muted">Name</label>
                  {editMode && canEditProfile ? (
                    <input className="form-control" name="name" value={form.name} onChange={handleChange} />
                  ) : (
                    <div className="fw-semibold">{user?.name || '-'}</div>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted">Email</label>
                  {editMode && canEditProfile ? (
                    <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} />
                  ) : (
                    <div className="fw-semibold">{user?.email || '-'}</div>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted">Role</label>
                  <div className="fw-semibold text-capitalize">{user?.role || '-'}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted">Status</label>
                  <div className={`fw-semibold ${user?.isActive === false ? 'text-danger' : 'text-success'}`}>
                    {user?.isActive === false ? 'Locked' : 'Active'}
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted">Phone Number</label>
                  {editMode && canEditProfile ? (
                    <input className="form-control" name="phone" value={form.phone} onChange={handleChange} />
                  ) : (
                    <div className="fw-semibold">{user?.phone || '-'}</div>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted">Shipping Address</label>
                  {editMode && canEditProfile ? (
                    <textarea className="form-control" rows={3} name="shippingAddress" value={form.shippingAddress} onChange={handleChange} />
                  ) : (
                    <div className="fw-semibold">{user?.shippingAddress || '-'}</div>
                  )}
                </div>
              </div>

              {editMode && canEditProfile && (
                <div className="mt-3 d-flex gap-2">
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      syncForm(user);
                      setEditMode(false);
                      setError('');
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
