# Assignment Submission API

A REST API for submitting and grading student assignments, with separate roles for students and teachers. Built with **Node.js, Express, TypeScript, MongoDB (Mongoose) and JWT**.

Pair project by Shifra Aisenstain and Ayala.

> **Status: work in progress.** The server covers the main flows (users, assignments, submissions, grading, statistics). See [Status and next steps](#status-and-next-steps) for what is still being completed.

## Features

- **Roles:** `Student` and `Teacher`, enforced with JWT authentication and role-based authorization middleware.
- **Assignments:** teachers create assignments; students see the ones that are still open (`IsOpen` virtual field).
- **Submissions:** students submit a GitHub link, optionally with a partner; teachers grade with a score and feedback.
- **Statistics:** average grade per assignment (also shown to students next to their own grades).
- **Validation:** password rules (at least 8 characters, a letter and a digit) and unique user IDs on registration.
- **Centralized error handling** middleware that returns JSON errors with a status code.
- **Logging with Winston:** every request, failed logins, DB connection state and errors, written to daily log files under `logs/`.
- **Layered structure:** routers (HTTP), services (database access) and models (Mongoose schemas).

## Tech stack

Node.js, Express 5, TypeScript, MongoDB with Mongoose, JSON Web Tokens, bcrypt, Winston.

## Project structure

```
src/
  server.ts, app.ts          entry point and Express setup
  Routers/                   Authentication, Student and Teacher routes (+ JWT helper)
  Middlware/                 authentication, authorization, validation, logging, error handler
  DB_Service/                Users, Assignments, Submission: Mongoose models and services
  Utils/                     MongoDB connection and Winston logger
client/                      static web client (work in progress)
postman/                     Postman collection with the API requests
data/                        sample exports of assignments and submissions
```

## Getting started

**Requirements:** Node.js 20+ and a running MongoDB (default `mongodb://localhost:27017`).

```bash
npm install
cp .env.example .env     # then set JWT_SECRET to a long random string
npm run dev              # or: npm run build && npm start
```

The server listens on `http://localhost:3000` (configurable with `PORT`).

| Variable | Description | Default |
|---|---|---|
| `JWT_SECRET` | Secret used to sign tokens (**required**) | none |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/assignments` |
| `PORT` | HTTP port | `3000` |

Import `postman/Assignment-Submission-API.postman_collection.json` into Postman to try the endpoints. Log in first and use the returned token as a `Bearer` token for protected requests.

## API

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/authentication/auth/register` | public | Register a user: `_id`, `name`, `email`, `password`, `role` |
| POST | `/authentication/auth/login` | public | Log in with `userId` and `password`; returns a JWT |
| GET | `/student/assignments` | public | Assignments that are still open |
| POST | `/student/submissions` | student | Submit: `assignmentId`, `gitHubLink`, optional `partner` |
| GET | `/student/submissions/me` | student | My submissions (including as a partner) and class averages |
| POST | `/teacher/assignments` | teacher | Create an assignment: `title`, `description`, `dueDate` |
| GET | `/teacher/submissions` | teacher | All submissions with student, partner and assignment details |
| PUT | `/teacher/submissions/:studentId/:assignmentsId` | teacher | Set `grade` and `feedback` |
| GET | `/teacher/stats/averages` | teacher | Average grade per assignment |

## Status and next steps

Known gaps that are being worked on:

- Login compares the plain password with the stored bcrypt hash, so it must use `bcrypt.compare`.
- The register response returns the password hash; it should be removed from the response.
- Status codes: successful `GET` requests return `201`, authentication errors use `400`/`402`, and route handlers replace the real error with a generic `403`.
- Email validation and email uniqueness are not enforced yet (`express-validator` is installed but unused).
- Submissions are not checked against the assignment's due date or for duplicates, and a partner is only checked to exist, not to be a student.
- `GET /student/assignments` is public; the specification asks for authentication on student routes.
- The web client has only the landing page and the student dashboard. The teacher dashboard is missing, and the server does not yet serve the client or allow cross-origin requests.
- No automated tests yet.
