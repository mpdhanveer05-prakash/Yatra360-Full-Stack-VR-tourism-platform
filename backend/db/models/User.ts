import mongoose from 'mongoose'

const FeatureVectorSchema = new mongoose.Schema({
  historical:   { type: Number, default: 0 },
  architectural:{ type: Number, default: 0 },
  religious:    { type: Number, default: 0 },
  natural:      { type: Number, default: 0 },
  cultural:     { type: Number, default: 0 },
  artistic:     { type: Number, default: 0 },
  educational:  { type: Number, default: 0 },
  adventurous:  { type: Number, default: 0 },
  ancient:      { type: Number, default: 0 },
  medieval:     { type: Number, default: 0 },
  colonial:     { type: Number, default: 0 },
  modern:       { type: Number, default: 0 },
}, { _id: false })

const HistoryEntrySchema = new mongoose.Schema({
  locationId:      String,
  startedAt:       Date,
  engagementScore: { type: Number, default: 0 },
  durationMs:      { type: Number, default: 0 },
}, { _id: false })

const UserSchema = new mongoose.Schema({
  userId:           { type: String, required: true, unique: true },
  preferenceVector: { type: FeatureVectorSchema, default: {} },
  sessionHistory:   [HistoryEntrySchema],
  detectedRegion:   { type: String, default: '' },
}, { timestamps: true })

export const User = mongoose.model('User', UserSchema)
