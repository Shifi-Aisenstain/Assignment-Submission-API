import { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import { User } from "../DB_Service/Users/UserModel";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePassword(req: Request, res: Response, next: NextFunction) {
  const password = req.body?.password;
  if (!password || typeof password !== "string") {
    return next(createError(400, "Password is required for registration."));
  }
  if (password.length < 8) {
    return next(createError(400, "Password must be at least 8 characters long."));
  }
  if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
    return next(createError(400, "Password must contain at least one letter and one number."));
  }
  next();
}

export function validateProfile(req: Request, res: Response, next: NextFunction) {
  const { name, email, role } = req.body ?? {};
  if (!name || typeof name !== "string" || !name.trim()) {
    return next(createError(400, "Name is required."));
  }
  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    return next(createError(400, "A valid email address is required."));
  }
  if (role !== undefined && role !== "Student" && role !== "Teacher") {
    return next(createError(400, "Role must be 'Student' or 'Teacher'."));
  }
  next();
}

export async function validateUniqueId(req: Request, res: Response, next: NextFunction) {
  const id = req.body?._id;
  if (!id || typeof id !== "string" || !id.trim()) {
    return next(createError(400, "Invalid or missing userId."));
  }
  if (await User.exists({ _id: id })) {
    return next(createError(409, "User ID already exists."));
  }
  next();
}

export async function validateUniqueEmail(req: Request, res: Response, next: NextFunction) {
  const email = String(req.body.email).trim().toLowerCase();
  if (await User.exists({ email })) {
    return next(createError(409, "Email is already registered."));
  }
  next();
}
