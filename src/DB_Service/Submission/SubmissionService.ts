import { Assignment, IAssignment } from '../../DB_Service/Assignments/assignmentModel';
import mongoose from 'mongoose';
import { ISubmission, Submission } from './SubmissionModel';
import { logger } from '../../Utils/Logger';
import { User } from '../Users/UserModel';

const populateSubmition = (query: mongoose.Query<ISubmission[], ISubmission>) => {
    return query
        .populate('studentId', 'name email role')
        .populate('partner', 'name email role')
        .populate('assignmentId', 'title description dueDate')
};

export async function getSubmitions(): Promise<ISubmission[]> {
    const query = Submission.find();
    logger.info(`All submissions retrieved`);
    return await populateSubmition(query).exec();
}

export async function addGrade(
    studentId: string,
    assignmentsId: string,
    grade: number,
    feedback?: string
): Promise<ISubmission | null> {
    const doc = await Submission.findOne({ studentId: studentId, assignmentId: assignmentsId }).exec();
    if (!doc)
        return null;
    doc.grade = grade;
    if (feedback !== undefined)
        doc.feedback = feedback;
    return await doc.save();
}

export async function getAvgGrads(): Promise<{ assignmentTitle: string; Average: Number | null }[]> {
    const gradesMap = new Map<string, { sum: number; count: number }>();
    
    // קבל את כל ההגשות עם populate של assignmentId
    const submissions = await Submission.find().populate('assignmentId', 'title').exec();
    
    // קבץ לפי שם המטלה
    for (const submission of submissions) {
        if (submission.assignmentId && submission.grade !== undefined) {
            const title = (submission.assignmentId as any).title;
            if (!gradesMap.has(title)) {
                gradesMap.set(title, { sum: 0, count: 0 });
            }
            const current = gradesMap.get(title)!;
            current.sum += submission.grade;
            current.count++;
        }
    }
    
    // הוסף מטלות ללא ציונים
    const assignments = await Assignment.find().exec();
    for (const assignment of assignments) {
        if (!gradesMap.has(assignment.title)) {
            gradesMap.set(assignment.title, { sum: 0, count: 0 });
        }
    }
    
    // חשב ממוצעים
    const allGrads: { assignmentTitle: string; Average: Number | null }[] = [];
    for (const [title, data] of gradesMap) {
        const average = data.count > 0 ? data.sum / data.count : null;
        allGrads.push({ assignmentTitle: title, Average: average });
    }
    
    logger.info(`Average grades calculated for ${allGrads.length} assignments`);
    logger.info(`Average grades viewed`);
    return allGrads;
}

export async function submitionsById(studentId: string): Promise<ISubmission[]> {
    let query = Submission.find({
        $or: [
            { studentId: studentId },
            { partner: studentId }
        ]
    });
    return await populateSubmition(query).exec();
}

export async function submitAssigement(studentId: string, userData: {assignmentId: string, githubLink: string, partner?: string}): Promise<ISubmission> {
    let submission;
    
    if(userData.partner){
        const partner = await User.findOne({
            _id: userData.partner
        }).exec();
        if(!partner){
            throw new Error("Partner is not a student");
        }
        submission = new Submission({
            studentId: studentId,
            assignmentId: userData.assignmentId,
            githubLink: userData.githubLink,
            partner: userData.partner
        });
    } else {
        submission = new Submission({
            studentId: studentId,
            assignmentId: userData.assignmentId,
            githubLink: userData.githubLink
        });
    }
    
    await submission.save(); 
    logger.info(`Submission created for student ${studentId} for assignment ${userData.assignmentId}`);   
    return submission;
}