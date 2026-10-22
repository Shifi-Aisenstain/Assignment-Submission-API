import { Request, Response, NextFunction } from "express";
import {logger} from "../Utils/Logger"

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err.status >= 500) {
    logger.error(`Server error: ${err.message}`);
  }
  logger.error(`Error: ${err.message || err}`)
  res.status(err.status || 500).json({ error: `Error: ${err.message || err}` });
}
