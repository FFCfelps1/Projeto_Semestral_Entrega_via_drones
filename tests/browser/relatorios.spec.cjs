const {test,expect}=require('@playwright/test');
const fs=require('node:fs/promises');
const path=require('node:path');
const {criarFixture}=require('../relatorios-fixture.cjs');
let fixture;
test.beforeAll(async({baseURL})=>{fixture=await criarFixture(baseURL);});
test.afterAll(()=>fixture?.cleanup());
async function entrar(page) {
  await page.goto('/relatorios/');
  // Compatível também com builds Flutter que ativam semântica sob demanda.
  const ativar=page.getByRole('button',{name:'Enable accessibility'});
  await expect.poll(async()=>await ativar.count()+await page.getByRole('textbox',{name:/E-mail/}).count()).toBeGreaterThan(0);
  if(await ativar.count()) await ativar.dispatchEvent('click');
  const email=page.getByRole('textbox',{name:/E-mail/});
  await email.click();
  // O foco Flutter conecta a entrada nativa no frame seguinte ao clique.
  await page.waitForTimeout(100);
  await page.keyboard.type(fixture.email,{delay:40});
  // Entrada de teclado reproduz o comportamento real de um campo protegido Flutter.
  await page.getByRole('textbox',{name:/Senha/}).click();
  await page.waitForTimeout(100);
  await page.keyboard.type(fixture.senha,{delay:40});
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
  // Desde a 1.3.0-mobile o login abre Pedidos; Relatórios é uma das áreas da navegação.
  await expect(page.getByRole('heading',{name:/^Olá,/})).toBeVisible();
  const resumoCarregado=page.waitForResponse(r=>r.url().includes('/relatorios/resumo'));
  const aba=page.getByRole('tab',{name:/^Relatórios/}).or(page.getByRole('button',{name:/^Relatórios/}));
  await aba.first().click();
  await expect(page.getByRole('heading',{name:'Relatórios de Entregas',exact:true})).toBeVisible();
  expect((await resumoCarregado).status()).toBe(200);
}
test('login real, filtros explícitos e CSV baixado pelo navegador',async({page})=>{
  await page.setViewportSize({width:1440,height:1100});
  const erros=[];page.on('pageerror',e=>erros.push(e.message));
  let consultas=0;page.on('request',r=>{if(r.url().includes('/relatorios/resumo'))consultas++;});
  await entrar(page);
  const antes=consultas;
  await page.getByRole('button',{name:'Status Todos os status',exact:true}).click();
  await page.getByRole('menuitem',{name:'Entregue',exact:true}).click();
  await expect(page.getByRole('button',{name:'Status Entregue',exact:true})).toBeVisible();
  expect(consultas).toBe(antes);
  const resposta=page.waitForResponse(r=>r.url().includes('/relatorios/resumo')&&new URL(r.url()).searchParams.get('status')==='entregue');
  await page.getByRole('button',{name:'Aplicar filtros',exact:true}).click();
  const resumo=await(await resposta).json();
  expect(resumo.totalPedidos).toBeGreaterThanOrEqual(1);
  await expect(page.getByRole('button',{name:'Exportar CSV',exact:true})).toBeEnabled();
  const baixar=page.waitForEvent('download');
  await page.getByRole('button',{name:'Exportar CSV',exact:true}).click();
  const download=await baixar;
  expect(download.suggestedFilename()).toMatch(/^skyswift-pedidos-\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2}\.csv$/);
  const arquivo=path.resolve('.kubernetes-local',download.suggestedFilename());
  await download.saveAs(arquivo);
  const bytes=await fs.readFile(arquivo);expect([...bytes.subarray(0,3)]).toEqual([239,187,191]);
  const csv=bytes.toString('utf8');
  expect(csv).toContain(fixture.orders[0].id);
  expect(csv).not.toContain(fixture.orders[1].id);
  expect(csv).toContain('Medicamentos; ""frágeis""\nBloco B');
  await expect(page.getByRole('button',{name:'Exportar CSV',exact:true})).toBeEnabled();
  await page.screenshot({path:'.kubernetes-local/relatorios-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'Alternar para modo escuro',exact:true}).click();
  await expect(page.getByRole('button',{name:/Alternar para modo claro/})).toBeVisible();
  await page.waitForTimeout(250);
  await page.screenshot({path:'.kubernetes-local/relatorios-escuro.png',fullPage:true});
  await page.getByRole('button',{name:'Sair',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Entre na sua conta'})).toBeVisible();
  expect(erros).toEqual([]);
});
test('tela pequena, período vazio, sessão em memória e cadastro no app',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const erros=[];page.on('pageerror',e=>erros.push(e.message));
  await entrar(page);
  for(const [nome,valor] of [['Data inicial','01/01/2000'],['Data final','02/01/2000']]) {
    const campo=page.getByRole('textbox',{name:nome,exact:true});
    await campo.click();await page.waitForTimeout(100);await campo.press('ControlOrMeta+A');
    await page.waitForTimeout(100);await page.keyboard.type(valor,{delay:40});
  }
  await page.getByRole('button',{name:'Aplicar filtros',exact:true}).click();
  await expect(page.getByText(/Nenhum pedido neste período/).last()).toBeAttached();
  await page.screenshot({path:'.kubernetes-local/relatorios-mobile.png',fullPage:true});
  await page.reload();
  const ativar=page.getByRole('button',{name:'Enable accessibility'});
  await expect.poll(async()=>await ativar.count()+await page.getByRole('textbox',{name:/E-mail/}).count()).toBeGreaterThan(0);
  if(await ativar.count()) await ativar.dispatchEvent('click');
  await expect(page.getByRole('heading',{name:'Entre na sua conta'})).toBeVisible();
  await page.getByRole('button',{name:'Criar conta',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Crie sua conta SkySwift'})).toBeVisible();
  expect(erros).toEqual([]);
});
