import mongoose from 'mongoose';
import createError from 'http-errors';
import { Assignment } from '../Assignments/assignmentModel';
import { ISubmission, Submission } from './SubmissionModel';
import { User } from '../Users/UserModel';
import { logger } from '../../Utils/Logger';

const GITHUB_URL = /^https?:\/\/(www\.)?github\.com\/[\w.-]+(\/[\w.-]+)*\/?$/i;

const populated = (query: mongoose.Query<any, any>) =>
    query
        .populate('studentId', 'name email role')
        .populate('partner', 'name email role')
        .populate('assignmentId', 'title description dueDate');

export async function getSubmissions() {
    const submissions = await populated(Submission.find()).exec();
    logger.info(`All submissions retrieved: ${submissions.length}`);
    return submissions;
}

/** Submissions of a student, including the ones where the student is listed as the partner. */
export async function getSubmissionsByStudent(studentId: string) {
    return await populated(Submission.find({ $or: [{ studentId }, { partner: studentId }] })).exec();
}

export async function submitAssignment(
    studentId: string,
    data: { assignmentId: string; githubLink: string; partner?: string }
): Promise<ISubmission> {
    const { assignmentId, githubLink, partner } = data;

    if (!mongoose.isValidObjectId(assignmentId)) {
        throw createError(400, 'A valid assignmentId is required.');
    }
    if (typeof githubLink !== 'string' || !GITHUB_URL.test(githubLink)) {
        throw createError(400, 'githubLink must be a GitHub URL, e.g. https://github.com/user/repo');
    }

    const assignment = await Assignment.findById(assignmentId).exec();
    if (!assignment) {
        throw createError(404, 'Assignment not found.');
    }
    if (assignment.dueDate <= new Date()) {
        throw createError(400, 'The due date of this assignment has passed.');
    }

    if (partner) {
        if (partner === studentId) {
            throw createError(400, 'You cannot be your own partner.');
        }
        const partnerUser = await User.findById(partner).exec();
        if (!partnerUser || partnerUser.role !== 'Student') {
            throw createError(400, 'Partner must be an existing student.');
        }
        if (await Submission.exists({ assignmentId, studentId: partner })) {
            throw createError(409, 'Your partner has already submitted this assignment.');
        }
    }

    if (await Submission.exists({ assignmentId, $or: [{ studentId }, { partner: studentId }] })) {
        throw createError(409, 'This assignment was already submitted.');
    }

    const submission = await new Submission({ assignmentId, studentId, githubLink, partner: partner || undefined }).save();
    logger.info(`Submission created for student ${studentId}, assignment ${assignmentId}`);
    return submission;
}

export async function addGrade(studentId: string, assignmentId: string, grade: unknown, feedback?: unknown): Promise<ISubmission> {
    if (!mongoose.isValidObjectId(assignmentId)) {
        throw createError(400, 'A valid assignment ID is required.');
    }
    const score = Number(grade);
    if (grade === undefined || grade === null || grade === '' || !Number.isFinite(score) || score < 0 || score > 100) {
        throw createError(400, 'grade must be a number between 0 and 100.');
    }

    const submission = await Submission.findOne({ studentId, assignmentId }).exec();
    if (!submission) {
        throw createError(404, 'Submission not found.');
    }
    submission.grade = score;
    if (typeof feedback === 'string') {
        submission.feedback = feedback;
    }
    await submission.save();
    logger.info(`Grade ${score} saved for student ${studentId}, assignment ${assignmentId}`);
    return submission;
}

export interface AssignmentAverage {
    assignmentId: string;
    assignmentTitle: string;
    Average: number | null;
}

/** Average grade of every assignment (null when nothing was graded yet). */
export async function getAverageGrades(): Promise<AssignmentAverage[]> {
    const [assignments, stats] = await Promise.all([
        Assignment.find().exec(),
        Submission.aggregate<{ _id: mongoose.Types.ObjectId; avg: number }>([
            { $match: { grade: { $exists: true, $ne: null } } },
            { $group: { _id: '$assignmentId', avg: { $avg: '$grade' } } }
        ])
    ]);
    const averages = new Map(stats.map(s => [String(s._id), s.avg]));

    logger.info(`Average grades calculated for ${assignments.length} assignments`);
    return assignments.map(a => ({
        assignmentId: String(a._id),
        assignmentTitle: a.title,
        Average: averages.get(String(a._id)) ?? null
    }));
}
