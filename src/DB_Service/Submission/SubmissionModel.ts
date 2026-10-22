import mongoose, { Schema, Types } from 'mongoose';

export interface ISubmission {
  assignmentId: Types.ObjectId;
  studentId: string;
  githubLink: string;
  partner?: string;
  grade?: number;
  feedback?: string;
}

export const submissionSchema = new Schema<ISubmission>(
  {
    assignmentId: { type: Schema.Types.ObjectId, required: true, ref: 'assignment' },
    studentId: { type: String, required: true, ref: 'user' },
    githubLink: { type: String, required: true },
    partner: { type: String, ref: 'user' },
    grade: { type: Number, min: 0, max: 100 },
    feedback: { type: String }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// true once a teacher has graded the submission
submissionSchema.virtual('isGraded').get(function () {
  return this.grade !== undefined && this.grade !== null;
});

export const Submission = mongoose.model<ISubmission>('Submission', submissionSchema);
