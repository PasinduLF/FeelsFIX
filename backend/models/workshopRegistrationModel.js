import mongoose from 'mongoose'

const REGISTRATION_TIMELINE_STATUS = ['upcoming', 'completed', 'cancelled']
const REGISTRATION_DECISION_STATUS = ['pending', 'approved', 'declined']

const workshopRegistrationSchema = new mongoose.Schema(
  {
    workshop: { type: mongoose.Schema.Types.ObjectId, ref: 'workshop', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    workshopTitle: { type: String, required: true },
    workshopDate: { type: Date },
    workshopStartTime: { type: String, default: '' },
    workshopDurationMinutes: { type: Number, default: 60 },
    workshopCoverImage: { type: String, default: '' },
    participantName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    notes: { type: String, default: '' },
    status: { type: String, enum: REGISTRATION_TIMELINE_STATUS, default: 'upcoming' },
    decisionStatus: { type: String, enum: REGISTRATION_DECISION_STATUS, default: 'pending' },
    decisionNote: { type: String, default: '' },
    decidedAt: { type: Date },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'admin' },
  },
  { timestamps: true }
)

workshopRegistrationSchema.index({ workshop: 1, email: 1 })
workshopRegistrationSchema.index({ user: 1, createdAt: -1 })
workshopRegistrationSchema.index({ decisionStatus: 1 })

const WorkshopRegistrationModel =
  mongoose.models.workshop_registration || mongoose.model('workshop_registration', workshopRegistrationSchema)

export default WorkshopRegistrationModel
export { REGISTRATION_TIMELINE_STATUS, REGISTRATION_DECISION_STATUS }
