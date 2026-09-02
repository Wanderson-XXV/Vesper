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

test('PostgreSQL: conta, execução versionada, isolamento, restart e sessão', { skip: !testUrl }, async () => {
  process.env.DATABASE_URL = testUrl;
  process.env.COOKIE_SECURE = 'false';
  const root = fileURLToPath(new URL('..', import.meta.url));
  const db = createDatabase();
  await db.query(await readFile(new URL('../server/schema.sql', import.meta.url), 'utf8'));

  const suffix = crypto.randomBytes(4).toString('hex');
  const mentorName = `mentor_${suffix}`;
  const studentName = `student_${suffix}`;
  const renamedStudent = `renamed_${suffix}`;
  const mentorPassword = `Mentor-${suffix}-safe`;
  const initialPassword = `Student-${suffix}-safe`;
  const changedPassword = `Changed-${suffix}-safe`;
  let mentorId;
  let studentId;
  let teamId;
  const server = http.createServer(createApi(root));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  const request = async (path, { method = 'GET', body, cookie, forwardedProto } = {}) => {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { Cookie: cookie } : {}),
        ...(forwardedProto ? { 'X-Forwarded-Proto': forwardedProto } : {})
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const data = await response.json();
    return { status: response.status, data, setCookie: response.headers.get('set-cookie') || '', cookie: response.headers.get('set-cookie')?.split(';')[0] };
  };

  const assertNoPasswordHash = (value) => assert.doesNotMatch(JSON.stringify(value), /password_hash/i);
  const makeSnapshot = (overrides = {}) => ({
    snapshotVersion: 1,
    caseId: 'vesper_case_01',
    contentVersion: '1.0.0',
    routeId: 'arrays_beginner',
    languageId: 'java',
    currentRoom: 'exterior',
    flags: {},
    knownCharacters: ['livia', 'tomas'],
    visitedRooms: ['exterior'],
    completedInteractions: [],
    completedChallenges: [],
    clues: [],
    inventory: [],
    presence: 0,
    challengeAttempts: {},
    challengeSeeds: {},
    hintUsage: {},
    relationships: {},
    player: { name: renamedStudent },
    endingId: null,
    caseCompleted: false,
    startedAt: Date.now(),
    updatedAt: Date.now(),
    cursor: { mode: 'explore', sceneId: null, nextEventIndex: 0, sceneStack: [], pendingChallenge: null },
    ...overrides
  });

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

    assert.equal((await request('/api/auth/register', { method: 'POST', body: { username: studentName, password: 'short', confirmPassword: 'short' } })).status, 400);
    assert.equal((await request('/api/auth/register', { method: 'POST', body: { username: studentName, password: initialPassword, confirmPassword: initialPassword } })).status, 400);
    const mismatchedConfirmation = await request('/api/auth/register', { method: 'POST', body: { username: studentName, password: initialPassword, confirmPassword: `${initialPassword}-different`, teamCode: suffix } });
    assert.equal(mismatchedConfirmation.status, 400);
    assert.match(mismatchedConfirmation.data.error, /Confirmação/);
    assert.equal((await db.query('SELECT count(*)::int AS count FROM users WHERE username=$1', [studentName])).rows[0].count, 0);
    const registered = await request('/api/auth/register', { method: 'POST', body: { username: studentName.toUpperCase(), password: initialPassword, confirmPassword: initialPassword, teamCode: suffix } });
    assert.equal(registered.status, 201);
    assertNoPasswordHash(registered.data);
    assert.match(registered.setCookie, /HttpOnly/);
    assert.doesNotMatch(registered.setCookie, /Secure/);
    studentId = registered.data.user.id;

    const loggedOut = await request('/api/auth/logout', { method: 'POST', cookie: registered.cookie });
    assert.equal(loggedOut.status, 200);
    assert.equal((await request('/api/auth/logout', { method: 'POST', cookie: loggedOut.cookie })).status, 200);
    assert.equal((await request('/api/me', { cookie: registered.cookie })).data.authenticated, false);

    const login = await request('/api/auth/login', { method: 'POST', body: { username: studentName.toUpperCase(), password: initialPassword }, forwardedProto: 'https' });
    assert.equal(login.status, 200);
    assertNoPasswordHash(login.data);
    assert.match(login.setCookie, /Secure/);
    let studentCookie = login.cookie;
    assert.equal((await request('/api/me', { cookie: studentCookie })).data.authenticated, true);

    const voluntaryChange = await request('/api/auth/change-password', {
      method: 'POST', cookie: studentCookie,
      body: { currentPassword: initialPassword, newPassword: changedPassword, confirmPassword: changedPassword }
    });
    assert.equal(voluntaryChange.status, 200);
    assertNoPasswordHash(voluntaryChange.data);
    assert.equal((await request('/api/me', { cookie: studentCookie })).data.authenticated, true);
    assert.equal((await request('/api/auth/login', { method: 'POST', body: { username: studentName, password: initialPassword } })).status, 401);
    const changedLogin = await request('/api/auth/login', { method: 'POST', body: { username: studentName, password: changedPassword } });
    assert.equal(changedLogin.status, 200);

    const duplicate = await request('/api/auth/register', { method: 'POST', body: { username: studentName, password: initialPassword, confirmPassword: initialPassword, teamCode: suffix } });
    assert.equal(duplicate.status, 409);
    const duplicateUsername = await request('/api/account/username', { method: 'POST', cookie: studentCookie, body: { username: mentorName, currentPassword: changedPassword } });
    assert.equal(duplicateUsername.status, 409);
    const changedUsername = await request('/api/account/username', { method: 'POST', cookie: studentCookie, body: { username: renamedStudent.toUpperCase(), currentPassword: changedPassword } });
    assert.equal(changedUsername.status, 200);
    assert.equal(changedUsername.data.user.username, renamedStudent);
    assertNoPasswordHash(changedUsername.data);
    assert.equal((await request('/api/me', { cookie: studentCookie })).data.user.username, renamedStudent);
    assert.equal((await request('/api/auth/login', { method: 'POST', body: { username: studentName, password: changedPassword } })).status, 401);

    const mentorLogin = await request('/api/auth/login', { method: 'POST', body: { username: mentorName, password: mentorPassword } });
    const reset = await request(`/api/mentor/teams/${teamId}/students/${studentId}/reset-password`, { method: 'POST', cookie: mentorLogin.cookie, body: {} });
    assert.equal(reset.status, 200);
    assertNoPasswordHash(reset.data);
    assert.equal((await request('/api/me', { cookie: studentCookie })).data.authenticated, false);
    const temporaryLogin = await request('/api/auth/login', { method: 'POST', body: { username: renamedStudent, password: reset.data.temporaryPassword } });
    assert.equal(temporaryLogin.status, 200);
    assert.equal(temporaryLogin.data.user.must_change_password, true);
    assert.equal((await request('/api/runs/start', { method: 'POST', cookie: temporaryLogin.cookie, body: {} })).status, 403);
    const temporaryChange = await request('/api/auth/change-password', { method: 'POST', cookie: temporaryLogin.cookie, body: { password: changedPassword, confirmPassword: changedPassword } });
    assert.equal(temporaryChange.status, 200);
    assert.equal((await request('/api/me', { cookie: temporaryLogin.cookie })).data.authenticated, true);
    studentCookie = temporaryLogin.cookie;

    const selection = { caseId: 'vesper_case_01', routeId: 'arrays_beginner', languageId: 'java', contentVersion: '1.0.0', snapshot: makeSnapshot() };
    const started = await request('/api/runs/start', { method: 'POST', cookie: studentCookie, body: selection });
    assert.equal(started.status, 201);
    assert.equal(started.data.run.attempt_number, 1);
    assert.equal(started.data.run.attemptNumber, 1);
    assert.equal(started.data.run.envelopeVersion, 1);
    assert.equal(started.data.run.snapshot.snapshotVersion, 1);
    const startedAgain = await request('/api/runs/start', { method: 'POST', cookie: studentCookie, body: selection });
    assert.equal(startedAgain.status, 200);
    assert.equal(startedAgain.data.run.id, started.data.run.id);
    const current = await request('/api/runs/current?caseId=vesper_case_01&routeId=arrays_beginner', { cookie: studentCookie });
    assert.equal(current.status, 200);
    assert.equal(current.data.run.id, started.data.run.id);

    const crossCase = await request('/api/runs/sync', { method: 'POST', cookie: studentCookie, body: {
      runId: started.data.run.id, caseId: 'vesper_case_02_observatory', routeId: 'bridge_loops_arrays', languageId: 'java', contentVersion: '1.1.0', revision: 0, snapshot: { caseId: 'vesper_case_02_observatory' }, events: []
    } });
    assert.equal(crossCase.status, 400);
    const crossRoute = await request('/api/runs/sync', { method: 'POST', cookie: studentCookie, body: { ...selection, runId: started.data.run.id, routeId: 'conditionals_beginner', revision: 0, snapshot: makeSnapshot({ routeId: 'conditionals_beginner' }), events: [] } });
    assert.equal(crossRoute.status, 400);
    const crossLanguage = await request('/api/runs/sync', { method: 'POST', cookie: studentCookie, body: { ...selection, runId: started.data.run.id, languageId: 'micropython', revision: 0, snapshot: makeSnapshot({ languageId: 'micropython' }), events: [] } });
    assert.equal(crossLanguage.status, 400);
    const crossUser = await request('/api/runs/sync', { method: 'POST', cookie: mentorLogin.cookie, body: { ...selection, runId: started.data.run.id, revision: 0, snapshot: makeSnapshot(), events: [] } });
    assert.equal(crossUser.status, 404);

    const invalidSnapshot = await request('/api/runs/sync', { method: 'POST', cookie: studentCookie, body: { ...selection, runId: started.data.run.id, revision: 0, snapshot: { snapshotVersion: 1, flags: [] }, events: [] } });
    assert.equal(invalidSnapshot.status, 400);
    const clue = { id: 'vesper_crest', title: 'Brasão Vesper', text: 'Três círculos.' };
    const clueEvent = { eventId: 'evt-one', eventKey: 'clue_found:vesper_crest', type: 'clue_found', sequence: 1, clueId: clue.id, optional: false, sceneId: 'exterior_gate', eventIndex: 1, at: 123 };
    const validSnapshot = makeSnapshot({ clues: [clue], storyEvents: [clueEvent], rewardsEarned: { xp: 999999, fieldMarks: 999999 } });
    const synced = await request('/api/runs/sync', { method: 'POST', cookie: studentCookie, body: { ...selection, runId: started.data.run.id, revision: 0, snapshot: validSnapshot, events: [clueEvent] } });
    assert.equal(synced.status, 200);
    assert.equal(synced.data.revision, 1);
    const persisted = await db.query('SELECT revision,snapshot FROM case_runs WHERE id=$1', [started.data.run.id]);
    assert.equal(Number(persisted.rows[0].revision), 1);
    assert.deepEqual(persisted.rows[0].snapshot.rewardsEarned, { xp: 0, fieldMarks: 0 });
    assert.equal((await db.query('SELECT count(*)::int AS count FROM story_events WHERE run_id=$1', [started.data.run.id])).rows[0].count, 1);

    const repeatedClue = { ...clueEvent, eventId: 'evt-one-replayed', at: 456 };
    const idempotent = await request('/api/runs/sync', { method: 'POST', cookie: studentCookie, body: { ...selection, runId: started.data.run.id, revision: 1, snapshot: makeSnapshot({ clues: [clue], storyEvents: [repeatedClue] }), events: [repeatedClue] } });
    assert.equal(idempotent.status, 200);
    assert.equal((await db.query('SELECT count(*)::int AS count FROM story_events WHERE run_id=$1', [started.data.run.id])).rows[0].count, 1);
    const forgedClue = { eventId: 'evt-forged', eventKey: 'clue_found:uncatalogued_shelf', type: 'clue_found', sequence: 2, clueId: 'uncatalogued_shelf', sceneId: 'intro_arrival', eventIndex: 0 };
    const forged = await request('/api/runs/sync', { method: 'POST', cookie: studentCookie, body: { ...selection, runId: started.data.run.id, revision: 2, snapshot: makeSnapshot({ clues: [clue, { id: 'uncatalogued_shelf' }], storyEvents: [clueEvent, forgedClue] }), events: [forgedClue] } });
    assert.equal(forged.status, 400);
    const conflict = await request('/api/runs/sync', { method: 'POST', cookie: studentCookie, body: { ...selection, runId: started.data.run.id, revision: 0, snapshot: makeSnapshot({ currentRoom: 'hall' }), events: [{ eventId: 'evt-conflict', type: 'unknown' }] } });
    assert.equal(conflict.status, 409);
    assert.equal((await db.query('SELECT count(*)::int AS count FROM story_events WHERE run_id=$1', [started.data.run.id])).rows[0].count, 1);

    const finalSnapshot = makeSnapshot({ currentRoom: 'hall', cursor: { mode: 'choice', sceneId: 'intro_arrival', nextEventIndex: 2, sceneStack: [], pendingChallenge: null } });
    const restarted = await request('/api/runs/restart', { method: 'POST', cookie: studentCookie, body: {
      runId: started.data.run.id, ...selection, revision: 2, finalSnapshot, newSnapshot: makeSnapshot({ currentRoom: 'exterior' }), events: [clueEvent]
    } });
    assert.equal(restarted.status, 201);
    assert.equal(restarted.data.run.attempt_number, 2);
    const archived = await db.query('SELECT status,revision,snapshot FROM case_runs WHERE id=$1', [started.data.run.id]);
    assert.equal(archived.rows[0].status, 'abandoned');
    assert.equal(Number(archived.rows[0].revision), 3);
    assert.equal(archived.rows[0].snapshot.currentRoom, 'hall');
    assert.equal((await db.query('SELECT count(*)::int AS count FROM story_events WHERE run_id=$1', [started.data.run.id])).rows[0].count, 1);
    await db.transaction(studentId, (client) => client.query('UPDATE case_runs SET snapshot=$2,envelope_version=1 WHERE id=$1', [restarted.data.run.id, { player: { name: renamedStudent }, currentRoom: 'exterior', flags: {} }]));
    const migrated = await request('/api/runs/current?caseId=vesper_case_01&routeId=arrays_beginner', { cookie: studentCookie });
    assert.equal(migrated.data.run.snapshot.snapshotVersion, 1);

    await db.transaction(studentId, async (client) => {
      for (const [index, challengeId] of ['ritual_0', 'ritual_1', 'ritual_2', 'ritual_3', 'ritual_4', 'ritual_5'].entries()) {
        await client.query('INSERT INTO ritual_attempts(run_id,challenge_id,input,submitted,correct,hint_level,attempt_no,client_attempt_id) VALUES($1,$2,$3,$4,true,0,1,$5)', [restarted.data.run.id, challengeId, { test: index }, 'ok', `completion-${suffix}-${index}`]);
      }
    });
    const endingSnapshot = makeSnapshot({
      caseCompleted: true,
      endingId: 'completed',
      cursor: { mode: 'ending', sceneId: 'ending_card', nextEventIndex: 0, sceneStack: [], pendingChallenge: null }
    });
    const endingSync = await request('/api/runs/sync', { method: 'POST', cookie: studentCookie, body: { ...selection, runId: restarted.data.run.id, revision: 0, snapshot: endingSnapshot, events: [] } });
    assert.equal(endingSync.status, 200);
    const pendingEnding = await db.query('SELECT status,snapshot FROM case_runs WHERE id=$1', [restarted.data.run.id]);
    assert.equal(pendingEnding.rows[0].status, 'active');
    assert.equal(pendingEnding.rows[0].snapshot.caseCompleted, false);
    assert.equal(pendingEnding.rows[0].snapshot.endingId, null);
    const completionBody = {
      runId: restarted.data.run.id,
      caseId: selection.caseId,
      routeId: selection.routeId,
      languageId: selection.languageId,
      contentVersion: selection.contentVersion,
      endingId: 'completed',
      snapshot: endingSnapshot
    };
    const staleCompletion = await request('/api/runs/complete', { method: 'POST', cookie: studentCookie, body: { ...completionBody, revision: 0 } });
    assert.equal(staleCompletion.status, 409);
    assert.equal((await db.query('SELECT status FROM case_runs WHERE id=$1', [restarted.data.run.id])).rows[0].status, 'active');
    const completed = await request('/api/runs/complete', { method: 'POST', cookie: studentCookie, body: { ...completionBody, revision: 1 } });
    assert.equal(completed.status, 200);
    assert.equal(completed.data.run.status, 'completed');
    assert.equal(completed.data.run.revision, 2);
    assert.equal(completed.data.run.snapshot.caseCompleted, true);
    assert.equal(completed.data.run.snapshot.endingId, 'completed');
    const repeatedCompletion = await request('/api/runs/complete', { method: 'POST', cookie: studentCookie, body: { ...completionBody, revision: 1 } });
    assert.equal(repeatedCompletion.status, 200);
    assert.equal(repeatedCompletion.data.run.revision, 2);
    assert.equal((await db.query("SELECT count(*)::int AS count FROM reward_transactions WHERE user_id=$1 AND source_key='case:vesper_case_01'", [studentId])).rows[0].count, 1);

    const observatorySnapshot = makeSnapshot({
      caseId: 'vesper_case_02_observatory',
      contentVersion: '1.1.0',
      routeId: 'bridge_loops_arrays',
      languageId: 'java',
      currentRoom: 'obs_archive',
      cursor: { mode: 'explore', sceneId: null, nextEventIndex: 0, sceneStack: [], pendingChallenge: null }
    });
    const observatorySelection = { caseId: 'vesper_case_02_observatory', routeId: 'bridge_loops_arrays', languageId: 'java', contentVersion: '1.1.0', snapshot: observatorySnapshot };
    const observatoryRun = await request('/api/runs/start', { method: 'POST', cookie: studentCookie, body: observatorySelection });
    assert.equal(observatoryRun.status, 201);
    const outOfOrderChoice = {
      eventId: 'choice-out-of-order', eventKey: 'story_choice:obs_plate_fate', type: 'story_choice', sequence: 1,
      choiceId: 'obs_plate_fate', optionId: 'preserve', sceneId: 'obs_final_choice', eventIndex: 3
    };
    const rejectedChoice = await request('/api/runs/sync', { method: 'POST', cookie: studentCookie, body: {
      ...observatorySelection,
      runId: observatoryRun.data.run.id,
      revision: 0,
      snapshot: { ...observatorySnapshot, flags: { obs_plate_preserved: true }, storyEvents: [outOfOrderChoice] },
      events: [outOfOrderChoice]
    } });
    assert.equal(rejectedChoice.status, 409);
    assert.equal((await db.query('SELECT count(*)::int AS count FROM story_events WHERE run_id=$1', [observatoryRun.data.run.id])).rows[0].count, 0);
    const report = await request(`/api/mentor/teams/${teamId}/report`, { cookie: mentorLogin.cookie });
    assert.equal(report.status, 200);
    assert.deepEqual(report.data.students.filter((row) => row.case_id === 'vesper_case_01').map((row) => row.attempt_number).sort(), [1, 2]);
    assertNoPasswordHash(report.data);

    assert.equal((await request('/api/auth/logout', { method: 'POST', cookie: studentCookie })).status, 200);
    assert.equal((await request('/api/me', { cookie: studentCookie })).data.authenticated, false);
  } finally {
    if (teamId) await db.query('DELETE FROM teams WHERE id=$1', [teamId]);
    if (studentId) await db.query('DELETE FROM users WHERE id=$1', [studentId]);
    if (mentorId) await db.query('DELETE FROM users WHERE id=$1', [mentorId]);
    await new Promise((resolve) => server.close(resolve));
    await db.pool.end();
  }
});
