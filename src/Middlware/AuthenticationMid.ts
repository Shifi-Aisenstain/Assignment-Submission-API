import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { AuthService } from "../Routers/Authentication/JwtUtils";
import { logger } from "../Utils/Logger";
import createError from "http-errors";

const authService = new AuthService();

export function authenticatUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  logger.debug(authHeader);
  const token = authHeader?.split(" ")[1]; 
  if (!token) {
    throw createError(400, "Missing token");
  }
  try{
    const decoded  = authService.verifyToken(token);
    (req as any).role = decoded.role;
    (req as any)._id = decoded._id;
    next();
  }
  catch (error)
  {
    throw createError(401, "Invalid or expired token");
  }

}

export function getStudentIdByToken(req: Request, res: Response) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1]; 
  if (!token) {
    throw createError(400, "Missing token");
  }
  try{
    const decoded  = authService.verifyToken(token);
    return decoded.studentId;
    
  }
  catch (error)
  {
    throw createError(401, "Invalid or expired token");
  }

}




