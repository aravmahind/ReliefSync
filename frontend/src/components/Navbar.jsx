import { NavLink, Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="navbar navbar-expand-lg navbar-dark site-nav">
            <div className="container">
                <Link className="navbar-brand fw-bold" to="/">Relief<span>Sync</span></Link>
                <div className="navbar-nav ms-auto flex-row gap-3 align-items-center">
                    <NavLink className="nav-link" to="/" end>Overview</NavLink>
                    <NavLink className="nav-link" to="/requests">Relief requests</NavLink>
                    <NavLink className="nav-link" to="/admin">Admin</NavLink>
                    <Link className="btn btn-sm btn-light ms-1" to="/register">Join response team</Link>
                </div>
            </div>
        </nav>
    );
}


export default Navbar;