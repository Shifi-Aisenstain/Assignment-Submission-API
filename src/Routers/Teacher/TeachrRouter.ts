import { Router, Request, Response, NextFunction } from 'express';
import * as assignmentsService from '../../DB_Service/Assignments/AssignmentsService';
import * as submissionsService from '../../DB_Service/Submission/SubmissionService';
import createError from 'http-errors';
export const router = Router();
import { AuthorizatTeacher } from '../../Middlware/AuthorizationMid';
import {authenticatUser} from '../../Middlware/AuthenticationMid';

router.post('/assignments', authenticatUser, AuthorizatTeacher, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const assignments = await assignmentsService.createAssignment(req.body);
        res.status(201).json(assignments);
    } catch (error) {
        next(createError(403, "could not create user"));
    }
});
router.get('/submissions', authenticatUser, AuthorizatTeacher, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const submissions = await submissionsService.getSubmitions();
        res.status(201).json(submissions);
    } catch (error) {
        next(createError(403, "could not get submissions"));
    }
});
router.put('/submissions/:studentId/:assignmentsId', authenticatUser, AuthorizatTeacher, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { studentId, assignmentsId } = req.params as { studentId: string; assignmentsId: string };

        const submissionWithGrade = await submissionsService.addGrade(studentId, assignmentsId, Number(req.body.grade), req.body.feedback);
        res.status(201).json(submissionWithGrade);

    } catch (error) {
        next(createError(403, "could not add grade"));
    }
});

router.get('/stats/averages', authenticatUser, AuthorizatTeacher, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const Grads = await submissionsService.getAvgGrads();
        res.status(201).json(Grads);
    } catch (error) {
        next(createError(403, "could not get averages"));
    }
});
