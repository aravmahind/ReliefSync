import mongoose from 'mongoose';

export const volunteerSkills = ['Medical', 'Rescue', 'Food Distribution', 'First Aid'];
export const volunteerStatuses = ['Pending', 'Approved', 'Deployed'];

const volunteerSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    phone: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    skill: { type: String, required: true, enum: volunteerSkills },
    status: { type: String, required: true, enum: volunteerStatuses, default: 'Pending' },
    assignedRequestId: { type: String, default: null },
}, { timestamps: true, versionKey: false, collection: 'volunteers' });

volunteerSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Volunteer || mongoose.model('Volunteer', volunteerSchema);