import { Router, Request, Response, NextFunction } from 'express';
import * as assignmentsService from '../../DB_Service/Assignments/AssignmentsService';
import * as submissionsService from '../../DB_Service/Submission/SubmissionService';
import createError from 'http-errors';
export const router = Router();
import { AuthorizatTeacher } from '../../Middlware/AuthorizationMid';
import { authenticatUser } from '../../Middlware/AuthenticationMid';
import { getStudentIdByToken } from '../../Middlware/AuthenticationMid';    

router.get('/assignments', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const assignments = await assignmentsService.openAssignment();
        res.status(201).json(assignments);
    } catch (error) {
        next(createError(403, "could not show open assignments"));
    }
});


router.post('/submissions', authenticatUser, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const studentId= (req as any)._id;
        const submissions = await submissionsService.submitAssigement(studentId, {
            assignmentId: req.body.assignmentId,
            githubLink: req.body.gitHubLink,
            partner: req.body.partner
        });
        res.status(201).json(submissions);
    } catch (error) {
        next(createError(403, "could not submit assignment"));
    }
});

router.get('/submissions/me', authenticatUser, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const studentId = (req as any)._id;
        const mySubmissions = await submissionsService.submitionsById(studentId);
        const markAvg = await submissionsService.getAvgGrads();
        res.status(201).json({
            "your grades": mySubmissions,
            "class avg": markAvg
        });
    } catch (error) {
        next(createError(403, "could not get your submissions"));
    }
});
