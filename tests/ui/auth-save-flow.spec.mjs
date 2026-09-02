import { test, expect } from '@playwright/test';

test('backend unavailable keeps Hub visible and blocks the case on a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByText(/ARQUIVO INDISPON/).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'INICIAR CASO' })).toBeDisabled();
  await expect(page.getByRole('button', { name: /TENTAR NOVAMENTE/ })).toBeVisible();
});

test('entry requires an account and registration requires a class code', async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/health') return route.fulfill({ json: { ok: true, database: true, mode: 'online' } });
    if (path === '/api/me') return route.fulfill({ json: { authenticated: false } });
    return route.fulfill({ status: 404, json: { error: 'mock' } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'INICIAR CASO' }).click();
  await expect(page.getByRole('heading', { name: 'Entrar no Arquivo' })).toBeVisible();
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByLabel(/turma/i)).toBeVisible();
});

test('authenticated case offers save and exit and restart', async ({ page }) => {
  let revision = 0;
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/health') return route.fulfill({ json: { ok: true, database: true, mode: 'online' } });
    if (url.pathname === '/api/me') return route.fulfill({ json: { authenticated: true, user: { id: 'student-1', username: 'aluno', role: 'student', must_change_password: false }, profile: { preferred_language: 'java', xp: 0, level: 1, field_marks: 0, relationships: {} }, teams: [] } });
    if (url.pathname === '/api/runs/current') return route.fulfill({ json: { run: null } });
    if (url.pathname === '/api/runs/start') return route.fulfill({ status: 201, json: { run: { id: 'run-1', route_id: 'arrays_beginner', language_id: 'java', revision: 0, snapshot: {} } } });
    if (url.pathname === '/api/runs/sync') return route.fulfill({ json: { runId: 'run-1', revision: ++revision, syncedAt: Date.now() } });
    return route.fulfill({ status: 404, json: { error: 'mock' } });
  });
  await page.goto('/?case=vesper_case_01&route=arrays_beginner');
  await page.getByRole('button', { name: 'INICIAR CASO' }).click();
  await page.waitForFunction(() => document.body.dataset.mode !== 'title');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: /SALVAR E SAIR/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /REINICIAR CASO/ })).toBeVisible();
});

test('continue reopens a choice from the remote cursor', async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/health') return route.fulfill({ json: { ok: true, database: true, mode: 'online' } });
    if (url.pathname === '/api/me') return route.fulfill({ json: {
      authenticated: true,
      user: { id: 'student-2', username: 'aluno', role: 'student', must_change_password: false },
      profile: { preferred_language: 'java', xp: 0, level: 1, field_marks: 0, relationships: {} }, teams: []
    } });
    if (url.pathname === '/api/runs/current') return route.fulfill({ json: { run: {
      id: 'run-choice', route_id: 'bridge_loops_arrays', language_id: 'java', revision: 2,
      snapshot: { caseId: 'vesper_case_02_observatory', routeId: 'bridge_loops_arrays', languageId: 'java', contentVersion: '1.1.0',
        player: { name: 'aluno' }, currentRoom: 'observatory_archive', flags: {}, knownCharacters: ['tomas'], visitedRooms: [],
        completedInteractions: [], completedChallenges: [], clues: [], inventory: [], presence: 0, challengeAttempts: {},
        challengeSeeds: {}, hintUsage: {}, relationships: {}, endingId: null, caseCompleted: false, startedAt: 1, updatedAt: 2,
        cursor: { mode: 'choice', sceneId: 'obs_final_choice', nextEventIndex: 3, sceneStack: [], pendingChallenge: null }
      }
    } } });
    return route.fulfill({ status: 404, json: { error: 'mock' } });
  });
  await page.goto('/?case=vesper_case_02_observatory&route=bridge_loops_arrays');
  await page.getByRole('button', { name: /RETOMAR INVESTIGA/ }).click();
  await expect(page.getByRole('heading', { name: /O que deve acontecer com/ })).toBeVisible();
});

