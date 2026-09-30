import { useEffect, useState } from 'react';
import { getRequests, searchRequests } from '../api';

const skills = ['Medical', 'Rescue', 'Food Distribution', 'First Aid'];

const RequestsPage = () => {
    const [requests, setRequests] = useState([]);
    const [filters, setFilters] = useState({ skill: '', location: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getRequests()
            .then(setRequests)
            .catch((requestError) => setError(requestError.message))
            .finally(() => setLoading(false));
    }, []);

    const updateFilter = (event) => {
        setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
    };

    const submitSearch = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);
        try {
            setRequests(await searchRequests(filters));
        } catch (requestError) {
            setError(requestError.message);
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
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    };

    return <main className="container app-main">
        <div className="page-heading">
            <div><p className="eyebrow mb-2">COMMUNITY NEEDS</p><h1>Open relief requests</h1><p className="text-secondary mb-0">Current requests awaiting volunteer support.</p></div>
        </div>
        <form className="search-toolbar row g-2 align-items-end" onSubmit={submitSearch}>
            <div className="col-md-4"><label className="form-label" htmlFor="filter-skill">Skill needed</label><select className="form-select" id="filter-skill" name="skill" value={filters.skill} onChange={updateFilter}><option value="">All skills</option>{skills.map((skill) => <option key={skill} value={skill}>{skill}</option>)}</select></div>
            <div className="col-md-5"><label className="form-label" htmlFor="filter-location">Location</label><input className="form-control" id="filter-location" name="location" value={filters.location} onChange={updateFilter} placeholder="Search a location" /></div>
            <div className="col-md-3 d-flex gap-2"><button className="btn btn-success" type="submit">Search</button><button className="btn btn-outline-secondary" type="button" onClick={clearSearch}>Clear</button></div>
        </form>
        {error && <div className="alert alert-warning" role="alert">{error}. Start the backend with <code>npm run dev</code> in the backend folder.</div>}
        <div className="results-heading">{!loading && `${requests.length} ${requests.length === 1 ? 'request' : 'requests'}`}</div>
        {loading ? <div className="empty-state">Loading requests...</div> : requests.length ? <div className="request-list">{requests.map((request) => <article className="request-row" key={request.id}>
            <div><span className="request-id">{request.id}</span><h2>{request.title}</h2><p>{request.location}</p></div>
            <div className="request-meta"><span className={`urgency urgency-${request.urgency.toLowerCase()}`}>{request.urgency} urgency</span><p><strong>{request.skillRequired}</strong> <span aria-hidden="true">·</span> {request.volunteersNeeded} volunteers needed</p></div>
        </article>)}</div> : <div className="empty-state">No open requests match those filters.</div>}
    </main>;
};

export default RequestsPage;