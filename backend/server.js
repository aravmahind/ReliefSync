import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDatabase } from './config/database.js';
import ReliefRequest, { reliefSkills, urgencyLevels } from './models/ReliefRequest.js';
import Volunteer, { volunteerSkills } from './models/Volunteer.js';

const app = express();
const port = process.env.PORT || 5001;
const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const frontendDirectory = path.resolve(currentDirectory, '../frontend/dist');
const frontendEntry = path.join(frontendDirectory, 'index.html');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(frontendDirectory));

function serialize(record) {
    if (!record) return record;
    const data = typeof record.toObject === 'function' ? record.toObject() : record;
    const { _id, __v, ...fields } = data;
    return fields;
}

function hasText(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

app.get('/api/summary', async (_request, response) => {
    const [volunteers, pending, openRequests, deployed, recentRequests] = await Promise.all([
        Volunteer.countDocuments(),
        Volunteer.countDocuments({ status: 'Pending' }),
        ReliefRequest.countDocuments({ status: 'Open' }),
        Volunteer.countDocuments({ status: 'Deployed' }),
        ReliefRequest.find({ status: 'Open' }).sort({ createdAt: -1 }).limit(3).lean(),
    ]);

    response.json({
        metrics: { volunteers, pending, openRequests, deployed },
        recentRequests: recentRequests.map(serialize),
    });
});

app.get('/api/requests', async (_request, response) => {
    const requests = await ReliefRequest.find({ status: 'Open' }).sort({ createdAt: -1 }).lean();
    response.json(requests.map(serialize));
});

app.get('/api/requests/search', async (request, response) => {
    if ((request.query.skill !== undefined && typeof request.query.skill !== 'string')
        || (request.query.location !== undefined && typeof request.query.location !== 'string')) {
        return response.status(400).json({ error: 'Skill and location filters must be single values.' });
    }

    const filters = { status: 'Open' };
    if (request.query.skill?.trim()) {
        filters.skillRequired = { $regex: escapeRegex(request.query.skill.trim()), $options: 'i' };
    }
    if (request.query.location?.trim()) {
        filters.location = { $regex: escapeRegex(request.query.location.trim()), $options: 'i' };
    }

    const requests = await ReliefRequest.find(filters).sort({ createdAt: -1 }).lean();
    response.json(requests.map(serialize));
});

app.post('/api/requests', async (request, response) => {
    const { title, location, skillRequired, urgency, volunteersNeeded } = request.body || {};
    const needed = Number(volunteersNeeded);
    if (!hasText(title) || !hasText(location) || !reliefSkills.includes(skillRequired)
        || !urgencyLevels.includes(urgency) || !Number.isInteger(needed) || needed < 1) {
        return response.status(400).json({ error: 'Provide a title, location, valid skill and urgency, and a positive whole volunteer count.' });
    }

    const reliefRequest = await ReliefRequest.create({
        id: `REQ-${randomUUID()}`,
        title: title.trim(),
        location: location.trim(),
        skillRequired,
        urgency,
        volunteersNeeded: needed,
        status: 'Open',
    });
    response.status(201).json({ message: 'Relief request created.', reliefRequest: serialize(reliefRequest) });
});

app.get('/api/admin/dashboard', async (_request, response) => {
    const [totalVolunteers, pendingApprovals, approvedVolunteers, deployedVolunteers, activeRequests, volunteers, requests] = await Promise.all([
        Volunteer.countDocuments(),
        Volunteer.countDocuments({ status: 'Pending' }),
        Volunteer.countDocuments({ status: 'Approved' }),
        Volunteer.countDocuments({ status: 'Deployed' }),
        ReliefRequest.countDocuments({ status: 'Open' }),
        Volunteer.find().sort({ createdAt: -1 }).lean(),
        ReliefRequest.find({ status: 'Open' }).sort({ createdAt: -1 }).lean(),
    ]);

    response.json({
        metrics: { totalVolunteers, pendingApprovals, approvedVolunteers, deployedVolunteers, activeRequests },
        volunteers: volunteers.map(serialize),
        activeRequests: requests.map(serialize),
    });
});

app.post('/admin/volunteers/:id/approve', async (request, response) => {
    const volunteer = await Volunteer.findOneAndUpdate(
        { id: request.params.id, status: 'Pending' },
        { $set: { status: 'Approved' } },
        { new: true, runValidators: true },
    );
    if (volunteer) return response.json({ message: `${volunteer.name} approved.`, volunteer: serialize(volunteer) });

    const existingVolunteer = await Volunteer.exists({ id: request.params.id });
    if (!existingVolunteer) return response.status(404).json({ error: 'Volunteer not found.' });
    response.status(409).json({ error: 'Only pending volunteers can be approved.' });
});

app.post('/admin/volunteers/:id/deploy', async (request, response) => {
    const { reliefRequestId } = request.body || {};
    if (!hasText(reliefRequestId)) return response.status(400).json({ error: 'Choose an active relief request.' });

    const reliefRequest = await ReliefRequest.findOne({ id: reliefRequestId, status: 'Open' });
    if (!reliefRequest) return response.status(404).json({ error: 'Active relief request not found.' });

    const volunteer = await Volunteer.findOneAndUpdate(
        { id: request.params.id, status: 'Approved' },
        { $set: { status: 'Deployed', assignedRequestId: reliefRequest.id } },
        { new: true, runValidators: true },
    );
    if (volunteer) {
        return response.json({
            message: `${volunteer.name} deployed to ${reliefRequest.title}.`,
            volunteer: serialize(volunteer),
        });
    }

    const existingVolunteer = await Volunteer.exists({ id: request.params.id });
    if (!existingVolunteer) return response.status(404).json({ error: 'Volunteer not found.' });
    response.status(409).json({ error: 'Only approved volunteers can be deployed.' });
});

app.post('/admin/requests/:id/close', async (request, response) => {
    const reliefRequest = await ReliefRequest.findOneAndUpdate(
        { id: request.params.id, status: 'Open' },
        { $set: { status: 'Closed' } },
        { new: true, runValidators: true },
    );
    if (reliefRequest) {
        return response.json({ message: `${reliefRequest.title} closed.`, reliefRequest: serialize(reliefRequest) });
    }

    const existingRequest = await ReliefRequest.exists({ id: request.params.id });
    if (!existingRequest) return response.status(404).json({ error: 'Relief request not found.' });
    response.status(409).json({ error: 'Only open relief requests can be closed.' });
});

app.post('/api/register', async (request, response) => {
    const { name, email, phone, location, skill } = request.body || {};
    if (!hasText(name) || !hasText(email) || !hasText(phone) || !hasText(location)
        || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !volunteerSkills.includes(skill)) {
        return response.status(400).json({ error: 'Provide valid contact details and choose a listed skill.' });
    }

    const volunteer = await Volunteer.create({
        id: `VOL-${randomUUID()}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        location: location.trim(),
        skill,
        status: 'Pending',
        assignedRequestId: null,
    });
    response.status(201).json({
        message: 'Registration received. Your status is Pending approval.',
        volunteer: serialize(volunteer),
    });
});

app.use((error, _request, response, next) => {
    if (response.headersSent) return next(error);
    if (error.code === 11000) return response.status(409).json({ error: 'A volunteer with that email is already registered.' });
    if (error.name === 'ValidationError' || error.name === 'CastError') {
        return response.status(400).json({ error: 'The submitted record is invalid.' });
    }
    console.error('ReliefSync request failed:', error.message);
    response.status(500).json({ error: 'The request could not be completed.' });
});

app.get('/', (_request, response) => {
    if (existsSync(frontendEntry)) return response.sendFile(frontendEntry);
    response.json({ message: 'ReliefSync API is running. Start the React app in the frontend folder.' });
});

app.get('/{*splat}', (request, response) => {
    if (existsSync(frontendEntry) && !request.path.startsWith('/api/') && !request.path.startsWith('/admin/')) {
        return response.sendFile(frontendEntry);
    }
    response.status(404).json({ error: 'Route not found' });
});

async function startServer() {
    await connectDatabase();
    app.listen(port, '0.0.0.0', () => {
        console.log(`ReliefSync is running at http://localhost:${port}`);
    });
}

startServer().catch((error) => {
    console.error('Unable to start ReliefSync:', error.message);
    process.exitCode = 1;
});