test('restart is confirmed by the server and starts the new attempt without returning to Hub', async ({ page }) => {
  let syncRevision = 0;
  let restartBody;
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/health') return route.fulfill({ json: { ok: true, database: true, mode: 'online' } });
    if (url.pathname === '/api/me') return route.fulfill({ json: {
      authenticated: true,
      user: { id: 'student-3', username: 'aluno', role: 'student', must_change_password: false },
      profile: { preferred_language: 'java', xp: 0, level: 1, field_marks: 0, relationships: {} }, teams: []
    } });
    if (url.pathname === '/api/runs/current') return route.fulfill({ json: { run: {
      id: 'run-old', route_id: 'arrays_beginner', language_id: 'java', revision: 0,
      snapshot: { player: { name: 'aluno' }, currentRoom: 'exterior', flags: {}, cursor: { mode: 'explore', sceneId: null, nextEventIndex: 0, sceneStack: [], pendingChallenge: null } }
    } } });
    if (url.pathname === '/api/runs/sync') return route.fulfill({ json: { runId: 'run-old', revision: ++syncRevision, syncedAt: Date.now() } });
    if (url.pathname === '/api/runs/restart') {
      restartBody = JSON.parse(request.postData() || '{}');
      return route.fulfill({ status: 201, json: { run: {
        id: 'run-new', route_id: 'arrays_beginner', language_id: 'java', revision: 0,
        snapshot: { player: { name: 'aluno' }, currentRoom: 'exterior', flags: {}, cursor: { mode: 'explore', sceneId: null, nextEventIndex: 0, sceneStack: [], pendingChallenge: null } }
      } } });
    }
    return route.fulfill({ status: 404, json: { error: 'mock' } });
  });
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto('/?case=vesper_case_01&route=arrays_beginner');
  await page.getByRole('button', { name: /RETOMAR INVESTIGA/ }).click();
  await page.waitForFunction(() => document.body.dataset.mode !== 'title');
  await expect(page.getByRole('button', { name: 'Minha conta' })).toBeVisible();
  await expect(page.locator('.top-account-profile')).toContainText('aluno');
  await expect(page.getByRole('button', { name: 'Sair' })).not.toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /REINICIAR CASO/ }).click();
  await expect.poll(() => restartBody?.newSnapshot?.cursor?.mode).toBe('explore');
  await expect(page.locator('.dialogue-box')).toBeVisible();
  await expect(page.getByRole('button', { name: /RETOMAR INVESTIGA/ })).not.toBeVisible();
});

test('account profile is separate from logout and exposes safe account actions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/health') return route.fulfill({ json: { ok: true, database: true, mode: 'online' } });
    if (url.pathname === '/api/me') return route.fulfill({ json: {
      authenticated: true,
      user: { id: 'student-account', username: 'investigador', role: 'student', must_change_password: false },
      profile: { preferred_language: 'java', xp: 12, level: 2, field_marks: 1, relationships: {} }, teams: []
    } });
    if (url.pathname === '/api/runs/current') return route.fulfill({ json: { run: null } });
    if (url.pathname === '/api/account/username') return route.fulfill({ status: 409, json: { error: 'Usuário já está em uso' } });
    return route.fulfill({ status: 404, json: { error: 'mock' } });
  });

  await page.goto('/?case=vesper_case_01&route=arrays_beginner');
  await expect(page.getByRole('button', { name: /MINHA CONTA/i })).toBeVisible();
  await page.getByRole('button', { name: /MINHA CONTA/i }).click();
  await expect(page.getByRole('heading', { name: 'Minha conta' })).toBeVisible();
  await expect(page.getByRole('button', { name: /SAIR DO ARQUIVO/ })).toBeVisible();
  await expect(page.locator('.account-summary').getByText('investigador', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'ALTERAR USUÁRIO' }).click();
  await page.getByLabel('Novo usuário').fill('outro-investigador');
  await page.getByRole('textbox', { name: 'Senha atual', exact: true }).fill('senha-atual-123');
  await page.getByRole('textbox', { name: 'Confirme a senha atual', exact: true }).fill('senha-diferente');
  await page.getByRole('button', { name: 'ATUALIZAR USUÁRIO' }).click();
  await expect(page.getByText('Confirmação da senha atual não confere')).toBeVisible();

  await page.getByRole('textbox', { name: 'Confirme a senha atual', exact: true }).fill('senha-atual-123');
  await page.getByRole('button', { name: 'ATUALIZAR USUÁRIO' }).click();
  await expect(page.getByText('Usuário já está em uso')).toBeVisible();

  await page.getByRole('button', { name: /VOLTAR À CONTA/ }).click();
  await page.getByRole('button', { name: 'ALTERAR SENHA' }).click();
  await expect(page.getByLabel('Senha atual')).toBeVisible();
  const passwordInput = page.getByRole('textbox', { name: 'Senha atual', exact: true });
  await page.getByRole('button', { name: 'Mostrar senha' }).first().click();
  await expect(passwordInput).toHaveAttribute('type', 'text');
  await expect(page.getByRole('button', { name: 'Esconder senha' }).first()).toBeVisible();
});

