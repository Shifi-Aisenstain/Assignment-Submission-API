import { Router, Request, Response } from 'express';
import * as assignmentsService from '../../DB_Service/Assignments/AssignmentsService';
import * as submissionsService from '../../DB_Service/Submission/SubmissionService';
import { authenticateUser } from '../../Middleware/AuthenticationMid';
import { authorizeTeacher } from '../../Middleware/AuthorizationMid';

export const router = Router();

// every teacher route requires a valid token of a teacher
router.use(authenticateUser, authorizeTeacher);

router.post('/assignments', async (req: Request, res: Response) => {
    res.status(201).json(await assignmentsService.createAssignment(req.body ?? {}));
});

router.get('/submissions', async (req: Request, res: Response) => {
    res.json(await submissionsService.getSubmissions());
});

router.put('/submissions/:studentId/:assignmentsId', async (req: Request, res: Response) => {
    const { studentId, assignmentsId } = req.params as { studentId: string; assignmentsId: string };
    const submission = await submissionsService.addGrade(studentId, assignmentsId, req.body?.grade, req.body?.feedback);
    res.json(submission);
});

router.get('/stats/averages', async (req: Request, res: Response) => {
    res.json(await submissionsService.getAverageGrades());
});
