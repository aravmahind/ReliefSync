import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSummary } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Home() {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        getSummary()
            .then(setSummary)
            .catch((err) => setError(err.message));
    }, []);

    const metrics = summary?.metrics;

    return (
        <div className="content-wrapper">
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <span className="badge-label">{user ? 'Volunteer Portal' : 'Community Response'}</span>
                        <h1>Response overview</h1>
                        <p>{user ? `Welcome back, ${user.name}. Here's what's happening across the disaster response network.` : "Live overview of current relief operations, requests, and volunteer deployments."}</p>
                    </div>
                    <Link className="btn btn-primary" to="/volunteer/register">
                        Register your skills →
                    </Link>
                </div>
            </div>

            {error && <div className="alert alert-warning" role="alert">{error}</div>}

            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-label">Registered Volunteers</div>
                    <div className="metric-value">{metrics?.volunteers ?? '—'}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Awaiting Approval</div>
                    <div className="metric-value">{metrics?.pending ?? '—'}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Open Requests</div>
                    <div className="metric-value">{metrics?.openRequests ?? '—'}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Deployed</div>
                    <div className="metric-value">{metrics?.deployed ?? '—'}</div>
                </div>
            </div>

            <div className="section">
                <div className="section-title">
                    <div>
                        <span className="badge-label">Active Needs</span>
                        <h2>Open relief requests</h2>
                    </div>
                    <Link className="btn btn-ghost btn-sm" to="/volunteer/requests">View all →</Link>
                </div>
                <RequestList requests={summary?.recentRequests || []} loading={!summary && !error} />
            </div>
        </div>
    );
}

function RequestList({ requests, loading }) {
    if (loading) return <div className="empty-state">Loading active requests...</div>;
    if (!requests.length) return <div className="empty-state">There are no open requests right now.</div>;

    return (
        <div className="list-card">
            {requests.map((req) => (
                <article className="list-item request-row" key={req.id}>
                    <div>
                        <span className="list-item-id request-id">{req.id}</span>
                        <h3>{req.title}</h3>
                        <p>{req.location} · {req.skillRequired}</p>
                    </div>
                    <div className="list-item-meta">
                        <span className={`badge badge-${req.urgency.toLowerCase()}`}>
                            {req.urgency} urgency
                        </span>
                        <p>{req.volunteersNeeded} volunteers needed</p>
                    </div>
                </article>
            ))}
        </div>
    );
}
