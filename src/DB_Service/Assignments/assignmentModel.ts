import mongoose, { Document, Schema, Model } from 'mongoose';

// ממשק עבור מסמך מטלה
export interface IAssignment extends Document {
  title: string;
  description: string;
  dueDate: Date;
}

// סכמה עבור מטלה
const assignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true },
    description: { type: String },
    dueDate : { type: Date, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {virtuals: true,},
    toObject: { virtuals: true }
  }
);
assignmentSchema.virtual('IsOpen').get(function() {
  const IsOpen: boolean = this.dueDate > new Date();
  return IsOpen;
  
});
export const Assignment: Model<IAssignment> = mongoose.model<IAssignment>('assignment', assignmentSchema);
