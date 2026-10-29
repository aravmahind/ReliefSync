import { useEffect, useState } from 'react';
import { getRequests, searchRequests } from '../api';

const skills = ['Medical', 'Rescue', 'Food Distribution', 'First Aid'];

export default function RequestsPage() {
    const [requests, setRequests] = useState([]);
    const [filters, setFilters] = useState({ skill: '', location: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getRequests()
            .then(setRequests)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const updateFilter = (e) => {
        setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
    };

    const submitSearch = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            setRequests(await searchRequests(filters));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const clearSearch = async () => {
        setFilters({ skill: '', location: '' });
        setError('');
        setLoading(true);
        try {
            setRequests(await getRequests());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="content-wrapper">
            <div className="page-header">
                <span className="badge-label">Community Needs</span>
                <h1>Open relief requests</h1>
                <p>Current requests awaiting volunteer support.</p>
            </div>

            <form className="search-bar" onSubmit={submitSearch}>
                <div className="form-group">
                    <label className="form-label" htmlFor="filter-skill">Skill needed</label>
                    <select className="form-select" id="filter-skill" name="skill" value={filters.skill} onChange={updateFilter}>
                        <option value="">All skills</option>
                        {skills.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="filter-location">Location</label>
                    <input className="form-input" id="filter-location" name="location" value={filters.location} onChange={updateFilter} placeholder="Search a location" />
                </div>
                <div className="btn-group" style={{ paddingBottom: '0.05rem' }}>
                    <button className="btn btn-primary" type="submit">Search</button>
                    <button className="btn btn-outline" type="button" onClick={clearSearch}>Clear</button>
                </div>
            </form>

            {error && <div className="alert alert-warning" role="alert">{error}</div>}
            <div className="results-count results-heading">
                {!loading && `${requests.length} ${requests.length === 1 ? 'request' : 'requests'}`}
            </div>

            {loading ? (
                <div className="empty-state">Loading requests...</div>
            ) : requests.length ? (
                <div className="list-card">
                    {requests.map((req) => (
                        <article className="list-item request-row" key={req.id}>
                            <div>
                                <span className="list-item-id request-id">{req.id}</span>
                                <h3>{req.title}</h3>
                                <p>{req.location}</p>
                            </div>
                            <div className="list-item-meta">
                                <span className={`badge badge-${req.urgency.toLowerCase()}`}>
                                    {req.urgency} urgency
                                </span>
                                <p><strong>{req.skillRequired}</strong> · {req.volunteersNeeded} volunteers needed</p>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="empty-state">No open requests match those filters.</div>
            )}
        </div>
    );
}
