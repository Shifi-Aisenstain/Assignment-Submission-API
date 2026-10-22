import path from 'path';
import express from 'express';
import createError from 'http-errors';
import { router as authenticationRouter } from './Routers/Authentication/AuthenticationRouter';
import { router as studentRouter } from './Routers/Student/StudentRouter';
import { router as teacherRouter } from './Routers/Teacher/TeacherRouter';
import { logRequest } from './Middleware/LoggerMid';
import { errorHandler } from './Middleware/ErrorHandlerMid';

const app = express();

app.use(express.json());
app.use(logRequest);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/authentication', authenticationRouter);
app.use('/student', studentRouter);
app.use('/teacher', teacherRouter);

// the web client is served by the same server, so no CORS configuration is needed
app.use(express.static(path.join(__dirname, '..', 'client')));

app.use((req, res, next) => next(createError(404, 'Route not found')));
app.use(errorHandler);

export default app;
