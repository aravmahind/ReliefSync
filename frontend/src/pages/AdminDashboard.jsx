import { useEffect, useState } from 'react';
import { getAdminDashboard, createReliefRequest, closeReliefRequest, approveVolunteer, deployVolunteer } from '../api';
import { useAuth } from '../context/AuthContext';

const skills = ['Medical', 'Rescue', 'Food Distribution', 'First Aid'];
const initialRequest = { title: '', location: '', skillRequired: '', urgency: 'Medium', volunteersNeeded: '1' };

export default function AdminDashboard() {
    const { user } = useAuth();
    const [dashboard, setDashboard] = useState(null);
    const [assignments, setAssignments] = useState({});
    const [requestValues, setRequestValues] = useState(initialRequest);
    const [notice, setNotice] = useState(null);
    const [error, setError] = useState('');
    const [busyVolunteerId, setBusyVolunteerId] = useState('');
    const [busyRequestId, setBusyRequestId] = useState('');
    const [creating, setCreating] = useState(false);

    const refreshDashboard = async () => {
        setDashboard(await getAdminDashboard());
    };

    useEffect(() => {
        getAdminDashboard()
            .then(setDashboard)
            .catch((err) => setError(err.message));
    }, []);

    const submitRequest = async (e) => {
        e.preventDefault();
        setError('');
        setNotice(null);
        setCreating(true);
        try {
            const result = await createReliefRequest({
                ...requestValues,
                volunteersNeeded: Number(requestValues.volunteersNeeded),
            });
            setNotice(result.message);
            setRequestValues(initialRequest);
            await refreshDashboard();
        } catch (err) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    const closeRequest = async (req) => {
        setError('');
        setNotice(null);
        setBusyRequestId(req.id);
        try {
            const result = await closeReliefRequest(req.id);
            setNotice(result.message);
            setAssignments((current) => Object.fromEntries(
                Object.entries(current).filter(([, requestId]) => requestId !== req.id),
            ));
            await refreshDashboard();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyRequestId('');
        }
    };

    const runVolunteerAction = async (vol, action) => {
        setError('');
        setNotice(null);
        setBusyVolunteerId(vol.id);
        try {
            const result = action === 'approve'
                ? await approveVolunteer(vol.id)
                : await deployVolunteer(vol.id, assignments[vol.id]);
            setNotice(result.message);
            await refreshDashboard();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyVolunteerId('');
        }
    };

    const metrics = dashboard?.metrics;

    return (
        <div className="content-wrapper">
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <span className="badge-label">Operations</span>
                        <h1>Admin Dashboard</h1>
                        <p>{user ? `Welcome back, ${user.name}. Manage volunteers and coordinate deployments.` : 'Review volunteer applications and coordinate deployments.'}</p>
                    </div>
                    <span className="live-badge">Live operations</span>
                </div>
            </div>

            {notice && <div className="alert alert-success" role="status" aria-live="polite">{notice}</div>}
            {error && <div className="alert alert-error" role="alert">{error}</div>}

            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-label">Total Volunteers</div>
                    <div className="metric-value">{metrics?.totalVolunteers ?? '—'}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Pending Approvals</div>
                    <div className="metric-value">{metrics?.pendingApprovals ?? '—'}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Approved</div>
                    <div className="metric-value">{metrics?.approvedVolunteers ?? '—'}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Deployed</div>
                    <div className="metric-value">{metrics?.deployedVolunteers ?? '—'}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Active Requests</div>
                    <div className="metric-value">{metrics?.activeRequests ?? '—'}</div>
                </div>
            </div>

            <div className="section">
                <div className="section-title">
                    <div>
                        <span className="badge-label">Live Operations</span>
                        <h2>Relief Requests</h2>
                    </div>
                </div>

                <div className="two-col">
                    <form className="create-panel" onSubmit={submitRequest}>
                        <h3>Create a relief request</h3>
                        <div className="form-group">
                            <label className="form-label" htmlFor="request-title">Request title</label>
                            <input className="form-input" id="request-title" value={requestValues.title} onChange={(e) => setRequestValues((v) => ({ ...v, title: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="request-location">Location</label>
                            <input className="form-input" id="request-location" value={requestValues.location} onChange={(e) => setRequestValues((v) => ({ ...v, location: e.target.value }))} required />
                        </div>
                        <div className="panel-grid">
                            <div className="form-group">
                                <label className="form-label" htmlFor="request-skill">Skill needed</label>
                                <select className="form-select" id="request-skill" value={requestValues.skillRequired} onChange={(e) => setRequestValues((v) => ({ ...v, skillRequired: e.target.value }))} required>
                                    <option value="" disabled>Choose skill</option>
                                    {skills.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="request-urgency">Urgency</label>
                                <select className="form-select" id="request-urgency" value={requestValues.urgency} onChange={(e) => setRequestValues((v) => ({ ...v, urgency: e.target.value }))}>
                                    {['High', 'Medium', 'Low'].map((u) => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="create-panel-footer">
                            <div className="form-group">
                                <label className="form-label" htmlFor="request-count">Volunteers needed</label>
                                <input className="form-input" id="request-count" type="number" min="1" step="1" value={requestValues.volunteersNeeded} onChange={(e) => setRequestValues((v) => ({ ...v, volunteersNeeded: e.target.value }))} required />
                            </div>
                            <button className="btn btn-primary" type="submit" disabled={creating}>
                                {creating ? 'Creating...' : 'Create request'}
                            </button>
                        </div>
                    </form>

                    <div className="active-list">
                        {dashboard?.activeRequests.map((req) => (
                            <article className="active-item active-request-row" key={req.id}>
                                <div>
                                    <span className="list-item-id request-id">{req.id}</span>
                                    <h3>{req.title}</h3>
                                    <p>{req.location} · {req.skillRequired} · {req.volunteersNeeded} needed</p>
                                </div>
                                <div className="active-item-actions">
                                    <span className={`badge badge-${req.urgency.toLowerCase()}`}>{req.urgency}</span>
                                    <button className="btn btn-outline btn-sm" type="button" disabled={busyRequestId === req.id} onClick={() => closeRequest(req)}>
                                        {busyRequestId === req.id ? 'Closing...' : 'Close request'}
                                    </button>
                                </div>
                            </article>
                        ))}
                        {dashboard && dashboard.activeRequests.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem' }}>
                                No active requests. Create one to open a response.
                            </div>
                        )}
                        {!dashboard && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem' }}>
                                Loading requests...
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="section" style={{ marginTop: '3rem' }}>
                <div className="section-title">
                    <div>
                        <span className="badge-label">Volunteer Roster</span>
                        <h2>Volunteer Master Table</h2>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>
                        {dashboard?.volunteers.length ?? '...'} records
                    </span>
                </div>

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
                                            <button className="btn btn-primary btn-sm" type="button" disabled={busyVolunteerId === vol.id} onClick={() => runVolunteerAction(vol, 'approve')}>
                                                {busyVolunteerId === vol.id ? 'Saving...' : 'Approve'}
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
                                                <button className="btn btn-primary btn-sm" type="button" disabled={!assignments[vol.id] || busyVolunteerId === vol.id} onClick={() => runVolunteerAction(vol, 'deploy')}>
                                                    {busyVolunteerId === vol.id ? 'Saving...' : 'Deploy'}
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
        </div>
    );
}
