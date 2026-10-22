import { Router, Request, Response } from 'express';
import createError from 'http-errors';
import * as UserService from '../../DB_Service/Users/UserService';
import * as UserValidationMid from '../../Middleware/UserValidationMid';

export const router = Router();

router.post('/auth/register',
    UserValidationMid.validateProfile,
    UserValidationMid.validatePassword,
    UserValidationMid.validateUniqueId,
    UserValidationMid.validateUniqueEmail,
    async (req: Request, res: Response) => {
        const user = await UserService.createUser(req.body);
        res.status(201).json(user);
    });

router.post('/auth/login', async (req: Request, res: Response) => {
    const { userId, password } = req.body ?? {};
    if (typeof userId !== 'string' || typeof password !== 'string' || !userId || !password) {
        throw createError(400, 'userId and password are required.');
    }
    const token = await UserService.loginUser(userId, password);
    res.status(200).json({ token });
});
