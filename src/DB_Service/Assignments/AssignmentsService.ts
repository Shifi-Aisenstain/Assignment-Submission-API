import createError from 'http-errors';
import { Assignment, IAssignment } from './assignmentModel';
import { logger } from '../../Utils/Logger';

export async function createAssignment(data: { title?: unknown; description?: unknown; dueDate?: unknown }): Promise<IAssignment> {
  if (typeof data.title !== 'string' || !data.title.trim()) {
    throw createError(400, 'Title is required.');
  }
  const dueDate = new Date(data.dueDate as string);
  if (data.dueDate === undefined || Number.isNaN(dueDate.getTime())) {
    throw createError(400, 'A valid dueDate is required.');
  }

  const assignment = await new Assignment({
    title: data.title,
    description: typeof data.description === 'string' ? data.description : undefined,
    dueDate
  }).save();
  logger.info(`Assignment created: ${assignment.title} due on ${assignment.dueDate.toISOString()}`);
  return assignment;
}

export async function openAssignments(): Promise<IAssignment[]> {
  const assignments = await Assignment.find({ dueDate: { $gt: new Date() } }).sort({ dueDate: 1 }).exec();
  logger.info(`Open assignments retrieved: ${assignments.length} found`);
  return assignments;
}
