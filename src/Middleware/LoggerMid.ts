import { Request, Response, NextFunction } from "express";
import { logger } from "../Utils/Logger";

/** Logs every request once the response is sent: method, URL, status code and duration. */
export function logRequest(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on("finish", () => {
    logger.info(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start} ms)`);
  });
  next();
}
