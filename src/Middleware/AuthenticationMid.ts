import { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import { AuthService } from "../Routers/Authentication/JwtUtils";

export type Role = "Student" | "Teacher";

export interface AuthUser {
  id: string;
  role: Role;
}

export interface AuthedRequest extends Request {
  user: AuthUser;
}

const authService = new AuthService();

/** Verifies the Bearer token and stores the user (id and role) on the request. */
export function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const [scheme, token] = (req.headers.authorization ?? "").split(" ");
  if (scheme !== "Bearer" || !token) {
    throw createError(401, "Missing or malformed Authorization header (expected: Bearer <token>)");
  }

  let decoded: any;
  try {
    decoded = authService.verifyToken(token);
  } catch {
    throw createError(401, "Invalid or expired token");
  }

  (req as AuthedRequest).user = { id: decoded._id, role: decoded.role };
  next();
}
