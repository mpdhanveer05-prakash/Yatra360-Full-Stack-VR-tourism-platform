import mongoose from 'mongoose'

const AuthUserSchema = new mongoose.Schema({
  username:     { type: String, required: true, unique: true, lowercase: true, trim: true, minlength: 3, maxlength: 30 },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  displayName:  { type: String, default: '' },
}, { timestamps: true })

export const AuthUser = mongoose.model('AuthUser', AuthUserSchema)
