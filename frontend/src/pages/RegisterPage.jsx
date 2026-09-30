import { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerVolunteer } from '../api';

const skills = ['Medical', 'Rescue', 'Food Distribution', 'First Aid'];
const initialValues = { name: '', email: '', phone: '', location: '', skill: '' };

const RegisterPage = () => {
    const [values, setValues] = useState(initialValues);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const updateField = (event) => {
        setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
    };

    const submitForm = async (event) => {
        event.preventDefault();
        setError('');
        setMessage('');
        setSubmitting(true);
        try {
            const result = await registerVolunteer(values);
            setMessage(result.message);
            setValues(initialValues);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSubmitting(false);
        }
    };

    return <main className="container app-main form-main">
        <p className="eyebrow mb-2">VOLUNTEER INTAKE</p>
        <h1>Join the response team</h1>
        <p className="text-secondary mb-4">Tell us how to reach you and the skill you can bring to a local response.</p>
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {message && <div className="alert alert-success" role="status">{message} <Link to="/">See the updated overview</Link></div>}
        <form className="row g-3" onSubmit={submitForm}>
            <div className="col-md-6"><label className="form-label" htmlFor="name">Full name</label><input className="form-control" id="name" name="name" value={values.name} onChange={updateField} autoComplete="name" required /></div>
            <div className="col-md-6"><label className="form-label" htmlFor="email">Email</label><input className="form-control" id="email" name="email" type="email" value={values.email} onChange={updateField} autoComplete="email" required /></div>
            <div className="col-md-6"><label className="form-label" htmlFor="phone">Phone</label><input className="form-control" id="phone" name="phone" type="tel" value={values.phone} onChange={updateField} autoComplete="tel" required /></div>
            <div className="col-md-6"><label className="form-label" htmlFor="location">Location</label><input className="form-control" id="location" name="location" value={values.location} onChange={updateField} autoComplete="address-level2" required /></div>
            <div className="col-md-6"><label className="form-label" htmlFor="skill">Primary skill</label><select className="form-select" id="skill" name="skill" value={values.skill} onChange={updateField} required><option value="" disabled>Choose a skill</option>{skills.map((skill) => <option key={skill} value={skill}>{skill}</option>)}</select></div>
            <div className="col-12 pt-2"><button className="btn btn-success px-4" type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit registration'}</button></div>
        </form>
    </main>;
};

export default RegisterPage;