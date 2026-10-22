import { Request, Response, NextFunction } from "express";
import {logger} from "../Utils/Logger"


export function logRequestToFile(req: Request, res: Response, next: NextFunction) {
  logger.info(`[${new Date().toISOString()}] {${req.method}} ${req.url}`);
  next();
  logger.debug(`the request returen with status code: ${res.statusCode}`);
}

export function logRequest(req: Request, res: Response, next: NextFunction) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
  console.log(`${res.statusCode}`);
}
