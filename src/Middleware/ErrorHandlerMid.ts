import { Request, Response, NextFunction } from "express";
import { logger } from "../Utils/Logger";

/**
 * Last middleware in the chain. Converts any error (http-errors, Mongoose, body parser)
 * to a JSON response with a suitable status code.
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  let status: number = err.status || err.statusCode || 500;
  let message: string = err.message || "Internal server error";

  if (err.name === "ValidationError" && err.errors) {
    status = 400;
    message = Object.values<any>(err.errors).map((e) => e.message).join(", ");
  } else if (err.name === "CastError") {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    message = "A record with the same unique value already exists";
  }

  if (status >= 500) {
    logger.error(`Server error on ${req.method} ${req.originalUrl}: ${err.stack || err.message}`);
    message = "Internal server error";
  } else {
    logger.warn(`${status} on ${req.method} ${req.originalUrl}: ${message}`);
  }

  res.status(status).json({ error: message });
}
