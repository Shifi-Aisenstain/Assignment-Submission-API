/**
 * Fills the database with demo data so the app can be tried right away: `npm run seed`.
 * Safe to run more than once. Demo accounts (password for all: Demo1234):
 *   teacher1 (Teacher), student1 and student2 (Students)
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './DB_Service/Users/UserModel';
import { Assignment } from './DB_Service/Assignments/assignmentModel';
import { Submission } from './DB_Service/Submission/SubmissionModel';

const DEMO_PASSWORD = 'Demo1234';
const inDays = (days: number) => new Date(Date.now() + days * 86_400_000);

async function main() {
    await mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://localhost:27017/assignments');

    const users = [
        { _id: 'teacher1', name: 'Sarah Cohen', email: 'sarah@example.com', role: 'Teacher' },
        { _id: 'student1', name: 'David Levi', email: 'david@example.com', role: 'Student' },
        { _id: 'student2', name: 'Maya Cohen', email: 'maya@example.com', role: 'Student' },
    ];
    for (const user of users) {
        if (!(await User.exists({ _id: user._id }))) {
            await new User({ ...user, password: DEMO_PASSWORD }).save();
        }
    }

    const assignments = [
        { title: 'JavaScript Basics', description: 'Build a calculator using vanilla JavaScript', dueDate: inDays(14) },
        { title: 'React Todo App', description: 'Build a todo application with React and CRUD operations', dueDate: inDays(30) },
        { title: 'Intro to HTML', description: 'A personal page (already closed)', dueDate: inDays(-10) },
    ];
    const saved = [];
    for (const data of assignments) {
        saved.push((await Assignment.findOne({ title: data.title })) ?? (await new Assignment(data).save()));
    }

    if (!(await Submission.exists({ assignmentId: saved[0]._id, studentId: 'student1' }))) {
        await new Submission({
            assignmentId: saved[0]._id,
            studentId: 'student1',
            partner: 'student2',
            githubLink: 'https://github.com/student1/js-calculator',
            grade: 92,
            feedback: 'Clean code, nice work.'
        }).save();
    }

    console.log('Demo data is ready (see the header of src/seed.ts for the demo accounts).');
    await mongoose.disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
