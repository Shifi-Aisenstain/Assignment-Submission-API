import express, { Request, Response }  from 'express';
import { router as authenticationRouter } from './Routers/Authentication/AuthenticationRouter';
import { router as studentRouter } from './Routers/Student/StudentRouter';
import { router as teacherRouter } from './Routers/Teacher/TeachrRouter';
import {myDB} from './Utils/ConnectDB';
import { errorHandler } from './Middlware/ErrorHendlerMid';
import { logger } from './Utils/Logger';
const app = express();

app.use(express.json());
myDB.getDB();

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
    next();
});

app.use('/authentication', authenticationRouter);
app.use('/student', studentRouter);
app.use('/teacher', teacherRouter);

app.use(errorHandler); 

export default app;

