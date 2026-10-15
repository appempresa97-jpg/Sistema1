// Uso: node testes/teste_ui.js   (requer: npm i jsdom exceljs)
const fs = require('fs'), path = require('path'), assert = require('assert'), { JSDOM } = require('jsdom');
const root = path.join(__dirname, '..');
(async () => {
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/<script[^>]*><\/script>/g, ''), { runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window; w.ExcelJS = require('exceljs'); w.confirm = () => true; w.URL.createObjectURL = () => 'blob:x'; w.URL.revokeObjectURL = () => { };
  let baixados = 0; w.HTMLAnchorElement.prototype.click = function () { if (this.download) baixados++; };
  w.eval(fs.readFileSync(path.join(root, 'js/core.js'), 'utf8')); w.eval(fs.readFileSync(path.join(root, 'js/app.js'), 'utf8'));
  const { S, A, render, carregar } = w.__app, $ = s => w.document.querySelector(s), tick = () => new Promise(r => setTimeout(r, 30));
  let ok = 0; const t = async (n, f) => { try { await f(); ok++; console.log('  ✔', n); } catch (e) { console.log('  ✘', n, '\n    ', e.stack.split('\n').slice(0, 3).join('\n')); process.exitCode = 1; } };
  const click = (a, v) => { const b = w.document.createElement('b'); b.dataset.a = a; if (v != null) b.dataset.v = v; w.document.body.appendChild(b); b.click(); b.remove(); };
  const set = (sel, v) => { $(sel).value = v; };
  await t('Tela inicial com 3 passos', () => { assert(/Baixe o modelo/.test($('#main').textContent)); assert(/Nenhum Excel aberto/.test($('#sb').textContent)); });
  await carregar(fs.readFileSync(path.join(root, 'modelo/Banco_Dados_Exames_RH.xlsx')), 'Banco.xlsx', null, 0); await tick();
  await t('Importação abre o painel com indicadores', () => { const x = $('#main').textContent; assert(/Colaboradores ativos/.test(x) && /Conformidade/.test(x)); assert(/nenhuma alteração pendente/i.test($('#sb').textContent)); });
  await t('Todas as telas renderizam sem erro', () => { for (const v of ['painel', 'colaboradores', 'exames', 'agendamentos', 'asos', 'comunicacoes', 'mmc', 'arquivo', 'ajuda']) { click('nav', v); assert($('#main').innerHTML.length > 200, v); } });
  await t('Ficha do colaborador abre com histórico', () => { click('ficha', '1002'); const x = $('#modal').textContent; assert(/Bruno Henrique/.test(x) && /Reagendado/.test(x) && /Gerar e-mail/.test(x)); click('fechar'); });
  await t('Reagendar pela interface preserva o anterior e acende o aviso', () => {
    click('fNovo', 'agendamentos|1002'); set('[name=f_data]', '2026-11-20'); set('[name=f_horario]', '09:15'); set('[name=f_clinica]', S.data.clinicas[0].nome); click('salvarForm');
    const l = S.data.agendamentos.filter(a => a.matricula === '1002'); assert.strictEqual(l.filter(a => a.status === 'Agendado').length, 1); assert.strictEqual(l.find(a => a.id_agend === 'AG-0002').status, 'Reagendado');
    assert(S.dirty && /NÃO salvas/.test($('#sb').textContent));
  });
  await t('Novo colaborador + exame + ASO pela interface', () => {
    click('novo', 'colaboradores'); set('[name=f_matricula]', '9100'); set('[name=f_nome]', 'Pessoa Teste'); click('salvarForm'); assert(S.data.colaboradores.some(c => c.matricula === '9100'));
    click('fNovo', 'exames|9100'); set('[name=f_exame]', 'Exame Clínico'); set('[name=f_data_vencimento]', '2027-01-10'); click('salvarForm');
    click('fNovo', 'asos|9100'); set('[name=f_situacao]', 'Apto'); click('salvarForm'); assert(S.data.exames.some(e => e.matricula === '9100') && S.data.asos.some(e => e.matricula === '9100'));
    click('novo', 'colaboradores'); set('[name=f_matricula]', '9100'); set('[name=f_nome]', 'Dup'); click('salvarForm'); assert.strictEqual(S.data.colaboradores.filter(c => c.matricula === '9100').length, 1);
  });
  await t('Comunicação: gerar (Preparado) → abrir (Aberto) → confirmar (Confirmado)', () => {
    const n0 = S.data.comunicacoes.length; click('novaCom', '1002'); set('#n_m', S.data.modelos[3].id_modelo); click('gerarCom');
    const o = S.data.comunicacoes[n0]; assert.strictEqual(o.status, 'Preparado'); assert(o.mensagem.includes('Bruno') && !/\{\{/.test(o.mensagem));
    set('#c_m', o.mensagem + '\nTexto editado.'); click('cMail'); assert.strictEqual(o.status, 'Aberto no aplicativo'); assert(o.mensagem.includes('Texto editado.') && !o.enviado_em);
    click('cConfirmar'); assert.strictEqual(o.status, 'Envio confirmado pelo RH'); assert(o.enviado_em && o.preparado_em && o.destinatario && o.modelo);
  });
  await t('Salvar (sem File System Access) exporta e limpa o aviso com texto honesto', async () => { await A.salvar(); assert.strictEqual(baixados, 1); assert(!S.dirty); assert(/baixado/.test($('#sb').textContent)); });
  await t('Reabrir o Excel exportado mantém tudo (histórico, comunicação, agendamentos)', async () => {
    const NC = require('../js/core.js'), buf = await NC.toBuffer(JSON.parse(JSON.stringify(S.data))), r = await NC.fromBuffer(buf); // Core do Node: no jsdom 'Date' é de outro contexto que o ExcelJS não reconhece (só ocorre no teste) assert.strictEqual(r.rep.erros.length, 0);
    assert(r.data.colaboradores.some(c => c.matricula === '9100')); assert(r.data.agendamentos.filter(a => a.matricula === '1002').length === 3 && r.data.agendamentos.filter(a => a.status === 'Reagendado').length === 2);
    assert(r.data.comunicacoes.some(c => c.status === 'Envio confirmado pelo RH')); assert(r.data.log.length > 8);
  });
  await t('Comparação MMC pela interface', async () => {
    const ExcelJS = require('exceljs'), wb = new ExcelJS.Workbook(), ws = wb.addWorksheet('MMC'); ws.addRow(['Nome', 'Exame', 'Último Pedido', 'Data do Resultado', 'Periodicidade', 'Refazer em', 'Status']);
    ws.addRow(['Camila Ferreira Alves', 'Exame Clínico', '01/10/2026', '02/10/2026', '12 meses', '02/10/2027', 'Em dia']); ws.addRow(['Alguém Desconhecido', 'Exame Clínico', '', '', '', '01/01/2027', '']);
    const f = { name: 'mmc.xlsx', arrayBuffer: async () => await wb.xlsx.writeBuffer() }; click('nav', 'mmc');
    const r = await w.Core.readMMC(await f.arrayBuffer()); S.mmc = { ...w.Core.compare(S.data, r.rows), tipo: 'Periódico', arquivo: 'mmc.xlsx' }; S.mmc.sel = new Set(S.mmc.items.filter(i => i.kind === 'diferente').map(i => i.id)); w.__app.render();
    assert(/Dados diferentes/.test($('#main').textContent) && /Não localizado/.test($('#main').textContent));
    await A.mmcAplicar(); assert.strictEqual(S.data.exames.find(e => e.matricula === '1003' && e.tipo_exame === 'Periódico').data_vencimento, '2027-10-02'); assert(S.dirty);
  });
  console.log(`\n${ok} testes de tela passaram`);
})();
