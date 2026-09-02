import { test, expect } from '@playwright/test';

const mentorAccount = {
  authenticated: true,
  user: { id: 'mentor-1', username: 'professora.livia', role: 'mentor', must_change_password: false },
  profile: { display_name: 'professora.livia' },
  teams: [{ id: 'team-1', name: 'consultores', code: '74A17A2B', member_role: 'mentor' }]
};

const studentReport = {
  teamId: 'team-1',
  students: [{
    user_id: 'student-1',
    username: 'samira.santos',
    display_name: 'samira.santos',
    xp: 25,
    level: 1,
    field_marks: 2,
    case_id: null,
    route_id: null,
    language_id: null,
    status: null,
    attempt_number: 1,
    attempts: 0,
    correct_attempts: 0,
    optional_clues: 0,
    duration_seconds: null
  }]
};

test('mentor reset is an explicit confirmed flow with useful success feedback', async ({ page }) => {
  let resetPayload;
  page.on('dialog', () => { throw new Error('Password reset must not use a native dialog.'); });
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/me') return route.fulfill({ json: mentorAccount });
    if (url.pathname === '/api/mentor/teams/team-1/report') return route.fulfill({ json: studentReport });
    if (url.pathname === '/api/mentor/teams/team-1/students/student-1/reset-password') {
      resetPayload = JSON.parse(request.postData() || '{}');
      return route.fulfill({ json: { temporaryPassword: resetPayload.temporaryPassword } });
    }
    return route.fulfill({ status: 404, json: { error: 'mock' } });
  });

  await page.goto('/mentor.html');
  await expect(page.getByRole('heading', { name: 'consultores' })).toBeVisible();
  await expect(page.getByText('Samira Santos', { exact: true })).toBeVisible();
  await expect(page.getByText('@samira.santos', { exact: true })).toBeVisible();
  if (process.env.VESPER_CAPTURE_UI) await page.screenshot({ path: 'test-results/mentor-desktop.png', fullPage: true });

  await page.getByRole('button', { name: 'REDEFINIR SENHA' }).click();
  await expect(page.getByRole('heading', { name: 'Redefinir acesso' })).toBeVisible();
  if (process.env.VESPER_CAPTURE_UI) await page.screenshot({ path: 'test-results/mentor-reset-modal.png', fullPage: true });
  await page.getByLabel('Senha temporária', { exact: true }).fill('Temporaria-2026');
  await page.getByLabel('Confirme a senha temporária', { exact: true }).fill('outra-senha');
  await page.getByRole('button', { name: 'REDEFINIR ACESSO' }).click();
  await expect(page.getByText('As senhas não conferem.')).toBeVisible();

  await page.getByLabel('Confirme a senha temporária', { exact: true }).fill('Temporaria-2026');
  await page.getByRole('button', { name: 'REDEFINIR ACESSO' }).click();
  await expect(page.getByRole('heading', { name: 'Senha temporária definida' })).toBeVisible();
  if (process.env.VESPER_CAPTURE_UI) {
    await page.waitForTimeout(250);
    await page.screenshot({ path: 'test-results/mentor-reset-success.png', fullPage: true });
  }
  await expect(page.getByText(/sessões anteriores foram encerradas/)).toBeVisible();
  await expect(page.getByText(/o Vesper solicitará uma nova senha/)).toBeVisible();
  expect(resetPayload).toEqual({ temporaryPassword: 'Temporaria-2026', confirmPassword: 'Temporaria-2026' });
});

test('mentor workspace remains contained on a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/me') return route.fulfill({ json: mentorAccount });
    if (url.pathname === '/api/mentor/teams/team-1/report') return route.fulfill({ json: studentReport });
    return route.fulfill({ status: 404, json: { error: 'mock' } });
  });

  await page.goto('/mentor.html');
  await expect(page.getByText('Samira Santos', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  if (process.env.VESPER_CAPTURE_UI) await page.screenshot({ path: 'test-results/mentor-mobile.png', fullPage: true });
});
