import { Router, Request, Response } from 'express';
import * as assignmentsService from '../../DB_Service/Assignments/AssignmentsService';
import * as submissionsService from '../../DB_Service/Submission/SubmissionService';
import { authenticateUser, AuthedRequest } from '../../Middleware/AuthenticationMid';
import { authorizeStudent } from '../../Middleware/AuthorizationMid';

export const router = Router();

// every student route requires a valid token
router.use(authenticateUser);

router.get('/assignments', async (req: Request, res: Response) => {
    res.json(await assignmentsService.openAssignments());
});

router.post('/submissions', authorizeStudent, async (req: Request, res: Response) => {
    const studentId = (req as AuthedRequest).user.id;
    const submission = await submissionsService.submitAssignment(studentId, {
        assignmentId: req.body?.assignmentId,
        // both spellings are accepted
        githubLink: req.body?.githubLink ?? req.body?.gitHubLink,
        partner: req.body?.partner
    });
    res.status(201).json(submission);
});

router.get('/submissions/me', authorizeStudent, async (req: Request, res: Response) => {
    const studentId = (req as AuthedRequest).user.id;
    res.json({
        'your grades': await submissionsService.getSubmissionsByStudent(studentId),
        'class avg': await submissionsService.getAverageGrades()
    });
});
