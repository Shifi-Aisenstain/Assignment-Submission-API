import { Assignment, IAssignment } from '../../DB_Service/Assignments/assignmentModel';
import { AuthService } from '../../Routers/Authentication/JwtUtils';
import mongoose from 'mongoose';    
import { logger } from '../../Utils/Logger';

const outhService = new AuthService();

export async function createAssignment(userData:
    {
        title: string,
        description?: string,
        dueDate: Date
    }): Promise<IAssignment> {
    const newAssignment = new Assignment(userData);
    logger.info(`Assignment created: ${userData.title} due on ${userData.dueDate}`);
    return await newAssignment.save();
}

export async function openAssignment(): Promise<IAssignment[]> {
    const now = new Date();
    const allAssignments = await Assignment.find().exec();
    const openAssignments = allAssignments.filter(assignment => assignment.dueDate > now);
    
    logger.info(`Open assignments retrieved: ${openAssignments.length} found`);
    return openAssignments;
}
    