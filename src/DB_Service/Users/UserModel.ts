import mongoose, { Schema, Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

export interface IUser extends Omit<Document, '_id'> {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'Student' | 'Teacher', default: 'Student';
}

const UserSchema = new Schema({
  _id: {
    type: String,
    required: true,
    alias: 'userId'
  },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true, minlength: [6,'Password must be at least 6 characters']},
  role: {
        type: String,
        enum: ['Student', 'Teacher'],
        default: 'Student'
    }
}, { 
    _id: false, 
    toJSON: { 
      virtuals: true,
      transform: (_doc, ret : any) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
});

// הצפנת סיסמה לפני שמירה
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);
});

export const User = mongoose.model<IUser>('user', UserSchema);