import { useEffect, useState } from 'react';
import { approveVolunteer, closeReliefRequest, createReliefRequest, deployVolunteer, getAdminDashboard } from '../api';

const skills = ['Medical', 'Rescue', 'Food Distribution', 'First Aid'];
const initialRequest = { title: '', location: '', skillRequired: '', urgency: 'Medium', volunteersNeeded: '1' };

const AdminPage = () => {
    const [dashboard, setDashboard] = useState(null);
    const [assignments, setAssignments] = useState({});
    const [requestValues, setRequestValues] = useState(initialRequest);
    const [notice, setNotice] = useState(null);
    const [error, setError] = useState('');
    const [busyVolunteerId, setBusyVolunteerId] = useState('');
    const [busyRequestId, setBusyRequestId] = useState('');
    const [creatingRequest, setCreatingRequest] = useState(false);

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

    const submitRequest = async (event) => {
        event.preventDefault();
        setError('');
        setNotice(null);
        setCreatingRequest(true);
        try {
            const result = await createReliefRequest({
                ...requestValues,
                volunteersNeeded: Number(requestValues.volunteersNeeded),
            });
            setNotice(result.message);
            setRequestValues(initialRequest);
            await refreshDashboard();
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setCreatingRequest(false);
        }
    };

    const closeRequest = async (reliefRequest) => {
        setError('');
        setNotice(null);
        setBusyRequestId(reliefRequest.id);
        try {
            const result = await closeReliefRequest(reliefRequest.id);
            setNotice(result.message);
            setAssignments((current) => Object.fromEntries(
                Object.entries(current).filter(([, requestId]) => requestId !== reliefRequest.id),
            ));
            await refreshDashboard();
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setBusyRequestId('');
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

        <section className="admin-requests-section mb-5">
            <div className="section-heading admin-table-heading"><div><p className="eyebrow mb-1">LIVE OPERATIONS</p><h2>Relief requests</h2></div></div>
            <div className="row g-4">
                <div className="col-lg-5">
                    <form className="request-create-form" onSubmit={submitRequest}>
                        <h3>Create a relief request</h3>
                        <div className="mb-3"><label className="form-label" htmlFor="request-title">Request title</label><input className="form-control" id="request-title" value={requestValues.title} onChange={(event) => setRequestValues((current) => ({ ...current, title: event.target.value }))} required /></div>
                        <div className="mb-3"><label className="form-label" htmlFor="request-location">Location</label><input className="form-control" id="request-location" value={requestValues.location} onChange={(event) => setRequestValues((current) => ({ ...current, location: event.target.value }))} required /></div>
                        <div className="row g-3 mb-3">
                            <div className="col-sm-6"><label className="form-label" htmlFor="request-skill">Skill needed</label><select className="form-select" id="request-skill" value={requestValues.skillRequired} onChange={(event) => setRequestValues((current) => ({ ...current, skillRequired: event.target.value }))} required><option value="" disabled>Choose a skill</option>{skills.map((skill) => <option key={skill} value={skill}>{skill}</option>)}</select></div>
                            <div className="col-sm-6"><label className="form-label" htmlFor="request-urgency">Urgency</label><select className="form-select" id="request-urgency" value={requestValues.urgency} onChange={(event) => setRequestValues((current) => ({ ...current, urgency: event.target.value }))}>{['High', 'Medium', 'Low'].map((urgency) => <option key={urgency} value={urgency}>{urgency}</option>)}</select></div>
                        </div>
                        <div className="request-create-footer"><div><label className="form-label" htmlFor="request-count">Volunteers needed</label><input className="form-control" id="request-count" type="number" min="1" step="1" value={requestValues.volunteersNeeded} onChange={(event) => setRequestValues((current) => ({ ...current, volunteersNeeded: event.target.value }))} required /></div><button className="btn btn-success" type="submit" disabled={creatingRequest}>{creatingRequest ? 'Creating...' : 'Create request'}</button></div>
                    </form>
                </div>
                <div className="col-lg-7">
                    <div className="active-request-list">
                        {dashboard?.activeRequests.map((reliefRequest) => <article className="active-request-row" key={reliefRequest.id}>
                            <div><span className="request-id">{reliefRequest.id}</span><h3>{reliefRequest.title}</h3><p>{reliefRequest.location} <span aria-hidden="true">·</span> {reliefRequest.skillRequired} <span aria-hidden="true">·</span> {reliefRequest.volunteersNeeded} needed</p></div>
                            <div className="active-request-actions"><span className={`urgency urgency-${reliefRequest.urgency.toLowerCase()}`}>{reliefRequest.urgency}</span><button className="btn btn-sm btn-outline-secondary" type="button" disabled={busyRequestId === reliefRequest.id} onClick={() => closeRequest(reliefRequest)}>{busyRequestId === reliefRequest.id ? 'Closing...' : 'Close request'}</button></div>
                        </article>)}
                        {dashboard && dashboard.activeRequests.length === 0 && <div className="empty-state">No active requests. Create one to open a response.</div>}
                        {!dashboard && <div className="empty-state">Loading requests...</div>}
                    </div>
                </div>
            </div>
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