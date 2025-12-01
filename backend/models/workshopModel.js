import mongoose from 'mongoose'

const STATUS = {
  DRAFT: 'draft',
  READY: 'ready',
  UPCOMING: 'upcoming',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

const STATUS_VALUES = Object.values(STATUS)

const workshopSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    facilitator: { type: String, default: 'Facilitator TBA', trim: true },
    description: { type: String, default: '' },
    date: { type: Date },
    startTime: { type: String, default: '' },
    durationMinutes: { type: Number, default: 60 },
    capacity: { type: Number, default: 0 },
    enrolled: { type: Number, default: 0 },
    priceType: { type: String, enum: ['free', 'paid'], default: 'free' },
    price: { type: Number, default: 0 },
    coverImage: { type: String, default: '' },
  status: { type: String, enum: STATUS_VALUES, default: STATUS.READY },
    publishedAt: { type: Date },
    savedAt: { type: Date },
    updatedAt: { type: Date },
  },
  { timestamps: true }
)

workshopSchema.index({ status: 1, date: 1 })

const WorkshopModel = mongoose.models.workshop || mongoose.model('workshop', workshopSchema)

export default WorkshopModel
export { STATUS as WORKSHOP_STATUS, STATUS_VALUES as WORKSHOP_STATUS_VALUES }
