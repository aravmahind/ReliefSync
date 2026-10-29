import { useState } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

export default function AppLayout({ allowedRoles }) {
    const { user, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-subtle)' }}>
                <p style={{ color: 'var(--muted)', fontWeight: 500 }}>Loading ReliefSync...</p>
            </div>
        );
    }

    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to={user.role === 'admin' ? '/admin' : '/volunteer'} replace />;
    }

    const isAdminSection = user?.role === 'admin' || (!user && location.pathname.startsWith('/admin'));

    return (
        <div className="app-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="app-content">
                <header className="mobile-header">
                    <Link className="brand-link" to={isAdminSection ? '/admin' : '/volunteer'}>
                        <span className="brand-icon">+</span>
                        <span className="brand-text">Relief<span>Sync</span></span>
                    </Link>
                    <button className="hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                        ☰
                    </button>
                </header>
                <Outlet />
            </main>
        </div>
    );
}
