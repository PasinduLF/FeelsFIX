import mongoose from 'mongoose'

const REGISTRATION_TIMELINE_STATUS = ['upcoming', 'completed', 'cancelled', 'waitlist']
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
    waitlisted: { type: Boolean, default: false },
    paymentIntentId: { type: String, default: null },
    paymentStatus: {
      type: String,
      enum: ['pending', 'requires_action', 'processing', 'succeeded', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentAmount: { type: Number, default: 0 },
    paymentCurrency: { type: String, default: '' },
    paymentMethodType: { type: String, default: '' },
    processedByWebhook: { type: Boolean, default: false },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
)

workshopRegistrationSchema.index({ workshop: 1, email: 1 })
workshopRegistrationSchema.index({ user: 1, createdAt: -1 })
workshopRegistrationSchema.index({ decisionStatus: 1 })
workshopRegistrationSchema.index({ paymentIntentId: 1 }, { unique: true, sparse: true })

const WorkshopRegistrationModel =
  mongoose.models.workshop_registration || mongoose.model('workshop_registration', workshopRegistrationSchema)

export default WorkshopRegistrationModel
export { REGISTRATION_TIMELINE_STATUS, REGISTRATION_DECISION_STATUS }
