import mongoose from 'mongoose'

const EventSchema = new mongoose.Schema({
  nodeId:           String,
  eventType:        String,
  dwellMs:          Number,
  interactionCount: Number,
  timestamp:        { type: Date, default: Date.now },
}, { _id: false })

const SessionSchema = new mongoose.Schema({
  sessionId:       { type: String, required: true, index: true },
  userId:          { type: String, required: true, index: true },
  locationId:      { type: String, required: true },
  startedAt:       { type: Date, default: Date.now },
  durationMs:      { type: Number, default: 0 },
  engagementScore: { type: Number, default: 0 },
  nodesVisited:    [String],
  events:          [EventSchema],
}, { timestamps: true })

export const Session = mongoose.model('Session', SessionSchema)
