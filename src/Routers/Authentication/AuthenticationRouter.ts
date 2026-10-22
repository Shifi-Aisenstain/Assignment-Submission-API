import { Router, Request, Response, NextFunction } from 'express';
import * as UserService from '../../DB_Service/Users/UserService';
import createError from 'http-errors';
import * as UserValidationMid from '../../Middlware/UserValidationMid';

export const router = Router();

router.post('/auth/register', 
    UserValidationMid.validatePassword, 
    UserValidationMid.validateUniqueId, 
    async (req: Request, res: Response, next: NextFunction) => {
        const user = await UserService.createUser(req.body);
        res.status(201).json(user);
    })
;

router.post('/auth/login', async (req: Request, res: Response, next: NextFunction) => {
    const token = await UserService.loginUser(req.body.userId, req.body.password );
    res.status(200).json({ token });
});