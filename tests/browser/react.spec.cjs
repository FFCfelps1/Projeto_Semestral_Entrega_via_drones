const { test, expect } = require('@playwright/test');
const { criarFixture } = require('../relatorios-fixture.cjs');
let fixture;

test.beforeAll(async ({ baseURL }) => { fixture = await criarFixture(baseURL); });
test.afterAll(() => fixture?.cleanup());

test('React: login, pedido real, confirmacao, historico, cancelamento e tema', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(fixture.email);
  await page.getByLabel('Senha', { exact: true }).fill(fixture.senha);
  const login = page.waitForResponse(response => response.url().endsWith('/auth/login'));
  await page.locator('form').getByRole('button', { name: 'Entrar', exact: true }).click();
  expect((await login).status()).toBe(200);
  await expect(page.getByRole('button', { name: 'Sair', exact: true })).toBeVisible();
  await page.goto('/conta');
  await expect(page.getByRole('heading', { name: 'Minha conta', exact: true })).toBeVisible();
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue(fixture.email);

  await page.goto('/pedido');
  await page.locator('#pedido-item').fill(`Demonstracao ${fixture.id}`);
  await page.locator('#pedido-peso').fill('2');
  await page.locator('#pedido-origem').fill('Instituto Maua');
  await page.locator('#pedido-destino').fill('Avenida Paulista');
  await page.locator('#pedido-tipo-entrega').selectOption('prioritaria');
  const created = page.waitForResponse(response => response.url().endsWith('/pedidos') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Criar pedido', exact: true }).click();
  const response = await created;
  expect(response.status()).toBe(201);
  const order = await response.json();
  fixture.orders.push(order);
  expect(Number(order.precoEstimado)).toBe(33);
  await expect(page.getByText(`Pedido ${order.id} criado com sucesso!`)).toBeVisible();
  const confirmed = page.waitForResponse(response => response.url().endsWith(`/pedidos/${order.id}/confirmar`));
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  expect((await (await confirmed).json()).status).toBe('confirmado');
  await page.getByRole('button', { name: 'Ver historico', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Histórico do pedido' })).toBeVisible();
  await expect(page.locator('.list-group').getByText('confirmado', { exact: true })).toBeVisible();
  const cancelled = page.waitForResponse(response => response.url().endsWith(`/pedidos/${order.id}`) && response.request().method() === 'DELETE');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  expect((await (await cancelled).json()).pedido.status).toBe('cancelado');
  await expect(page.getByRole('button', { name: 'Cancelar', exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('cancelado', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Trocar para modo escuro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');
  await page.screenshot({ path: '.kubernetes-local/react-pedidos.png', fullPage: true });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await page.goto('/conta');
  await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('React: paginas publicas renderizam no celular sem erros JavaScript', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const route of ['/', '/pedido', '/precos', '/rastreamento', '/suporte', '/notificacoes', '/login']) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#root')).toContainText(/\S{5}/);
    await expect(page.getByRole('heading').first()).toBeVisible();
  }
  await page.screenshot({ path: '.kubernetes-local/react-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});