test('registration confirms the password before sending credentials', async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/health') return route.fulfill({ json: { ok: true, database: true, mode: 'online' } });
    if (url.pathname === '/api/me') return route.fulfill({ json: { authenticated: false } });
    return route.fulfill({ status: 404, json: { error: 'mock' } });
  });

  await page.goto('/?case=vesper_case_01&route=arrays_beginner');
  await page.getByRole('button', { name: 'ENTRAR' }).click();
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.getByLabel('Usuário').fill('novo-investigador');
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('senha-segura-123');
  await page.getByRole('textbox', { name: 'Confirme a senha', exact: true }).fill('senha-errada-123');
  await page.getByLabel(/Código da turma/).fill('TURMA123');
  await page.getByRole('button', { name: 'CRIAR E ENTRAR' }).click();
  await expect(page.getByText('Confirmação de senha não confere')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mostrar senha' }).first()).toBeVisible();
});

test('online ending stays pending after failure and only confirms after explicit retry', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let completionAttempts = 0;
  const completionBodies = [];
  let revision = 2;
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/health') return route.fulfill({ json: { ok: true, database: true, mode: 'online' } });
    if (url.pathname === '/api/me') return route.fulfill({ json: {
      authenticated: true,
      user: { id: 'student-ending', username: 'aluno', role: 'student', must_change_password: false },
      profile: { preferred_language: 'java', xp: 0, level: 1, field_marks: 0, relationships: {} }, teams: []
    } });
    if (url.pathname === '/api/runs/current') return route.fulfill({ json: { run: {
      id: 'run-ending', route_id: 'arrays_beginner', language_id: 'java', content_version: '1.0.0', revision,
      snapshot: {
        snapshotVersion: 1, caseId: 'vesper_case_01', routeId: 'arrays_beginner', languageId: 'java', contentVersion: '1.0.0',
        player: { name: 'aluno' }, currentRoom: 'basement', flags: {}, knownCharacters: ['tomas'], visitedRooms: [],
        completedInteractions: [], completedChallenges: [], clues: [], inventory: [], presence: 0, challengeAttempts: {},
        challengeSeeds: {}, hintUsage: {}, relationships: {}, endingId: null, caseCompleted: false, startedAt: 1, updatedAt: 2,
        storyEvents: [], cursor: { mode: 'ending', sceneId: 'ending_card', nextEventIndex: 0, sceneStack: [], pendingChallenge: null }
      }
    } } });
    if (url.pathname === '/api/runs/sync') {
      revision += 1;
      return route.fulfill({ json: { runId: 'run-ending', revision, syncedAt: Date.now() } });
    }
    if (url.pathname === '/api/runs/complete') {
      completionAttempts += 1;
      const body = JSON.parse(request.postData() || '{}');
      completionBodies.push(body);
      if (completionAttempts === 1) return route.fulfill({ status: 503, json: { error: 'PostgreSQL indisponível' } });
      revision += 1;
      return route.fulfill({ json: {
        runId: 'run-ending', completed: true,
        run: {
          id: 'run-ending', status: 'completed', route_id: 'arrays_beginner', language_id: 'java', revision,
          snapshot: { ...body.snapshot, caseCompleted: true, endingId: 'completed' }
        },
        profile: { xp: 100, level: 1, field_marks: 10 }
      } });
    }
    return route.fulfill({ status: 404, json: { error: 'mock' } });
  });

  await page.goto('/?case=vesper_case_01&route=arrays_beginner');
  await page.getByRole('button', { name: /RETOMAR INVESTIGA/ }).click();
  await expect(page.getByRole('heading', { name: 'O Arquivo não confirmou o final' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'CASO 01 ENCERRADO' })).not.toBeVisible();
  await page.getByRole('button', { name: 'CONFIRMAR NOVAMENTE' }).click();
  await expect(page.getByRole('heading', { name: 'CASO 01 ENCERRADO' })).toBeVisible();
  expect(completionAttempts).toBe(2);
  expect(completionBodies[1]).toMatchObject({
    runId: 'run-ending', caseId: 'vesper_case_01', routeId: 'arrays_beginner', languageId: 'java', contentVersion: '1.0.0', revision: 3, endingId: 'completed'
  });
});
