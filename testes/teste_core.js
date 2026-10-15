// Uso: node testes/teste_core.js
const fs = require('fs'), path = require('path'), assert = require('assert'), ExcelJS = require('exceljs'), Core = require('../js/core.js');
let ok = 0; const t = (n, f) => Promise.resolve().then(f).then(() => { ok++; console.log('  ✔', n); }, e => { console.log('  ✘', n, '\n    ', e.message); process.exitCode = 1; });
const modelo = fs.readFileSync(path.join(__dirname, '..', 'modelo', 'Banco_Dados_Exames_RH.xlsx'));
(async () => {
  let { data, rep } = await Core.fromBuffer(modelo);
  await t('Importação inicial sem erros', () => { assert.deepStrictEqual(rep.erros, []); assert.strictEqual(data.colaboradores.length, 15); assert.strictEqual(data.modelos.length, 12); });
  await t('Validações de dados existem no arquivo gerado', async () => {
    const wb = new ExcelJS.Workbook(); await wb.xlsx.load(modelo);
    const n = Object.keys(wb.getWorksheet('Exames').dataValidations.model).length; assert(n >= 5, 'validações Exames: ' + n);
    assert(Object.keys(wb.getWorksheet('Agendamentos').dataValidations.model).length >= 5);
  });
  await t('Status dos exames (vencido / próximo / em dia / sem informação)', () => {
    const h = '2026-10-15', g = m => Core.statusColab(data, data.colaboradores.find(c => c.matricula === m), h, 30).status;
    assert.strictEqual(g('1003'), 'Vencido'); assert.strictEqual(g('1002'), 'Próximo do vencimento'); assert.strictEqual(g('1001'), 'Em dia');
    assert.strictEqual(g('1010'), 'Sem informação'); assert.strictEqual(g('2004'), 'Sem informação'); assert.strictEqual(g('1008'), 'Vencido');
  });
  const antes = JSON.parse(JSON.stringify(data));
  // operações de sistema: cadastro, exame, reagendamento, comunicação preparada -> enviada
  data.colaboradores.push({ matricula: '9001', nome: 'Teste Novo', situacao: 'Ativo', departamento: 'TI', email_corp: '', email_pessoal: '', telefone: '', empresa: '', filial: '', unidade: '', cargo: '', gestor: '', data_admissao: '2026-10-01', data_desligamento: '', obs: 'ç ã é' });
  Core.log(data, 'RH', 'colaboradores', '9001', 'Criado');
  const ag = data.agendamentos.find(a => a.id_agend === 'AG-0002'); ag.status = 'Reagendado';
  data.agendamentos.push({ id_agend: Core.nextId(data, 'agendamentos'), matricula: '1002', tipo_exame: 'Periódico', data: '2026-11-03', horario: '11:00', clinica: data.clinicas[0].nome, guia_recebida: 'Não', status: 'Agendado', reagendado_de: 'AG-0002', obs: '' });
  const cx = Core.ctx(data, '1002', '2026-10-15'), m = data.modelos[3];
  data.comunicacoes.push({ id_com: Core.nextId(data, 'comunicacoes'), matricula: '1002', modelo: m.nome, canal: 'E-mail', destinatario: Core.fill(m.destinatario, cx), copia: '', assunto: Core.fill(m.assunto, cx), mensagem: Core.fill(m.mensagem, cx), status: 'Preparado', preparado_em: Core.nowStr(), enviado_em: '', responsavel: 'RH' });
  await t('Mensagem preenchida com dados dinâmicos', () => { const c = data.comunicacoes[0]; assert(c.mensagem.includes('Bruno Henrique Lima') && c.mensagem.includes('03/11/2026') && c.mensagem.includes('11:00')); assert(!/\{\{/.test(c.mensagem)); assert.strictEqual(c.destinatario, 'bruno.1002@empresa-ficticia.com.br'); });
  let buf = await Core.toBuffer(data); let r2 = await Core.fromBuffer(buf);
  await t('Salvar → reabrir preserva tudo (nada perdido)', () => {
    assert.deepStrictEqual(r2.rep.erros, []);
    for (const k of Object.keys(antes)) { if (k === 'log') continue; antes[k].forEach(row => { const nr = r2.data[k].find(x => JSON.stringify(Object.entries(row).map(e => e[1])) === JSON.stringify(Object.entries(x).map(e => e[1])) || (Core.T[k].key && x[Core.T[k].key] === row[Core.T[k].key])); assert(nr, 'linha perdida em ' + k); }); }
    assert.strictEqual(r2.data.colaboradores.length, 16); assert.strictEqual(r2.data.colaboradores.find(c => c.matricula === '9001').obs, 'ç ã é');
    assert.strictEqual(r2.data.log.length, antes.log.length + 1);
  });
  await t('Reagendamento mantém histórico do agendamento anterior', () => { const l = r2.data.agendamentos.filter(a => a.matricula === '1002'); assert.strictEqual(l.length, 3); assert.deepStrictEqual(l.map(a => a.status), ['Reagendado', 'Reagendado', 'Agendado']); });
  await t('Comunicação: preparada → confirmada, mantém data/destinatário/modelo', async () => {
    const c = r2.data.comunicacoes[0]; assert.strictEqual(c.status, 'Preparado'); c.status = 'Envio confirmado pelo RH'; c.enviado_em = Core.nowStr();
    const r3 = await Core.fromBuffer(await Core.toBuffer(r2.data)); const d = r3.data.comunicacoes[0];
    assert.strictEqual(d.status, 'Envio confirmado pelo RH'); assert(d.enviado_em && d.preparado_em && d.destinatario && d.modelo);
  });
  await t('Validações continuam no arquivo depois de salvar pelo sistema', async () => { const wb = new ExcelJS.Workbook(); await wb.xlsx.load(buf); assert(Object.keys(wb.getWorksheet('Exames').dataValidations.model).length >= 5); });
  await t('Backup/restauração: ida e volta idêntica', async () => { const b = await Core.toBuffer(r2.data); const r = await Core.fromBuffer(b); assert.deepStrictEqual(r.data, r2.data); });
  await t('Matrícula duplicada e campos obrigatórios são reportados', async () => {
    const d = JSON.parse(JSON.stringify(data)); d.colaboradores.push({ ...d.colaboradores[0] }, { ...d.colaboradores[1], matricula: '7777', nome: '' });
    const b = await Core.toBuffer(d); const r = await Core.fromBuffer(b); assert(r.rep.erros.some(e => /duplicado/.test(e)) && r.rep.erros.some(e => /preencha/.test(e)));
  });
  // MMC
  const wbm = new ExcelJS.Workbook(), ws = wbm.addWorksheet('In Company');
  ws.addRow(['Empresa', 'Unidade', 'Setor', 'Cargo', 'Nome', 'Exame', 'Último Pedido', 'Data do Resultado', 'Periodicidade', 'Data de Admissão', 'Refazer em', 'Status', 'Filial']);
  ws.addRow(['X', 'Sorocaba', 'Op', 'Analista', 'ANA BEATRIZ SOUZA', 'Exame Clínico', new Date(Date.UTC(2026, 5, 1)), new Date(Date.UTC(2026, 5, 3)), '12 meses', null, new Date(Date.UTC(2027, 5, 3)), 'Em dia', '01']);  // diferente
  ws.addRow(['X', 'Sorocaba', 'Op', 'Analista', 'Ana Beatriz Souza', 'Audiometria', '01/06/2026', '03/06/2026', '6 meses', null, '03/12/2026', 'Em dia', '01']);  // novo
  ws.addRow(['X', 'Sorocaba', 'Op', 'Analista', 'Fulano Inexistente', 'Exame Clínico', null, null, '12 meses', null, '01/01/2027', 'Em dia', '01']);  // sem colab
  ws.addRow(['X', 'Sorocaba', 'Op', 'Tec', 'Bruno Henrique Lima', 'Exame Clínico', null, null, null, null, '', '', '01']);  // igual / sem dados
  const mmcBuf = await wbm.xlsx.writeBuffer();
  const { rows } = await Core.readMMC(mmcBuf); const cmp = Core.compare(r2.data, rows);
  await t('MMC: classifica diferente / novo / não localizado / igual', () => { const k = cmp.items.map(i => i.kind); assert.deepStrictEqual(k, ['diferente', 'novo', 'sem_colab', 'igual']); assert(cmp.sem.length >= 10); assert.strictEqual(cmp.items[0].ch.find(c => c.k === 'data_vencimento').mmc, '2027-06-03'); });
  await t('MMC: aplicar só o selecionado, registrar divergências e log, sem apagar nada', () => {
    const d = r2.data, n0 = d.exames.length, logs0 = d.log.length, sel = new Set([cmp.items[0].id]);
    const n = Core.applyMMC(d, cmp.items, sel, { usuario: 'RH', tipo: 'Complementar', arquivo: 'mmc.xlsx' });
    assert.strictEqual(n.diferente, 1); assert.strictEqual(n.novo, 0); assert.strictEqual(d.exames.length, n0);
    assert.strictEqual(d.exames.find(e => e.id_exame === cmp.items[0].exameId).data_vencimento, '2027-06-03');
    assert(d.log.length > logs0); assert(d.divergencias.some(x => x.decisao === 'Aplicado') && d.divergencias.some(x => x.decisao === 'Ignorado'));
    const n2 = Core.applyMMC(d, cmp.items, new Set([cmp.items[1].id]), { usuario: 'RH', tipo: 'Complementar' }); assert.strictEqual(n2.novo, 1); assert.strictEqual(d.exames.length, n0 + 1);
    assert.strictEqual(d.exames[d.exames.length - 1].tipo_exame, 'Complementar');
  });
  await t('Estrutura_Banco_Dados.md gerado', () => assert(Core.docMd().includes('## Colaboradores')));
  console.log(`\n${ok} testes passaram`);
})();
