import { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import { logger } from "../Utils/Logger";
import { AuthedRequest, Role } from "./AuthenticationMid";

/** Allows the request only for users with the given role. Must run after authenticateUser. */
function requireRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthedRequest).user;
    logger.debug(`Role check: required ${role}, user has ${user?.role}`);
    if (user?.role !== role) {
      throw createError(403, `This endpoint is for ${role.toLowerCase()}s only`);
    }
    next();
  };
}

export const authorizeTeacher = requireRole("Teacher");
export const authorizeStudent = requireRole("Student");
