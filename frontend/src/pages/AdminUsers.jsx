import { useState } from 'react';
import api from '../services/api.js';

export default function AdminUsers() {
  const [verifyToken, setVerifyToken] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState(null);

  const handleVerifyUser = async () => {
    setVerifyError(null);
    setVerifyResult(null);
    try {
      const res = await api.get('/auth/verify', {
        headers: { Authorization: `Bearer ${verifyToken}` }
      });
      setVerifyResult(res.data?.user || res.data);
    } catch (err) {
      setVerifyError('Verify failed. Token invalid or expired.');
    }
  };

  return (
    <div className="admin-page">
      <h2 className="mb-3">User Management</h2>
      <div className="row justify-content-start">
        <div className="col-lg-7 col-md-9">
          <div className="card card-body">
            <h5 className="mb-3">Verify User Token</h5>
            <div className="mb-2">
              <label className="form-label">User JWT Token</label>
              <input
                className="form-control"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                placeholder="Paste token here"
              />
            </div>
            <button className="btn btn-outline-primary" onClick={handleVerifyUser}>Verify</button>
            {verifyResult && (
              <div className="mt-3">
                <div className="fw-bold">User</div>
                <div className="text-muted">{verifyResult.email} | {verifyResult.role}</div>
              </div>
            )}
            {verifyError && <div className="text-danger mt-2">{verifyError}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
