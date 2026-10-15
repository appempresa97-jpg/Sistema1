/* Núcleo de dados — roda no navegador e no Node (testes). Sem dependências externas além do ExcelJS. */
(function (root, f) {
  if (typeof module === 'object' && module.exports) module.exports = f(require('exceljs'));
  else root.Core = f(root.ExcelJS);
})(typeof self !== 'undefined' ? self : this, function (ExcelJS) {
  'use strict';
  const c = (k, h, t, o, r, w) => ({ k, h, t: t || 't', o, r, w });
  const LST = {
    tipo: ['Admissional', 'Periódico', 'Retorno ao trabalho', 'Mudança de função', 'Demissional', 'Complementar'],
    sit: ['Ativo', 'Admissão pendente', 'Afastado', 'Desligado'],
    fonte: ['MMC', 'RH', 'ASO'],
    ag: ['Agendado', 'Realizado', 'Faltou', 'Reagendado', 'Cancelado'],
    sn: ['Sim', 'Não'],
    aso: ['Apto', 'Inapto', 'Apto com restrição'],
    com: ['Preparado', 'Aberto no aplicativo', 'Envio confirmado pelo RH'],
    canal: ['E-mail', 'WhatsApp'],
    camp: ['Planejada', 'Em andamento', 'Encerrada'],
    dec: ['Aplicado', 'Ignorado']
  };
  const R = (k, h) => c(k, h, 'r', null, 1, 24);
  const T = {
    colaboradores: { sheet: 'Colaboradores', key: 'matricula', desc: 'Cadastro-base (1 linha por colaborador). A matrícula é o identificador único. Não armazena CPF, RG nem PIS.', cols: [
      c('matricula', 'Matrícula', 't', 0, 1, 12), c('nome', 'Nome completo', 't', 0, 1, 34), c('email_corp', 'E-mail corporativo', 't', 0, 0, 30), c('email_pessoal', 'E-mail pessoal', 't', 0, 0, 28),
      c('telefone', 'Telefone (WhatsApp)', 't', 0, 0, 18), c('empresa', 'Empresa', 't', 0, 0, 18), c('filial', 'Filial', 't', 0, 0, 14), c('unidade', 'Unidade', 't', 0, 0, 18),
      c('departamento', 'Departamento', 't', 0, 0, 20), c('cargo', 'Cargo', 't', 0, 0, 24), c('gestor', 'Gestor', 't', 0, 0, 26), c('data_admissao', 'Data de admissão', 'd', 0, 0, 16),
      c('situacao', 'Situação', 'l', LST.sit, 1, 18), c('data_desligamento', 'Data de desligamento', 'd', 0, 0, 18), c('obs', 'Observações', 'm', 0, 0, 30)] },
    exames: { sheet: 'Exames', key: 'id_exame', pre: 'EX', desc: 'Um registro por exame do colaborador (admissional, periódico, complementar...). O vencimento vem da MMC/ASO/PCMSO — o sistema não calcula pelo cargo.', cols: [
      c('id_exame', 'ID do exame', 't', 0, 0, 12), R('matricula', 'Matrícula'), c('tipo_exame', 'Tipo de exame', 'l', LST.tipo, 0, 20), c('exame', 'Exame', 't', 0, 1, 22),
      c('ultimo_pedido', 'Último pedido', 'd', 0, 0, 14), c('data_resultado', 'Data do resultado', 'd', 0, 0, 16), c('periodicidade', 'Periodicidade (conforme PCMSO/MMC)', 't', 0, 0, 22),
      c('data_vencimento', 'Refazer em (vencimento)', 'd', 0, 0, 18), c('fonte', 'Fonte da informação', 'l', LST.fonte, 0, 14), c('status_mmc', 'Status informado pela MMC', 't', 0, 0, 20), c('obs', 'Observações', 'm', 0, 0, 30)] },
    agendamentos: { sheet: 'Agendamentos', key: 'id_agend', pre: 'AG', desc: 'Agendamentos de exames. Reagendar cria uma nova linha e marca a anterior como "Reagendado" (histórico preservado).', cols: [
      c('id_agend', 'ID do agendamento', 't', 0, 0, 14), R('matricula', 'Matrícula'), c('tipo_exame', 'Tipo de exame', 'l', LST.tipo, 0, 20), c('data', 'Data', 'd', 0, 0, 12), c('horario', 'Horário', 't', 0, 0, 10),
      c('clinica', 'Clínica', 'l', 'clinicas', 0, 28), c('guia_recebida', 'Guia recebida', 'l', LST.sn, 0, 12), c('status', 'Status', 'l', LST.ag, 1, 14), c('reagendado_de', 'Reagendado de (ID)', 't', 0, 0, 16), c('obs', 'Observações', 'm', 0, 0, 30)] },
    asos: { sheet: 'ASOs', key: 'id_aso', pre: 'ASO', desc: 'Controle documental dos ASOs. Guarda só a situação (apto/inapto) e o local do arquivo — nunca laudos ou CID.', cols: [
      c('id_aso', 'ID do ASO', 't', 0, 0, 12), R('matricula', 'Matrícula'), c('tipo_exame', 'Tipo de exame', 'l', LST.tipo, 0, 20), c('data_aso', 'Data do ASO', 'd', 0, 0, 14),
      c('situacao', 'Situação ocupacional', 'l', LST.aso, 0, 20), c('recebido_em', 'Recebido em', 'd', 0, 0, 14), c('caminho', 'Local do arquivo (pasta/link)', 't', 0, 0, 40), c('obs', 'Observações', 'm', 0, 0, 30)] },
    comunicacoes: { sheet: 'Comunicacoes', key: 'id_com', pre: 'COM', desc: 'Histórico de e-mails/WhatsApp. Status: Preparado → Aberto no aplicativo → Envio confirmado pelo RH.', cols: [
      c('id_com', 'ID', 't', 0, 0, 12), R('matricula', 'Matrícula'), c('modelo', 'Modelo', 't', 0, 0, 30), c('canal', 'Canal', 'l', LST.canal, 0, 12), c('destinatario', 'Destinatário', 't', 0, 0, 30),
      c('copia', 'Cópia', 't', 0, 0, 24), c('assunto', 'Assunto', 't', 0, 0, 40), c('mensagem', 'Mensagem', 'm', 0, 0, 50), c('status', 'Status', 'l', LST.com, 0, 24),
      c('preparado_em', 'Preparado em', 't', 0, 0, 16), c('enviado_em', 'Envio confirmado em', 't', 0, 0, 18), c('responsavel', 'Responsável', 't', 0, 0, 20)] },
    modelos: { sheet: 'Modelos_Email', key: 'id_modelo', pre: 'MOD', desc: 'Modelos de comunicação. Campos dinâmicos entre chaves duplas, ex.: {{nome}}.', cols: [
      c('id_modelo', 'ID', 't', 0, 0, 10), c('nome', 'Nome do modelo', 't', 0, 1, 40), c('destinatario', 'Destinatário padrão', 't', 0, 0, 22), c('copia', 'Cópia padrão', 't', 0, 0, 20), c('assunto', 'Assunto', 't', 0, 0, 50), c('mensagem', 'Mensagem', 'm', 0, 0, 70)] },
    clinicas: { sheet: 'Clinicas', key: 'id_clinica', pre: 'CLI', desc: 'Clínicas e prestadores (MMC e outras).', cols: [
      c('id_clinica', 'ID', 't', 0, 0, 10), c('nome', 'Nome', 't', 0, 1, 34), c('endereco', 'Endereço', 't', 0, 0, 44), c('telefone', 'Telefone', 't', 0, 0, 16), c('email', 'E-mail', 't', 0, 0, 28)] },
    campanhas: { sheet: 'Campanhas', key: 'id_campanha', pre: 'CAM', desc: 'Campanhas de exames periódicos (Fase 2).', cols: [
      c('id_campanha', 'ID', 't', 0, 0, 10), c('nome', 'Nome', 't', 0, 1, 30), c('inicio', 'Início', 'd', 0, 0, 12), c('fim', 'Fim', 'd', 0, 0, 12), c('status', 'Status', 'l', LST.camp, 0, 16)] },
    campanha_colab: { sheet: 'Campanha_Colab', key: 'id_cc', pre: 'CC', desc: 'Colaboradores incluídos em cada campanha (Fase 2).', cols: [
      c('id_cc', 'ID', 't', 0, 0, 10), c('id_campanha', 'ID da campanha', 't', 0, 1, 14), R('matricula', 'Matrícula'), c('situacao', 'Situação na campanha', 't', 0, 0, 24)] },
    divergencias: { sheet: 'Divergencias_MMC', key: 'id_div', pre: 'DIV', desc: 'Registro das diferenças encontradas ao comparar o relatório da MMC com o banco, e a decisão tomada.', cols: [
      c('id_div', 'ID', 't', 0, 0, 10), c('data_import', 'Data da importação', 't', 0, 0, 18), c('matricula', 'Matrícula', 't', 0, 0, 12), c('nome', 'Nome', 't', 0, 0, 30), c('exame', 'Exame', 't', 0, 0, 20),
      c('campo', 'Campo', 't', 0, 0, 22), c('valor_rh', 'Valor no banco', 't', 0, 0, 18), c('valor_mmc', 'Valor na MMC', 't', 0, 0, 18), c('decisao', 'Decisão', 'l', LST.dec, 0, 12)] },
    log: { sheet: 'Log_Alteracoes', desc: 'Trilha de auditoria: toda criação/alteração feita pelo sistema (quem, quando, o quê, antes e depois).', cols: [
      c('data_hora', 'Data/hora', 't', 0, 0, 18), c('usuario', 'Usuário', 't', 0, 0, 18), c('tabela', 'Tabela', 't', 0, 0, 16), c('chave', 'Chave', 't', 0, 0, 20), c('acao', 'Ação', 't', 0, 0, 26),
      c('campo', 'Campo', 't', 0, 0, 22), c('antes', 'Antes', 't', 0, 0, 24), c('depois', 'Depois', 't', 0, 0, 24)] },
    config: { sheet: 'Configuracoes', key: 'chave', desc: 'Parâmetros: responsavel_rh, empresa_nome, email_mmc, dias_alerta.', cols: [
      c('chave', 'Parâmetro', 't', 0, 1, 24), c('valor', 'Valor', 't', 0, 0, 44)] }
  };
  const REFS = ['exames', 'agendamentos', 'asos', 'comunicacoes', 'campanha_colab'];

  /* ---------- utilitários ---------- */
  const p2 = n => String(n).padStart(2, '0');
  const nowStr = () => { const d = new Date(); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`; };
  const today = () => nowStr().slice(0, 10);
  const fd = s => (s && /^\d{4}-\d{2}-\d{2}/.test(s)) ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : (s || '');
  const nrm = s => String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const nn = s => String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  function pd(v) {
    if (v == null || v === '') return '';
    if (typeof v === 'object' && !(v instanceof Date) && 'result' in v) v = v.result;
    if (v instanceof Date) return isNaN(v) ? '' : v.toISOString().slice(0, 10);
    if (typeof v === 'number') return new Date(Math.round((v - 25569) * 864e5)).toISOString().slice(0, 10);
    const s = String(v).trim(); let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) return `${m[3]}-${p2(m[2])}-${p2(m[1])}`;
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[0] : '';
  }
  function tx(v) {
    if (v == null) return '';
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    if (typeof v === 'object') { if (v.richText) return v.richText.map(x => x.text).join(''); if ('result' in v) return tx(v.result); if (v.text != null) return tx(v.text); return ''; }
    return String(v).trim();
  }
  const opts = (data, col) => col.o === 'clinicas' ? data.clinicas.map(x => x.nome) : (col.o || []);
  const lk = (tn, o) => tn === 'colaboradores' ? o.matricula : (o.matricula ? o.matricula + '/' + o[T[tn].key] : o[T[tn].key]);
  function nextId(data, tn) {
    const t = T[tn]; let m = 0;
    (data[tn] || []).forEach(r => { const n = parseInt(String(r[t.key]).replace(/\D/g, ''), 10); if (n > m) m = n; });
    return `${t.pre}-${String(m + 1).padStart(4, '0')}`;
  }
  const log = (data, usuario, tabela, chave, acao, campo, antes, depois) =>
    data.log.push({ data_hora: nowStr(), usuario: usuario || 'RH', tabela, chave: chave || '', acao, campo: campo || '', antes: antes == null ? '' : antes, depois: depois == null ? '' : depois });
  const cfg = (data, k, d) => { const r = data.config.find(x => x.chave === k); return r && r.valor !== '' ? r.valor : (d == null ? '' : d); };

  /* ---------- Excel: gravar ---------- */
  const toCell = (v, t) => (v === '' || v == null) ? null : (t === 'd' ? new Date(Date.parse(v + 'T00:00:00Z')) : v);
  async function toBuffer(data) {
    const wb = new ExcelJS.Workbook(); wb.creator = 'Sistema de Gestão de Exames Ocupacionais'; wb.created = new Date();
    const rd = wb.addWorksheet('LEIA-ME'); rd.getColumn(1).width = 110;
    ['SISTEMA DE GESTÃO DE EXAMES OCUPACIONAIS — BANCO DE DADOS', '',
      '1. Este arquivo é o banco de dados do sistema. Abra o sistema, clique em "Abrir meu Excel" e escolha este arquivo.',
      '2. Depois de importado, faça tudo pelo sistema (cadastros, agendamentos, ASOs, e-mails). Não é preciso editar a planilha à mão.',
      '3. Preencha primeiro a aba Colaboradores (matrícula é obrigatória e única). Nas demais abas, use a matrícula para relacionar.',
      '4. Células com seta têm lista de opções. Datas no formato dd/mm/aaaa. Não renomeie abas nem cabeçalhos (linha 1).',
      '5. Os dados de exemplo são FICTÍCIOS: apague-os (mantenha a linha 1) antes de colocar dados reais.',
      '6. Vencimentos e periodicidades devem ser os validados pela medicina ocupacional/PCMSO (normalmente informados pela MMC).',
      '7. Não guarde CPF, RG, PIS, laudos ou CID. Guarde apenas a situação do ASO e o local do arquivo.',
      '8. Guarde este arquivo em pasta corporativa com acesso restrito e faça backup pelo botão do sistema.'
    ].forEach((l, i) => { const cell = rd.getCell(i + 1, 1); cell.value = l; if (i === 0) cell.font = { bold: true, size: 14, color: { argb: 'FFEA580C' } }; cell.alignment = { wrapText: true }; });
    for (const [tn, t] of Object.entries(T)) {
      const ws = wb.addWorksheet(t.sheet, { views: [{ state: 'frozen', ySplit: 1 }] });
      ws.columns = t.cols.map(col => ({ header: col.h, key: col.k, width: col.w || 18 }));
      const hr = ws.getRow(1); hr.height = 24;
      hr.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF97316' } }; cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.alignment = { vertical: 'middle', wrapText: true }; });
      (data[tn] || []).forEach(r => ws.addRow(t.cols.map(col => toCell(r[col.k], col.t))));
      t.cols.forEach((col, i) => {
        const L = String.fromCharCode(65 + i), rng = `${L}2:${L}3000`, base = { allowBlank: true, showErrorMessage: true, errorStyle: 'warning', errorTitle: 'Valor fora do padrão' };
        if (col.t === 'd') { ws.getColumn(i + 1).numFmt = 'dd/mm/yyyy'; ws.dataValidations.add(rng, { ...base, type: 'date', operator: 'between', formulae: [new Date(Date.UTC(1950, 0, 1)), new Date(Date.UTC(2100, 0, 1))], error: 'Digite uma data válida (dd/mm/aaaa).' }); }
        else if (col.t === 'l') { const o = opts(data, col); ws.dataValidations.add(rng, { ...base, type: 'list', formulae: [col.o === 'clinicas' ? 'Clinicas!$B$2:$B$500' : '"' + o.join(',') + '"'], error: 'Escolha um valor da lista.' }); }
        else if (col.t === 'r') ws.dataValidations.add(rng, { ...base, type: 'list', formulae: ['Colaboradores!$A$2:$A$3000'], error: 'Matrícula não encontrada na aba Colaboradores.' });
      });
      ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: t.cols.length } };
    }
    return wb.xlsx.writeBuffer();
  }

  /* ---------- Excel: ler ---------- */
  async function fromBuffer(buf) {
    const wb = new ExcelJS.Workbook(); await wb.xlsx.load(buf);
    const data = {}, rep = { erros: [], avisos: [] };
    for (const [tn, t] of Object.entries(T)) {
      data[tn] = []; const ws = wb.getWorksheet(t.sheet);
      if (!ws) { rep.erros.push(`Aba "${t.sheet}" não encontrada.`); continue; }
      const hm = {}; ws.getRow(1).eachCell((cell, i) => { hm[nrm(tx(cell.value))] = i; });
      const idx = t.cols.map(col => hm[nrm(col.h)]);
      const faltam = t.cols.filter((col, i) => !idx[i] && (col.r || col.k === t.key));
      if (faltam.length) { faltam.forEach(col => rep.erros.push(`Aba "${t.sheet}": coluna obrigatória "${col.h}" não encontrada.`)); continue; }
      const seen = new Set();
      for (let r = 2; r <= ws.rowCount; r++) {
        const row = ws.getRow(r), o = {}; let any = false;
        t.cols.forEach((col, i) => { const raw = idx[i] ? row.getCell(idx[i]).value : null; o[col.k] = col.t === 'd' ? pd(raw) : tx(raw); if (o[col.k] !== '') any = true; });
        if (!any) continue;
        if (t.pre && !o[t.key]) { data[tn].push(o); o[t.key] = nextId(data, tn); data[tn].pop(); }
        const miss = t.cols.filter(col => col.r && !o[col.k]);
        if (miss.length) { rep.erros.push(`${t.sheet}, linha ${r}: preencha ${miss.map(m => m.h).join(', ')} (linha ignorada).`); continue; }
        if (t.key) { if (seen.has(o[t.key])) { rep.erros.push(`${t.sheet}, linha ${r}: ${t.key === 'matricula' ? 'matrícula' : 'identificador'} duplicado "${o[t.key]}" (linha ignorada).`); continue; } seen.add(o[t.key]); }
        data[tn].push(o);
      }
    }
    const mats = new Set(data.colaboradores.map(x => x.matricula));
    REFS.forEach(tn => data[tn].forEach(x => { if (x.matricula && !mats.has(x.matricula)) rep.avisos.push(`${T[tn].sheet}: matrícula "${x.matricula}" não existe em Colaboradores.`); }));
    return { data, rep };
  }

  /* ---------- Regras de status (usa apenas datas informadas pela MMC/PCMSO) ---------- */
  const diffDays = (a, b) => Math.round((Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / 864e5);
  function statusVenc(venc, hoje, lim) { if (!venc) return 'Sem informação'; const d = diffDays(venc, hoje); return d < 0 ? 'Vencido' : d <= (lim || 30) ? 'Próximo do vencimento' : 'Em dia'; }
  const ORD = ['Vencido', 'Sem informação', 'Próximo do vencimento'];
  function statusColab(data, col, hoje, lim) {
    const ex = data.exames.filter(e => e.matricula === col.matricula && e.tipo_exame !== 'Demissional');
    if (!ex.length) return { status: 'Sem informação', venc: '' };
    const g = new Map();
    ex.forEach(e => { const k = nn(e.exame) || e.tipo_exame; const p = g.get(k); if (!p || (e.data_resultado || e.data_vencimento || '') > (p.data_resultado || p.data_vencimento || '')) g.set(k, e); });
    const l = [...g.values()], ss = l.map(e => statusVenc(e.data_vencimento, hoje, lim));
    const vs = l.map(e => e.data_vencimento).filter(Boolean).sort();
    return { status: ORD.find(s => ss.includes(s)) || 'Em dia', venc: vs[0] || '' };
  }

  /* ---------- Relatório da MMC ---------- */
  const AL = { matricula: ['matricula', 'mat', 'chapa'], nome: ['nome', 'colaborador', 'funcionario', 'nomecompleto'], exame: ['exame', 'tipodeexame'], ultimo_pedido: ['ultimopedido', 'dataultimopedido'],
    data_resultado: ['dataresultado', 'dataderesultado'], periodicidade: ['periodicidade'], data_vencimento: ['refazerem', 'refazer', 'proximoexame', 'vencimento'], status_mmc: ['status'] };
  const DK = ['ultimo_pedido', 'data_resultado', 'data_vencimento'];
  async function readMMC(buf) {
    const wb = new ExcelJS.Workbook(); await wb.xlsx.load(buf);
    for (const ws of wb.worksheets) {
      const hm = {}; ws.getRow(1).eachCell((cell, i) => { const h = nrm(tx(cell.value)); for (const [k, a] of Object.entries(AL)) if (a.includes(h) && !hm[k]) hm[k] = i; });
      if (!hm.nome && !hm.matricula) continue;
      const rows = [];
      for (let r = 2; r <= ws.rowCount; r++) {
        const row = ws.getRow(r), o = {}; let any = false;
        for (const k of Object.keys(AL)) { const raw = hm[k] ? row.getCell(hm[k]).value : null; o[k] = DK.includes(k) ? pd(raw) : tx(raw); if (o[k]) any = true; }
        if (any) rows.push(o);
      }
      return { rows, aba: ws.name, colunas: Object.keys(hm) };
    }
    throw new Error('Não encontrei uma aba com a coluna "Nome" (ou "Matrícula") no relatório.');
  }
  function compare(data, rows) {
    const byMat = new Map(data.colaboradores.map(x => [x.matricula, x])), byName = new Map();
    data.colaboradores.forEach(x => { const n = nn(x.nome); byName.set(n, (byName.get(n) || []).concat(x)); });
    const items = [], seen = new Set(); let i = 0;
    for (const r of rows) {
      if (!r.nome && !r.matricula) continue;
      let col = r.matricula && byMat.get(String(r.matricula)), amb = false;
      if (!col && r.nome) { const l = byName.get(nn(r.nome)) || []; if (l.length === 1) col = l[0]; else if (l.length > 1) amb = true; }
      const it = { id: ++i, nome: r.nome || '', exame: r.exame || '', row: r };
      if (amb) { it.kind = 'ambiguo'; items.push(it); continue; }
      if (!col) { it.kind = 'sem_colab'; items.push(it); continue; }
      it.matricula = col.matricula; it.nome = col.nome; seen.add(col.matricula);
      const ex = data.exames.filter(e => e.matricula === col.matricula && nn(e.exame) === nn(r.exame)).sort((a, b) => (b.data_vencimento || '').localeCompare(a.data_vencimento || ''))[0];
      if (!ex) it.kind = 'novo';
      else { it.exameId = ex.id_exame; it.ch = ['data_resultado', 'ultimo_pedido', 'periodicidade', 'data_vencimento'].filter(k => r[k] && r[k] !== ex[k]).map(k => ({ k, rh: ex[k] || '', mmc: r[k] })); it.kind = it.ch.length ? 'diferente' : 'igual'; }
      items.push(it);
    }
    const sem = data.colaboradores.filter(x => ['Ativo', 'Afastado'].includes(x.situacao) && !seen.has(x.matricula));
    return { items, sem };
  }
  function applyMMC(data, items, sel, o) {
    const n = { novo: 0, diferente: 0, ignorado: 0 }, now = nowStr(), user = o.usuario;
    const div = (it, campo, rh, mmc, dec) => data.divergencias.push({ id_div: nextId(data, 'divergencias'), data_import: now, matricula: it.matricula || '', nome: it.nome, exame: it.exame, campo, valor_rh: rh, valor_mmc: mmc, decisao: dec });
    for (const it of items) {
      const ok = sel.has(it.id);
      if (it.kind === 'novo' && ok) {
        const e = { id_exame: nextId(data, 'exames'), matricula: it.matricula, tipo_exame: o.tipo || '', exame: it.row.exame, ultimo_pedido: it.row.ultimo_pedido, data_resultado: it.row.data_resultado, periodicidade: it.row.periodicidade, data_vencimento: it.row.data_vencimento, fonte: 'MMC', status_mmc: it.row.status_mmc, obs: '' };
        data.exames.push(e); log(data, user, 'exames', lk('exames', e), 'Criado (relatório MMC' + (o.arquivo ? ': ' + o.arquivo : '') + ')'); n.novo++;
      } else if (it.kind === 'diferente') {
        const e = data.exames.find(x => x.id_exame === it.exameId);
        it.ch.forEach(x => { div(it, x.k, x.rh, x.mmc, ok ? 'Aplicado' : 'Ignorado'); if (ok) { log(data, user, 'exames', lk('exames', e), 'Atualizado (relatório MMC)', x.k, x.rh, x.mmc); e[x.k] = x.mmc; } });
        if (ok) { e.fonte = 'MMC'; n.diferente++; } else n.ignorado++;
      } else if (it.kind === 'sem_colab' || it.kind === 'ambiguo') div(it, 'Colaborador ' + (it.kind === 'ambiguo' ? 'com nome repetido' : 'não localizado'), '', it.nome, 'Ignorado');
      else if (it.kind === 'novo') n.ignorado++;
    }
    return n;
  }

  /* ---------- Comunicação ---------- */
  function ctx(data, mat, hoje) {
    const col = data.colaboradores.find(x => x.matricula === mat) || {};
    const ag = data.agendamentos.filter(a => a.matricula === mat && a.status === 'Agendado').sort((a, b) => (b.data || '').localeCompare(a.data || ''))[0] || {};
    const cl = data.clinicas.find(x => x.nome === ag.clinica) || {};
    const ex = data.exames.filter(e => e.matricula === mat).sort((a, b) => (b.data_vencimento || '').localeCompare(a.data_vencimento || ''))[0] || {};
    const g = data.colaboradores.find(x => col.gestor && nn(x.nome) === nn(col.gestor)) || {};
    const eq = col.gestor ? data.colaboradores.filter(x => x.gestor === col.gestor && x.situacao === 'Ativo') : [];
    const pend = eq.map(x => ({ x, s: statusColab(data, x, hoje, +cfg(data, 'dias_alerta', 30)) })).filter(o => o.s.status !== 'Em dia').map(o => `- ${o.x.nome}: ${o.s.status}${o.s.venc ? ' (' + fd(o.s.venc) + ')' : ''}`).join('\n');
    return { nome: col.nome, matricula: col.matricula, cargo: col.cargo, departamento: col.departamento, unidade: col.unidade, gestor: col.gestor, gestor_email: g.email_corp, email_corp: col.email_corp, email_pessoal: col.email_pessoal,
      telefone: col.telefone, data_admissao: fd(col.data_admissao), tipo_exame: ag.tipo_exame || ex.tipo_exame, exame: ex.exame, data: fd(ag.data), horario: ag.horario, clinica: ag.clinica, endereco: cl.endereco,
      vencimento: fd(ex.data_vencimento), email_mmc: cfg(data, 'email_mmc'), responsavel: cfg(data, 'responsavel_rh'), empresa: cfg(data, 'empresa_nome'), pendencias: pend };
  }
  const fill = (s, c) => String(s || '').replace(/\{\{(\w+)\}\}/g, (m, k) => c[k] == null ? '' : c[k]);

  function docMd() {
    let s = '# Estrutura do Banco de Dados (Excel)\n\nUm único arquivo `.xlsx`. A **matrícula** liga as abas. Datas em dd/mm/aaaa. Cabeçalhos da linha 1 não podem ser renomeados.\n\n';
    for (const t of Object.values(T)) {
      s += `## ${t.sheet}\n${t.desc}\n\n| Campo | Tipo | Obrigatório | Observação |\n|---|---|---|---|\n`;
      t.cols.forEach(col => { const tipo = { t: 'texto', m: 'texto longo', d: 'data', l: 'lista', r: 'matrícula (relaciona com Colaboradores)' }[col.t]; const ob = col.t === 'l' ? (col.o === 'clinicas' ? 'valores da aba Clinicas' : (col.o || []).join(' / ')) : (col.k === t.key ? 'identificador único' + (t.pre ? ' (gerado pelo sistema)' : '') : ''); s += `| ${col.h} | ${tipo} | ${col.r ? 'sim' : 'não'} | ${ob} |\n`; });
      s += '\n';
    }
    return s;
  }
  return { T, LST, REFS, toBuffer, fromBuffer, nextId, log, lk, cfg, opts, statusVenc, statusColab, readMMC, compare, applyMMC, ctx, fill, fd, nowStr, today, nn, docMd, diffDays };
});
