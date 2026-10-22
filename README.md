# Assignment Submission API

A REST API and web client for submitting and grading student assignments, with separate roles for students and teachers. Built with **Node.js, Express, TypeScript, MongoDB (Mongoose) and JWT**.

Pair project by Shifra Aisenstain and Ayala.

## Features

- **Roles:** `Student` and `Teacher`, enforced with JWT authentication and role-based authorization middleware.
- **Assignments:** teachers create assignments; students see the ones that are still open (`isOpen` virtual field).
- **Submissions:** students submit a GitHub link, optionally with a partner. A submission is rejected when the assignment does not exist or is past its due date, when the link is not a GitHub URL, when it is a duplicate (also for the partner), or when the partner is not an existing student.
- **Grading:** teachers set a grade (0-100) and feedback. A student sees their own grades, also for work where they are the partner, next to the class average.
- **Statistics:** average grade per assignment.
- **Validation:** name, email format and uniqueness, user ID uniqueness, password rules (at least 8 characters, a letter and a digit) and role.
- **Security:** passwords are hashed with bcrypt and never returned by the API, login errors do not reveal which user IDs exist, the JWT secret comes from the environment.
- **Centralized error handling:** every error is returned as JSON `{ "error": "message" }` with a suitable status code (400, 401, 403, 404, 409, 500).
- **Logging with Winston:** every request with its status and duration, failed logins, database connection state and errors, written to daily log files under `logs/`.
- **Layered structure:** routers (HTTP), services (business logic and database access) and models (Mongoose schemas).
- **Web client:** a static client served by the same server, with a login/registration page, a student dashboard and a teacher dashboard.
- **Tests:** automated API tests with Vitest and Supertest, and a CI workflow on GitHub Actions.

## Tech stack

Node.js, Express 5, TypeScript, MongoDB with Mongoose, JSON Web Tokens, bcrypt, Winston, Vitest, Supertest.

## Project structure

```
src/
  server.ts, app.ts          entry point and Express setup
  Routers/                   Authentication, Student and Teacher routes (+ JWT helper)
  Middleware/                authentication, authorization, validation, logging, error handler
  DB_Service/                Users, Assignments, Submission: Mongoose models and services
  Utils/                     MongoDB connection and Winston logger
client/                      static web client (HTML, CSS, vanilla JavaScript)
tests/                       API tests
postman/                     Postman collection with the API requests and checks
data/                        sample exports of assignments and submissions
```

## Getting started

**Requirements:** Node.js 20+ and a running MongoDB (default `mongodb://localhost:27017`).

```bash
npm install
cp .env.example .env     # then set JWT_SECRET to a long random string
npm run dev              # or: npm run build && npm start
```

Open `http://localhost:3000` for the web client. The API is served from the same address.

| Variable | Description | Default |
|---|---|---|
| `JWT_SECRET` | Secret used to sign tokens (**required**) | none |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/assignments` |
| `PORT` | HTTP port | `3000` |

## API

Protected endpoints expect `Authorization: Bearer <token>`, where the token comes from the login endpoint.

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/authentication/auth/register` | public | Register: `_id`, `name`, `email`, `password`, optional `role` (default `Student`). Returns `201` with the user (without the password) |
| POST | `/authentication/auth/login` | public | Log in with `userId` and `password`; returns `{ "token": "..." }` |
| GET | `/student/assignments` | any user | Assignments that are still open |
| POST | `/student/submissions` | student | Submit: `assignmentId`, `githubLink`, optional `partner`. Returns `201` |
| GET | `/student/submissions/me` | student | My submissions (including as a partner) and the class averages |
| POST | `/teacher/assignments` | teacher | Create an assignment: `title`, `description`, `dueDate`. Returns `201` |
| GET | `/teacher/submissions` | teacher | All submissions with student, partner and assignment details |
| PUT | `/teacher/submissions/:studentId/:assignmentsId` | teacher | Set `grade` (0-100) and `feedback` |
| GET | `/teacher/stats/averages` | teacher | Average grade per assignment (`null` when nothing was graded) |
| GET | `/health` | public | Health check |

## Tests

The tests run against a real MongoDB and use a temporary database (`assignments_api_test` by default, override with `TEST_MONGODB_URI`) that is dropped afterwards.

```bash
npm test
```

They cover registration and validation, login, authentication and authorization, assignment creation, submission rules (due date, partner, duplicates), grading (including a grade of 0) and the statistics.

The Postman collection in `postman/` can also be imported and run (for example with `newman`) against an empty database. It stores the tokens it receives from the login requests.

## Possible next steps

- Anyone can register as a `Teacher`. A real deployment should restrict teacher accounts, for example with an invitation code or an admin approval step.
- Pagination for the submissions list, and editing or deleting assignments.
- Rate limiting on the login endpoint.
