import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'reliefsync-secret-key-change-in-production';

export function generateToken(user) {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

export function authenticateToken(request, response, next) {
    const authHeader = request.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return response.status(401).json({ error: 'Authentication required.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        request.user = decoded;
        next();
    } catch {
        return response.status(403).json({ error: 'Invalid or expired token.' });
    }
}

export function requireRole(role) {
    return (request, response, next) => {
        if (request.user?.role !== role) {
            return response.status(403).json({ error: 'Access denied.' });
        }
        next();
    };
}
