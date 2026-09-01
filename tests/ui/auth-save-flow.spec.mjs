import { test, expect } from '@playwright/test';

test('backend indisponível mantém Hub visível e bloqueia o caso em viewport estreito', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByText('ARQUIVO INDISPONÍVEL').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'INICIAR CASO' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'TENTAR NOVAMENTE' })).toBeVisible();
});

test('entrada exige conta e cadastro exige código de turma', async ({ page }) => {
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
  await expect(page.getByLabel('Código da turma')).toBeVisible();
});

test('caso autenticado oferece salvar e sair e reiniciar', async ({ page }) => {
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
  await expect(page.getByRole('button', { name: 'SALVAR E SAIR PARA O ARQUIVO' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'REINICIAR CASO' })).toBeVisible();
});
