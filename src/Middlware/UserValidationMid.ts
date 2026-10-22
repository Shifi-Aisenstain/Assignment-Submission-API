import { Request, Response, NextFunction } from "express";
import { User } from "../DB_Service/Users/UserModel";
import createError from "http-errors";



export function validatePassword(req: Request, res: Response, next: NextFunction) {
    const password = req.body.password;
    if (!password) {
        return next(createError(400, 'Password is required for registration.'));
    }
    if (password.length < 8) {
        return next(createError(400, "Password must be at least 8 characters long."));
    }

    const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)/;
    if (!strongPasswordRegex.test(password)) {
        return next(createError(400, "Password must contain at least one letter and one number."));
    }
    next(); // הכל תקין, עוברים ל-Middleware הבא
};

export async function validateUniqueId(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.body._id;
        if (!id || typeof id !== 'string') {
            return next(createError(400, "Invalid or missing userId."));
        }

        const existingUser = await User.findOne({ _id: id });
        if (existingUser) {
            return next(createError(409, "User ID already exists."));
        }
        next(); 
    } catch (error) {
        next(error);
    }
}

