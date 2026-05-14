import mongoose from 'mongoose'

const ClassroomSchema = new mongoose.Schema({
  code:             { type: String, required: true, unique: true, index: true, uppercase: true },
  name:             { type: String, required: true },
  teacherId:        { type: String, required: true, index: true },
  teacherName:      { type: String, default: 'Teacher' },
  studentIds:       { type: [String], default: [] },
  assignedLocationId: { type: String, default: '' },
  notes:            { type: String, default: '' },
}, { timestamps: true })

export const Classroom = mongoose.model('Classroom', ClassroomSchema)
