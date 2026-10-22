import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';

process.env.JWT_SECRET = 'test-secret';
const TEST_DB = process.env.TEST_MONGODB_URI ?? 'mongodb://localhost:27017/assignments_api_test';

let app: import('express').Express;

const registerBody = (id: string, role = 'Student', extra: object = {}) => ({
  _id: id, name: `User ${id}`, email: `${id}@example.com`, password: 'Password1', role, ...extra
});

async function register(id: string, role = 'Student') {
  await request(app).post('/authentication/auth/register').send(registerBody(id, role)).expect(201);
  const res = await request(app).post('/authentication/auth/login').send({ userId: id, password: 'Password1' }).expect(200);
  return `Bearer ${res.body.token}`;
}

const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();
const REPO = 'https://github.com/someone/some-repo';

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
  await mongoose.connection.dropDatabase();
  app = (await import('../src/app')).default;
  await mongoose.syncIndexes();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('registration and login', () => {
  it('registers a user without exposing the password hash', async () => {
    const res = await request(app).post('/authentication/auth/register').send(registerBody('reg1')).expect(201);
    expect(res.body).toMatchObject({ userId: 'reg1', email: 'reg1@example.com', role: 'Student' });
    expect(res.body.password).toBeUndefined();
    expect(res.body.id).toBeUndefined();
  });

  it('rejects weak passwords, bad emails and bad roles with 400', async () => {
    const post = (b: object) => request(app).post('/authentication/auth/register').send(b);
    await post(registerBody('bad1', 'Student', { password: 'short1' })).expect(400);
    await post(registerBody('bad2', 'Student', { password: 'onlyletters' })).expect(400);
    await post(registerBody('bad3', 'Student', { email: 'not-an-email' })).expect(400);
    await post(registerBody('bad4', 'Admin')).expect(400);
  });

  it('rejects a duplicate user ID or email with 409', async () => {
    await request(app).post('/authentication/auth/register').send(registerBody('dup1')).expect(201);
    await request(app).post('/authentication/auth/register').send(registerBody('dup1', 'Student', { email: 'other@example.com' })).expect(409);
    await request(app).post('/authentication/auth/register').send(registerBody('dup2', 'Student', { email: 'DUP1@example.com' })).expect(409);
  });

  it('logs in with the right password and rejects wrong credentials with 401', async () => {
    await request(app).post('/authentication/auth/register').send(registerBody('login1')).expect(201);
    const ok = await request(app).post('/authentication/auth/login').send({ userId: 'login1', password: 'Password1' }).expect(200);
    expect(ok.body.token).toBeTruthy();
    await request(app).post('/authentication/auth/login').send({ userId: 'login1', password: 'WrongPass1' }).expect(401);
    await request(app).post('/authentication/auth/login').send({ userId: 'nobody', password: 'Password1' }).expect(401);
    await request(app).post('/authentication/auth/login').send({ userId: 'login1' }).expect(400);
  });
});

describe('authentication and authorization', () => {
  it('requires a token on student and teacher routes', async () => {
    await request(app).get('/student/assignments').expect(401);
    await request(app).get('/teacher/submissions').expect(401);
    await request(app).get('/teacher/submissions').set('Authorization', 'Bearer garbage').expect(401);
  });

  it('keeps students out of teacher routes and teachers out of student submissions', async () => {
    const student = await register('auth_student');
    const teacher = await register('auth_teacher', 'Teacher');
    await request(app).get('/teacher/submissions').set('Authorization', student).expect(403);
    await request(app).post('/student/submissions').set('Authorization', teacher).send({}).expect(403);
  });

  it('returns 404 JSON for unknown routes and 400 for malformed JSON', async () => {
    await request(app).get('/nonexistent/route').expect(404);
    await request(app).post('/authentication/auth/login').set('Content-Type', 'application/json').send('{bad json').expect(400);
  });
});

