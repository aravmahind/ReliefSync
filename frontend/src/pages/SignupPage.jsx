import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authSignup } from '../api';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('volunteer');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await authSignup({ name, email, password, role });
            login(result.token, result.user);
            navigate(result.user.role === 'admin' ? '/admin' : '/volunteer');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="top-bar">
                <div className="top-bar-inner">
                    <Link className="brand-link" to="/">
                        <span className="brand-icon">+</span>
                        <span className="brand-text">Relief<span style={{ color: 'var(--primary)' }}>Sync</span></span>
                    </Link>
                    <div className="top-bar-actions">
                        <Link className="btn btn-outline btn-sm" to="/login">Sign in</Link>
                    </div>
                </div>
            </div>

            <div className="auth-container">
                <div className="auth-card">
                    <h1>Create your account</h1>
                    <p className="auth-subtitle">Join the ReliefSync disaster response network.</p>

                    {error && <div className="alert alert-error">{error}</div>}

                    <div className="role-toggle">
                        <button
                            type="button"
                            className={`role-btn ${role === 'volunteer' ? 'active' : ''}`}
                            onClick={() => setRole('volunteer')}
                        >
                            Volunteer
                        </button>
                        <button
                            type="button"
                            className={`role-btn ${role === 'admin' ? 'active' : ''}`}
                            onClick={() => setRole('admin')}
                        >
                            Administrator
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="signup-name">Full name</label>
                            <input
                                className="form-input"
                                id="signup-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your full name"
                                autoComplete="name"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="signup-email">Email address</label>
                            <input
                                className="form-input"
                                id="signup-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                autoComplete="email"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="signup-password">Password</label>
                            <input
                                className="form-input"
                                id="signup-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="At least 6 characters"
                                autoComplete="new-password"
                                required
                                minLength={6}
                            />
                        </div>
                        <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%' }}>
                            {loading ? 'Creating account...' : 'Create account'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
