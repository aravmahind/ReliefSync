import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const volunteerNav = [
    { to: '/volunteer', label: 'Overview', icon: '◉' },
    { to: '/volunteer/requests', label: 'Relief Requests', icon: '◎' },
    { to: '/volunteer/register', label: 'Register Skills', icon: '◈' },
];

const adminNav = [
    { to: '/admin', label: 'Dashboard', icon: '◉' },
    { to: '/admin/volunteers', label: 'Volunteers', icon: '◎' },
    { to: '/admin/requests', label: 'Relief Requests', icon: '◈' },
];

export default function Sidebar({ isOpen, onClose }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    
    // If logged in as admin OR currently viewing admin section, show admin navigation
    const isAdmin = user?.role === 'admin' || (!user && location.pathname.startsWith('/admin'));
    const navItems = isAdmin ? adminNav : volunteerNav;
    const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
            <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <NavLink to={isAdmin ? '/admin' : '/volunteer'} onClick={onClose}>
                        <span className="brand-icon">+</span>
                        <span className="brand-text">Relief<span>Sync</span></span>
                    </NavLink>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section-label">{isAdmin ? 'Administration' : 'Volunteer Portal'}</div>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/volunteer' || item.to === '/admin'}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={onClose}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    {user ? (
                        <div className="sidebar-user">
                            <span className="user-avatar">{initials}</span>
                            <div className="user-info">
                                <div className="user-name">{user.name}</div>
                                <div className="user-role">{user.role}</div>
                            </div>
                            <button className="btn-logout" onClick={logout} title="Sign out">↗</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                            <NavLink to="/login" className="btn btn-outline btn-sm" style={{ flex: 1, textAlign: 'center' }}>Sign in</NavLink>
                            <NavLink to="/signup" className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: 'center' }}>Sign up</NavLink>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
