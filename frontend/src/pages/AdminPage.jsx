import { useEffect, useState } from 'react';
import { approveVolunteer, deployVolunteer, getAdminDashboard } from '../api';

const AdminPage = () => {
    const [dashboard, setDashboard] = useState(null);
    const [assignments, setAssignments] = useState({});
    const [notice, setNotice] = useState(null);
    const [error, setError] = useState('');
    const [busyVolunteerId, setBusyVolunteerId] = useState('');

    const refreshDashboard = async () => {
        setDashboard(await getAdminDashboard());
    };

    useEffect(() => {
        getAdminDashboard()
            .then(setDashboard)
            .catch((requestError) => setError(requestError.message));
    }, []);

    const runWorkflowAction = async (volunteer, action) => {
        setError('');
        setNotice(null);
        setBusyVolunteerId(volunteer.id);
        try {
            const result = action === 'approve'
                ? await approveVolunteer(volunteer.id)
                : await deployVolunteer(volunteer.id, assignments[volunteer.id]);
            setNotice(result.message);
            await refreshDashboard();
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setBusyVolunteerId('');
        }
    };

    const metrics = dashboard?.metrics;

    return <main className="container app-main admin-main">
        <div className="page-heading">
            <div><p className="eyebrow mb-2">OPERATIONS</p><h1>Admin dashboard</h1><p className="text-secondary mb-0">Review volunteer applications and coordinate deployments.</p></div>
            <span className="system-status">Live operations</span>
        </div>
        {notice && <div className="alert alert-success" role="status" aria-live="polite">{notice}</div>}
        {error && <div className="alert alert-danger" role="alert">{error}</div>}

        <section className="row g-3 mb-5" aria-label="Volunteer and request summary">
            <Metric label="Total volunteers" value={metrics?.totalVolunteers} />
            <Metric label="Pending approvals" value={metrics?.pendingApprovals} />
            <Metric label="Approved volunteers" value={metrics?.approvedVolunteers} />
            <Metric label="Deployed volunteers" value={metrics?.deployedVolunteers} />
            <Metric label="Active requests" value={metrics?.activeRequests} />
        </section>

        <section>
            <div className="section-heading admin-table-heading"><div><p className="eyebrow mb-1">VOLUNTEER ROSTER</p><h2>Volunteer master table</h2></div><span className="small text-secondary">{dashboard?.volunteers.length ?? '...'} records</span></div>
            <div className="table-responsive admin-table-wrap">
                <table className="table align-middle mb-0">
                    <thead><tr><th scope="col">Volunteer</th><th scope="col">Contact</th><th scope="col">Location</th><th scope="col">Skill</th><th scope="col">Status</th><th scope="col">Assigned request</th><th scope="col">Action</th></tr></thead>
                    <tbody>
                        {dashboard?.volunteers.map((volunteer) => <tr key={volunteer.id}>
                            <td><strong>{volunteer.name}</strong><small className="d-block text-secondary">{volunteer.id}</small></td>
                            <td><a href={`mailto:${volunteer.email}`}>{volunteer.email}</a><small className="d-block text-secondary">{volunteer.phone}</small></td>
                            <td>{volunteer.location}</td>
                            <td>{volunteer.skill}</td>
                            <td><span className={`status-badge status-${volunteer.status.toLowerCase()}`}>{volunteer.status}</span></td>
                            <td>{volunteer.assignedRequestId || <span className="text-secondary">Not assigned</span>}</td>
                            <td className="workflow-actions">
                                {volunteer.status === 'Pending' && <button className="btn btn-sm btn-success" type="button" disabled={busyVolunteerId === volunteer.id} onClick={() => runWorkflowAction(volunteer, 'approve')}>{busyVolunteerId === volunteer.id ? 'Saving...' : 'Approve'}</button>}
                                {volunteer.status === 'Approved' && <div className="d-flex gap-2 align-items-center"><select className="form-select form-select-sm" aria-label={`Relief request for ${volunteer.name}`} value={assignments[volunteer.id] || ''} onChange={(event) => setAssignments((current) => ({ ...current, [volunteer.id]: event.target.value }))}><option value="">Choose request</option>{dashboard.activeRequests.map((reliefRequest) => <option key={reliefRequest.id} value={reliefRequest.id}>{reliefRequest.id} · {reliefRequest.title}</option>)}</select><button className="btn btn-sm btn-success" type="button" disabled={!assignments[volunteer.id] || busyVolunteerId === volunteer.id} onClick={() => runWorkflowAction(volunteer, 'deploy')}>{busyVolunteerId === volunteer.id ? 'Saving...' : 'Deploy'}</button></div>}
                                {volunteer.status === 'Deployed' && <span className="text-secondary small">Deployed</span>}
                            </td>
                        </tr>)}
                        {dashboard && dashboard.volunteers.length === 0 && <tr><td colSpan="7" className="empty-table">No volunteers have registered yet.</td></tr>}
                        {!dashboard && <tr><td colSpan="7" className="empty-table">Loading volunteer records...</td></tr>}
                    </tbody>
                </table>
            </div>
        </section>
    </main>;
};

function Metric({ label, value }) {
    return <div className="col-6 col-lg"><div className="metric admin-metric"><span>{label}</span><strong>{value ?? '—'}</strong></div></div>;
}

export default AdminPage;