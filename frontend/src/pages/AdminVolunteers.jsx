import { useEffect, useState } from 'react';
import { getAdminDashboard, approveVolunteer, deployVolunteer } from '../api';

export default function AdminVolunteers() {
    const [dashboard, setDashboard] = useState(null);
    const [assignments, setAssignments] = useState({});
    const [notice, setNotice] = useState(null);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState('');

    const refreshDashboard = async () => {
        setDashboard(await getAdminDashboard());
    };

    useEffect(() => {
        getAdminDashboard()
            .then(setDashboard)
            .catch((err) => setError(err.message));
    }, []);

    const runAction = async (vol, action) => {
        setError('');
        setNotice(null);
        setBusyId(vol.id);
        try {
            const result = action === 'approve'
                ? await approveVolunteer(vol.id)
                : await deployVolunteer(vol.id, assignments[vol.id]);
            setNotice(result.message);
            await refreshDashboard();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId('');
        }
    };

    return (
        <div className="content-wrapper">
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <span className="badge-label">Volunteer Roster</span>
                        <h1>Volunteer Management</h1>
                        <p>Review applications, approve volunteers, and assign them to active requests.</p>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>
                        {dashboard?.volunteers.length ?? '...'} records
                    </span>
                </div>
            </div>

            {notice && <div className="alert alert-success" role="status" aria-live="polite">{notice}</div>}
            {error && <div className="alert alert-error" role="alert">{error}</div>}

            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Volunteer</th>
                            <th>Contact</th>
                            <th>Location</th>
                            <th>Skill</th>
                            <th>Status</th>
                            <th>Assigned Request</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dashboard?.volunteers.map((vol) => (
                            <tr key={vol.id}>
                                <td>
                                    <div className="cell-name"><strong>{vol.name}</strong></div>
                                    <div className="cell-sub">{vol.id}</div>
                                </td>
                                <td>
                                    <a href={`mailto:${vol.email}`} style={{ color: 'var(--primary)' }}>{vol.email}</a>
                                    <div className="cell-sub">{vol.phone}</div>
                                </td>
                                <td>{vol.location}</td>
                                <td>{vol.skill}</td>
                                <td>
                                    <span className={`badge status-badge badge-${vol.status.toLowerCase()} status-${vol.status.toLowerCase()}`}>
                                        {vol.status}
                                    </span>
                                </td>
                                <td>
                                    {vol.assignedRequestId || <span style={{ color: 'var(--light-text)' }}>Not assigned</span>}
                                </td>
                                <td className="cell-actions">
                                    {vol.status === 'Pending' && (
                                        <button className="btn btn-primary btn-sm" type="button" disabled={busyId === vol.id} onClick={() => runAction(vol, 'approve')}>
                                            {busyId === vol.id ? 'Saving...' : 'Approve'}
                                        </button>
                                    )}
                                    {vol.status === 'Approved' && (
                                        <div className="action-row" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <select className="form-select form-select-sm" aria-label={`Relief request for ${vol.name}`} value={assignments[vol.id] || ''} onChange={(e) => setAssignments((a) => ({ ...a, [vol.id]: e.target.value }))}>
                                                <option value="">Choose request</option>
                                                {dashboard.activeRequests.map((req) => (
                                                    <option key={req.id} value={req.id}>{req.id} · {req.title}</option>
                                                ))}
                                            </select>
                                            <button className="btn btn-primary btn-sm" type="button" disabled={!assignments[vol.id] || busyId === vol.id} onClick={() => runAction(vol, 'deploy')}>
                                                {busyId === vol.id ? 'Saving...' : 'Deploy'}
                                            </button>
                                        </div>
                                    )}
                                    {vol.status === 'Deployed' && (
                                        <span style={{ color: 'var(--light-text)', fontSize: '0.82rem' }}>Deployed</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {dashboard && dashboard.volunteers.length === 0 && (
                            <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>No volunteers have registered yet.</td></tr>
                        )}
                        {!dashboard && (
                            <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Loading volunteer records...</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
