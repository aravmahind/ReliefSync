import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSummary } from '../api';

const Home = () => {
    const [summary, setSummary] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        getSummary()
            .then(setSummary)
            .catch((requestError) => setError(requestError.message));
    }, []);

    const metrics = summary?.metrics;

    return (
        <main className="container app-main">
            <section className="page-heading">
                <div>
                    <p className="eyebrow mb-2">DISASTER RESPONSE NETWORK</p>
                    <h1>Response overview</h1>
                    <p className="text-secondary mb-0">A live view of volunteers and active community needs.</p>
                </div>
                <Link className="btn btn-success" to="/register">Register as a volunteer <span aria-hidden="true">&rarr;</span></Link>
            </section>

            {error && <div className="alert alert-warning" role="alert">{error}. Start the backend with <code>npm run dev</code> in the backend folder.</div>}

            <section className="row g-3 mb-5" aria-label="Platform summary">
                <Metric label="Registered volunteers" value={metrics?.volunteers} />
                <Metric label="Awaiting approval" value={metrics?.pending} />
                <Metric label="Open requests" value={metrics?.openRequests} />
                <Metric label="Deployed" value={metrics?.deployed} />
            </section>

            <section>
                <div className="section-heading">
                    <div><p className="eyebrow mb-1">NEEDS RIGHT NOW</p><h2>Open relief requests</h2></div>
                    <Link className="text-link" to="/requests">View all requests <span aria-hidden="true">&rarr;</span></Link>
                </div>
                <RequestList requests={summary?.recentRequests || []} loading={!summary && !error} />
            </section>
        </main>
    );
}

function Metric({ label, value }) {
    return <div className="col-6 col-lg-3"><div className="metric"><span>{label}</span><strong>{value ?? '—'}</strong></div></div>;
}

function RequestList({ requests, loading }) {
    if (loading) return <div className="empty-state">Loading active requests...</div>;
    if (!requests.length) return <div className="empty-state">There are no open requests right now.</div>;

    return <div className="request-list">{requests.map((request) => <article className="request-row" key={request.id}>
        <div><span className="request-id">{request.id}</span><h3>{request.title}</h3><p>{request.location} <span aria-hidden="true">·</span> {request.skillRequired}</p></div>
        <div className="request-meta"><span className={`urgency urgency-${request.urgency.toLowerCase()}`}>{request.urgency} urgency</span><p>{request.volunteersNeeded} volunteers needed</p></div>
    </article>)}</div>;
}

export default Home;