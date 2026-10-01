async function requestJson(url, options) {
    const response = await fetch(url, options);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'The request could not be completed.');
    return payload;
}

export const getSummary = () => requestJson('/api/summary');
export const getRequests = () => requestJson('/api/requests');
export const searchRequests = (filters = {}) => {
    const query = new URLSearchParams();
    if (filters.skill) query.set('skill', filters.skill);
    if (filters.location) query.set('location', filters.location);
    return requestJson(`/api/requests/search?${query.toString()}`);
};
export const getAdminDashboard = () => requestJson('/api/admin/dashboard');
export const createReliefRequest = (reliefRequest) => requestJson('/api/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reliefRequest),
});
export const approveVolunteer = (volunteerId) => requestJson(`/admin/volunteers/${encodeURIComponent(volunteerId)}/approve`, {
    method: 'POST',
});
export const deployVolunteer = (volunteerId, reliefRequestId) => requestJson(`/admin/volunteers/${encodeURIComponent(volunteerId)}/deploy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reliefRequestId }),
});
export const closeReliefRequest = (requestId) => requestJson(`/admin/requests/${encodeURIComponent(requestId)}/close`, {
    method: 'POST',
});
export const registerVolunteer = (volunteer) => requestJson('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(volunteer),
});