import mongoose from 'mongoose'

const LocationStatsSchema = new mongoose.Schema({
  locationId:     { type: String, required: true },
  nodeId:         { type: String, required: true },
  totalDwell:     { type: Number, default: 0 },
  visits:         { type: Number, default: 0 },
  avgEngagement:  { type: Number, default: 0 },
}, { timestamps: true })

LocationStatsSchema.index({ locationId: 1, nodeId: 1 }, { unique: true })

export const LocationStats = mongoose.model('LocationStats', LocationStatsSchema)
