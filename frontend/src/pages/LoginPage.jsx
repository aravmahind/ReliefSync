import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authLogin } from '../api';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await authLogin({ email, password });
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
                        <Link className="btn btn-outline btn-sm" to="/signup">Create account</Link>
                    </div>
                </div>
            </div>

            <div className="auth-container">
                <div className="auth-card">
                    <h1>Welcome back</h1>
                    <p className="auth-subtitle">Sign in to your ReliefSync account to continue.</p>

                    {error && <div className="alert alert-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="login-email">Email address</label>
                            <input
                                className="form-input"
                                id="login-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                autoComplete="email"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="login-password">Password</label>
                            <input
                                className="form-input"
                                id="login-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                required
                            />
                        </div>
                        <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%' }}>
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Don't have an account? <Link to="/signup">Sign up</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}