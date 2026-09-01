import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import argon2 from 'argon2';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createApi } from '../server/api.mjs';
import { createDatabase } from '../server/db.mjs';

const testUrl = process.env.TEST_DATABASE_URL;

test('fluxo online: turma, revisão, reinício e senha temporária', { skip: !testUrl }, async () => {
  process.env.DATABASE_URL = testUrl;
  process.env.COOKIE_SECURE = 'false';
  const root = fileURLToPath(new URL('..', import.meta.url));
  const db = createDatabase();
  await db.query(await readFile(new URL('../server/schema.sql', import.meta.url), 'utf8'));

  const suffix = crypto.randomBytes(4).toString('hex');
  const mentorName = `mentor_${suffix}`;
  const studentName = `student_${suffix}`;
  const mentorPassword = `Mentor-${suffix}-safe`;
  let mentorId;
  let studentId;
  let teamId;
  const server = http.createServer(createApi(root));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  const request = async (path, { method = 'GET', body, cookie } = {}) => {
    const response = await fetch(`${base}${path}`, {
      method, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const data = await response.json();
    return { status: response.status, data, cookie: response.headers.get('set-cookie')?.split(';')[0] };
  };

  try {
    const passwordHash = await argon2.hash(mentorPassword, { type: argon2.argon2id });
    await db.transaction(null, async (client) => {
      const user = await client.query("INSERT INTO users(username,password_hash,role) VALUES($1,$2,'mentor') RETURNING id", [mentorName, passwordHash]);
      mentorId = user.rows[0].id;
      await client.query("SELECT set_config('app.user_id',$1,true)", [mentorId]);
      await client.query('INSERT INTO investigator_profiles(user_id,display_name) VALUES($1,$2)', [mentorId, mentorName]);
      const team = await client.query('INSERT INTO teams(name,code,created_by) VALUES($1,$2,$3) RETURNING id', [`Equipe ${suffix}`, suffix.toUpperCase(), mentorId]);
      teamId = team.rows[0].id;
      await client.query("INSERT INTO team_members(team_id,user_id,member_role) VALUES($1,$2,'mentor')", [teamId, mentorId]);
    });

    assert.equal((await request('/api/auth/register', { method: 'POST', body: { username: studentName, password: 'student-safe-password' } })).status, 400);
    const registered = await request('/api/auth/register', { method: 'POST', body: { username: studentName, password: 'student-safe-password', teamCode: suffix } });
    assert.equal(registered.status, 201);
    studentId = registered.data.user.id;

    const selection = { caseId: 'vesper_case_01', routeId: 'arrays_beginner', languageId: 'java', snapshot: { player: { name: studentName } } };
    const started = await request('/api/runs/start', { method: 'POST', cookie: registered.cookie, body: selection });
    assert.equal(started.status, 201);
    assert.equal(started.data.run.attempt_number, 1);

    const sync = await request('/api/runs/sync', { method: 'POST', cookie: registered.cookie, body: { ...selection, runId: started.data.run.id, revision: 0, events: [] } });
    assert.equal(sync.data.revision, 1);
    const stale = await request('/api/runs/sync', { method: 'POST', cookie: registered.cookie, body: { ...selection, runId: started.data.run.id, revision: 0, events: [] } });
    assert.equal(stale.status, 409);

    const restarted = await request('/api/runs/restart', { method: 'POST', cookie: registered.cookie, body: { ...selection, runId: started.data.run.id } });
    assert.equal(restarted.data.run.attempt_number, 2);
    assert.equal((await db.query('SELECT status FROM case_runs WHERE id=$1', [started.data.run.id])).rows[0].status, 'abandoned');

    const mentorLogin = await request('/api/auth/login', { method: 'POST', body: { username: mentorName, password: mentorPassword } });
    const report = await request(`/api/mentor/teams/${teamId}/report`, { cookie: mentorLogin.cookie });
    assert.equal(report.status, 200);
    assert.deepEqual(report.data.students.map((row) => row.attempt_number).sort(), [1, 2]);

    const reset = await request(`/api/mentor/teams/${teamId}/students/${studentId}/reset-password`, { method: 'POST', cookie: mentorLogin.cookie, body: {} });
    assert.equal(reset.status, 200);
    assert.equal((await request('/api/me', { cookie: registered.cookie })).data.authenticated, false);
    const temporaryLogin = await request('/api/auth/login', { method: 'POST', body: { username: studentName, password: reset.data.temporaryPassword } });
    assert.equal((await request('/api/me', { cookie: temporaryLogin.cookie })).data.user.must_change_password, true);
    assert.equal((await request('/api/auth/change-password', { method: 'POST', cookie: temporaryLogin.cookie, body: { password: 'new-student-password' } })).status, 200);
  } finally {
    if (teamId) await db.query('DELETE FROM teams WHERE id=$1', [teamId]);
    if (studentId) await db.query('DELETE FROM users WHERE id=$1', [studentId]);
    if (mentorId) await db.query('DELETE FROM users WHERE id=$1', [mentorId]);
    await new Promise((resolve) => server.close(resolve));
    await db.pool.end();
  }
});
