import mongoose, { Document, Double, Schema, Types } from 'mongoose';

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
    assignmentId: { 
      type: Schema.Types.ObjectId, 
      required: true, 
      ref: 'assignment' 
    },
    studentId: { 
      type: String, 
      required: true, 
      ref: 'user'
    },
    githubLink: { type: String, required: true },
    partner: { type: String, ref: 'user' },
    grade: { type: Number },
    feedback: { type: String }
  },
  { 
    toJSON: {virtuals: true},
    toObject: { virtuals: true }
  }
);
submissionSchema.virtual('ThereIsGrade?').get(function() {
    if(this.grade === undefined)
         return false;
    return true;
  
});

export const Submission = mongoose.model('Submission', submissionSchema);