describe('assignments, submissions and grading', () => {
  let teacher: string, alice: string, bob: string;
  let openId: string, closedId: string;

  beforeAll(async () => {
    teacher = await register('t1', 'Teacher');
    alice = await register('alice');
    bob = await register('bob');
  });

  it('teachers create assignments with validation', async () => {
    await request(app).post('/teacher/assignments').set('Authorization', teacher).send({ description: 'no title', dueDate: inDays(5) }).expect(400);
    await request(app).post('/teacher/assignments').set('Authorization', teacher).send({ title: 'X', dueDate: 'not a date' }).expect(400);

    const open = await request(app).post('/teacher/assignments').set('Authorization', teacher)
      .send({ title: 'JavaScript Basics', description: 'calculator', dueDate: inDays(7) }).expect(201);
    expect(open.body.isOpen).toBe(true);
    openId = open.body._id;

    const closed = await request(app).post('/teacher/assignments').set('Authorization', teacher)
      .send({ title: 'Old assignment', dueDate: inDays(-3) }).expect(201);
    expect(closed.body.isOpen).toBe(false);
    closedId = closed.body._id;
  });

  it('students only see open assignments', async () => {
    const res = await request(app).get('/student/assignments').set('Authorization', alice).expect(200);
    const ids = res.body.map((a: any) => a._id);
    expect(ids).toContain(openId);
    expect(ids).not.toContain(closedId);
  });

  it('validates a submission: link, assignment, due date and partner', async () => {
    const submit = (body: object, who = alice) => request(app).post('/student/submissions').set('Authorization', who).send(body);
    await submit({ assignmentId: openId, githubLink: 'not a link' }).expect(400);
    await submit({ assignmentId: 'abc', githubLink: REPO }).expect(400);
    await submit({ assignmentId: new mongoose.Types.ObjectId().toString(), githubLink: REPO }).expect(404);
    await submit({ assignmentId: closedId, githubLink: REPO }).expect(400);
    await submit({ assignmentId: openId, githubLink: REPO, partner: 'alice' }).expect(400);
    await submit({ assignmentId: openId, githubLink: REPO, partner: 't1' }).expect(400);
    await submit({ assignmentId: openId, githubLink: REPO, partner: 'ghost' }).expect(400);
  });

  it('accepts a submission with a partner and blocks duplicates', async () => {
    const created = await request(app).post('/student/submissions').set('Authorization', alice)
      .send({ assignmentId: openId, gitHubLink: REPO, partner: 'bob' }).expect(201);
    expect(created.body.studentId).toBe('alice');

    await request(app).post('/student/submissions').set('Authorization', alice).send({ assignmentId: openId, githubLink: REPO }).expect(409);
    await request(app).post('/student/submissions').set('Authorization', bob).send({ assignmentId: openId, githubLink: REPO }).expect(409);
  });

  it('shows a student their submissions, including as a partner, with class averages', async () => {
    const res = await request(app).get('/student/submissions/me').set('Authorization', bob).expect(200);
    expect(res.body['your grades']).toHaveLength(1);
    expect(res.body['your grades'][0].studentId.name).toBe('User alice');
    expect(res.body['class avg'].length).toBeGreaterThan(0);
  });

  it('lets a teacher grade a submission and validates the grade', async () => {
    const grade = (g: unknown, feedback?: string) =>
      request(app).put(`/teacher/submissions/alice/${openId}`).set('Authorization', teacher).send({ grade: g, feedback });
    await grade(101).expect(400);
    await grade('abc').expect(400);
    await grade(undefined).expect(400);
    await request(app).put(`/teacher/submissions/nobody/${openId}`).set('Authorization', teacher).send({ grade: 90 }).expect(404);

    const ok = await grade(88, 'Nice work').expect(200);
    expect(ok.body).toMatchObject({ grade: 88, feedback: 'Nice work', isGraded: true });
  });

  it('keeps a grade of 0 as a real grade', async () => {
    const res = await request(app).put(`/teacher/submissions/alice/${openId}`).set('Authorization', teacher).send({ grade: 0 }).expect(200);
    expect(res.body.grade).toBe(0);
    expect(res.body.isGraded).toBe(true);
    await request(app).put(`/teacher/submissions/alice/${openId}`).set('Authorization', teacher).send({ grade: 88 }).expect(200);
  });

  it('lists all submissions and average grades for teachers', async () => {
    const subs = await request(app).get('/teacher/submissions').set('Authorization', teacher).expect(200);
    expect(subs.body[0].assignmentId.title).toBe('JavaScript Basics');
    expect(subs.body[0].partner.name).toBe('User bob');

    const avgs = await request(app).get('/teacher/stats/averages').set('Authorization', teacher).expect(200);
    const js = avgs.body.find((a: any) => a.assignmentId === openId);
    expect(js.Average).toBe(88);
    expect(avgs.body.find((a: any) => a.assignmentId === closedId).Average).toBeNull();
  });
});
