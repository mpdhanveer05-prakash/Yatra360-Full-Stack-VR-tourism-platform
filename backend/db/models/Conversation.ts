import mongoose from 'mongoose'

const MessageSchema = new mongoose.Schema({
  role:    { type: String, enum: ['user', 'guide'], required: true },
  content: { type: String, required: true },
  ts:      { type: Number, default: () => Date.now() },
  sourceSection: { type: String, default: '' },
  confidence:    { type: Number, default: 0 },
  synth:         { type: String, default: '' },
}, { _id: false })

const ConversationSchema = new mongoose.Schema({
  userId:     { type: String, required: true, index: true },
  locationId: { type: String, required: true, index: true },
  lang:       { type: String, default: 'en' },
  messages:   { type: [MessageSchema], default: [] },
}, { timestamps: true })

ConversationSchema.index({ userId: 1, locationId: 1 }, { unique: true })

export const Conversation = mongoose.model('Conversation', ConversationSchema)
