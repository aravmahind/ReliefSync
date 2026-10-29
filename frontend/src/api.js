function getAuthHeaders() {
    const token = localStorage.getItem('rs_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
}

async function requestJson(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: { ...getAuthHeaders(), ...options.headers },
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'The request could not be completed.');
    return payload;
}

// Auth
export const authSignup = (data) => requestJson('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
});
export const authLogin = (data) => requestJson('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
});

// Public
export const getSummary = () => requestJson('/api/summary');
export const getRequests = () => requestJson('/api/requests');
export const searchRequests = (filters = {}) => {
    const query = new URLSearchParams();
    if (filters.skill) query.set('skill', filters.skill);
    if (filters.location) query.set('location', filters.location);
    return requestJson(`/api/requests/search?${query.toString()}`);
};

// Volunteer
export const registerVolunteer = (volunteer) => requestJson('/api/register', {
    method: 'POST',
    body: JSON.stringify(volunteer),
});

// Admin
export const getAdminDashboard = () => requestJson('/api/admin/dashboard');
export const createReliefRequest = (reliefRequest) => requestJson('/api/requests', {
    method: 'POST',
    body: JSON.stringify(reliefRequest),
});
export const approveVolunteer = (volunteerId) => requestJson(`/admin/volunteers/${encodeURIComponent(volunteerId)}/approve`, {
    method: 'POST',
});
export const deployVolunteer = (volunteerId, reliefRequestId) => requestJson(`/admin/volunteers/${encodeURIComponent(volunteerId)}/deploy`, {
    method: 'POST',
    body: JSON.stringify({ reliefRequestId }),
});
export const closeReliefRequest = (requestId) => requestJson(`/admin/requests/${encodeURIComponent(requestId)}/close`, {
    method: 'POST',
});