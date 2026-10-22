import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAssignment extends Document {
  title: string;
  description?: string;
  dueDate: Date;
}

const assignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    dueDate: { type: Date, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// true while the due date has not passed
assignmentSchema.virtual('isOpen').get(function () {
  return this.dueDate > new Date();
});

export const Assignment: Model<IAssignment> = mongoose.model<IAssignment>('assignment', assignmentSchema);
