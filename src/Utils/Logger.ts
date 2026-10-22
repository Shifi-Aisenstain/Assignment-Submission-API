import winston from "winston";
import path from "path";

const today = new Date().toISOString().split("T")[0];//2025-04-06T12:34:56:876
const logFileName = path.join("logs", `app-${today}.log`);///logs/app-2025-04-06.log

export const logger = winston.createLogger({
  level: 'debug',
  //error, worning, info, debug.
  format: winston.format.combine(
    winston.format.timestamp({ format: 'DD/MM/YYYY HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()}${level =='error'? '!': ':)'}: ${message}`;
    })
  ),
  //[2025-04-01] INFO: get, /HOME/username
  //[2025-04-01] INFO: get, /HOME/username
  //[2025-04-01] INFO: get, /HOME/username
  //~~~~~2025-04-01~~~~~~ INFO: get, /HOME/username
  //[05.11.25 12:34:54] ERROR!: can't...
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/errors.log', level: 'error' }),
    new winston.transports.File({ filename: logFileName }),//logs/app.log
  ],
});
//app-23.03.25.log
//app-24.03.25.log
