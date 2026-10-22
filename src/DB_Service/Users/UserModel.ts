import mongoose, { Schema } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type UserRole = 'Student' | 'Teacher';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

const UserSchema = new Schema<IUser>({
  _id: {
    type: String,
    required: true,
    alias: 'userId'
  },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true, unique: true },
  password: { type: String, required: true, minlength: [6, 'Password must be at least 6 characters'] },
  role: {
    type: String,
    enum: ['Student', 'Teacher'],
    default: 'Student'
  }
}, {
  _id: false,
  toJSON: {
    virtuals: true,
    // never expose the password hash or internal fields
    transform: (_doc, ret: any) => {
      delete ret._id;
      delete ret.id;
      delete ret.__v;
      delete ret.password;
      return ret;
    }
  }
});

// hash the password before saving
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);
});

export const User = mongoose.model<IUser>('user', UserSchema);
