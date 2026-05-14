import mongoose from 'mongoose'

const AnnotationSchema = new mongoose.Schema({
  locationId: { type: String, required: true, index: true },
  nodeId:     { type: String, default: '' },
  azimuth:    { type: Number, required: true },
  elevation:  { type: Number, required: true },
  text:       { type: String, required: true, maxlength: 500 },
  authorId:   { type: String, required: true, index: true },
  authorName: { type: String, default: 'Anonymous' },
  flags:      { type: Number, default: 0 },
  hidden:     { type: Boolean, default: false, index: true },
}, { timestamps: true })

AnnotationSchema.index({ locationId: 1, hidden: 1, createdAt: -1 })

export const Annotation = mongoose.model('Annotation', AnnotationSchema)
