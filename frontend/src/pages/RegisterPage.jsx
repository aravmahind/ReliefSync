import { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerVolunteer } from '../api';

const skills = ['Medical', 'Rescue', 'Food Distribution', 'First Aid'];
const initialValues = { name: '', email: '', phone: '', location: '', skill: '' };

export default function RegisterPage() {
    const [values, setValues] = useState(initialValues);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const updateField = (e) => {
        setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
    };

    const submitForm = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setSubmitting(true);
        try {
            const result = await registerVolunteer(values);
            setMessage(result.message);
            setValues(initialValues);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="content-wrapper" style={{ maxWidth: '720px' }}>
            <div className="page-header">
                <span className="badge-label">Volunteer Intake</span>
                <h1>Join the response team</h1>
                <p>Tell us how to reach you and the skill you can bring to a local response.</p>
            </div>

            {error && <div className="alert alert-error" role="alert">{error}</div>}
            {message && (
                <div className="alert alert-success" role="status" aria-live="polite">
                    {message} <Link to="/volunteer" style={{ color: 'var(--primary)', fontWeight: 600 }}>See the updated overview →</Link>
                </div>
            )}

            <form onSubmit={submitForm}>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label" htmlFor="name">Full name</label>
                        <input className="form-input" id="name" name="name" value={values.name} onChange={updateField} autoComplete="name" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input className="form-input" id="email" name="email" type="email" value={values.email} onChange={updateField} autoComplete="email" required />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label" htmlFor="phone">Phone</label>
                        <input className="form-input" id="phone" name="phone" type="tel" value={values.phone} onChange={updateField} autoComplete="tel" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="location">Location</label>
                        <input className="form-input" id="location" name="location" value={values.location} onChange={updateField} autoComplete="address-level2" required />
                    </div>
                </div>
                <div className="form-group" style={{ maxWidth: '50%' }}>
                    <label className="form-label" htmlFor="skill">Primary skill</label>
                    <select className="form-select" id="skill" name="skill" value={values.skill} onChange={updateField} required>
                        <option value="" disabled>Choose a skill</option>
                        {skills.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <button className="btn btn-primary btn-lg" type="submit" disabled={submitting} style={{ marginTop: '0.5rem' }}>
                    {submitting ? 'Submitting...' : 'Submit registration'}
                </button>
            </form>
        </div>
    );
}
