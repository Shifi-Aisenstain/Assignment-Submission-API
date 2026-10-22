import { Request, Response, NextFunction } from "express";
import { logger } from "../Utils/Logger";
import createError from "http-errors";



export function AuthorizatTeacher(req: Request, res: Response, next: NextFunction) {
  logger.debug("the user role is: "+(req as any).role)
  if((req as any).role == "Teacher")
    next();
  else 
    throw createError(403, "students not allow to enter teachers page");
}


