import mongoose from 'mongoose';

export const reliefSkills = ['Medical', 'Rescue', 'Food Distribution', 'First Aid'];
export const urgencyLevels = ['High', 'Medium', 'Low'];
export const requestStatuses = ['Open', 'Closed'];

const reliefRequestSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    skillRequired: { type: String, required: true, enum: reliefSkills },
    urgency: { type: String, required: true, enum: urgencyLevels, default: 'Medium' },
    volunteersNeeded: { type: Number, required: true, min: 1, validate: Number.isInteger },
    status: { type: String, required: true, enum: requestStatuses, default: 'Open' },
}, { timestamps: true, versionKey: false, collection: 'reliefrequests' });

reliefRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.ReliefRequest || mongoose.model('ReliefRequest', reliefRequestSchema);