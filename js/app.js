(() => {
  'use strict';
  const C = Core, T = C.T, fd = C.fd;
  const S = { data: null, handle: null, file: '', dirty: false, saved: '', view: 'painel', fl: {}, q: {}, mmc: null, mtime: 0, cur: null, frm: null };
  const $ = s => document.querySelector(s);
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const IC = { grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>', users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>', clip: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>', cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>', file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/>', mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>', sync: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>', save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>', help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>' };
  const ico = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[n]}</svg>`;
  const NAV = [['painel', 'Painel', 'grid'], ['colaboradores', 'Colaboradores', 'users'], ['exames', 'Exames', 'clip'], ['agendamentos', 'Agendamentos', 'cal'], ['asos', 'ASOs', 'file'], ['comunicacoes', 'Comunicações', 'mail'], ['mmc', 'Comparar com a MMC', 'sync'], ['arquivo', 'Arquivo e backup', 'save'], ['ajuda', 'Ajuda', 'help']];
  const TITLE = { colaboradores: 'Colaboradores', exames: 'Exames', agendamentos: 'Agendamentos', asos: 'ASOs (controle documental)', comunicacoes: 'Comunicações' };
  const HINT = { colaboradores: 'Clique no nome para abrir a ficha completa do colaborador.', exames: 'O vencimento ("Refazer em") vem da MMC/PCMSO. Clique em uma linha para editar.', agendamentos: 'Para reagendar, crie um novo agendamento: o anterior fica no histórico como "Reagendado".', asos: 'Registre aqui o recebimento do ASO e onde o arquivo foi guardado (pasta ou link).', comunicacoes: 'Status: Preparado → Aberto no aplicativo → Envio confirmado pelo RH. Só confirme depois de enviar de verdade.' };
  const SHOW = { colaboradores: ['matricula', 'nome', 'departamento', 'cargo', 'gestor', 'situacao', '@sc'], exames: ['id_exame', 'matricula', 'tipo_exame', 'exame', 'data_resultado', 'data_vencimento', '@sv'], agendamentos: ['id_agend', 'matricula', 'tipo_exame', 'data', 'horario', 'clinica', 'status'], asos: ['id_aso', 'matricula', 'tipo_exame', 'data_aso', 'situacao', 'recebido_em'], comunicacoes: ['id_com', 'matricula', 'modelo', 'canal', 'status', 'preparado_em', 'enviado_em'] };
  const BC = { 'Em dia': 'ok', Apto: 'ok', Realizado: 'ok', 'Envio confirmado pelo RH': 'ok', Ativo: 'ok', Aplicado: 'ok', 'Próximo do vencimento': 'wn', Agendado: 'wn', Preparado: 'wn', 'Aberto no aplicativo': 'wn', 'Admissão pendente': 'wn', 'Apto com restrição': 'wn', Vencido: 'bd', Faltou: 'bd', Inapto: 'bd', Desligado: 'gy', 'Sem informação': 'gy' };
  const badge = s => s ? `<span class="badge b-${BC[s] || 'gy'}">${esc(s)}</span>` : '';
  const user = () => C.cfg(S.data, 'responsavel_rh', 'RH');
  const lim = () => +C.cfg(S.data, 'dias_alerta', 30) || 30;
  const nameOf = m => { const c = S.data && S.data.colaboradores.find(x => x.matricula === m); return c ? c.nome : ''; };
  const sc = c => C.statusColab(S.data, c, C.today(), lim());
  function toast(m, bad) { const d = document.createElement('div'); d.textContent = m; if (bad) d.className = 'bad'; $('#toast').appendChild(d); setTimeout(() => d.remove(), bad ? 7000 : 3500); }
  function modal(h, w) { $('#modal').innerHTML = `<div class="ov"><div class="mb ${w ? 'w' : ''}">${h}</div></div>`; }
  const fechar = () => { $('#modal').innerHTML = ''; };
  function dirty() { S.dirty = true; renderBar(); }

  /* ---------- barra de salvamento ---------- */
  function renderBar() {
    const st = !S.data ? ['', 'Nenhum Excel aberto'] : S.dirty ? ['dirty', 'Alterações NÃO salvas no Excel'] : ['ok', S.saved || 'Excel aberto — nenhuma alteração pendente'];
    $('#sb').innerHTML = `<div class="sb ${st[0]}"><span class="dot"></span><b>${esc(st[1])}</b>${S.data ? `<button class="btn ${S.dirty ? 'pri' : ''}" data-a="salvar">💾 Salvar Excel</button>` : ''}</div>`;
  }

  /* ---------- arquivo ---------- */
  const XL = { description: 'Excel', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } };
  async function abrir() {
    if (window.showOpenFilePicker) { try { const [h] = await showOpenFilePicker({ types: [XL] }); const f = await h.getFile(); await carregar(await f.arrayBuffer(), f.name, h, f.lastModified); } catch (e) { if (e.name !== 'AbortError') toast('Não consegui abrir: ' + e.message, 1); } }
    else $('#inp').click();
  }
  async function carregar(buf, nome, h, mt, restaurar) {
    let r; try { r = await C.fromBuffer(buf); } catch (e) { return toast('Arquivo inválido: não parece um Excel (.xlsx). ' + e.message, 1); }
    const go = () => {
      fechar(); S.data = r.data; if (!restaurar) { S.handle = h || null; S.file = nome; S.mtime = mt || 0; S.dirty = false; S.saved = ''; } else { S.dirty = true; }
      renderBar(); S.view = restaurar ? S.view : 'painel'; render(); toast(restaurar ? 'Backup restaurado na memória. Clique em "Salvar Excel" para gravar.' : `"${nome}" aberto: ${r.data.colaboradores.length} colaboradores, ${r.data.exames.length} exames.`);
    };
    window.__go = go;
    if (!r.rep.erros.length && !r.rep.avisos.length && !restaurar) return go();
    modal(`<h2>Conferência do arquivo</h2>${r.rep.erros.length ? '<div class="err"><b>Problemas encontrados (essas linhas serão ignoradas):</b></div>' + r.rep.erros.slice(0, 40).map(e => `<div class="err">${esc(e)}</div>`).join('') : '<div class="info">Nenhum erro de preenchimento.</div>'}${r.rep.avisos.length ? '<div class="warn"><b>Avisos:</b></div>' + r.rep.avisos.slice(0, 25).map(e => `<div class="warn">${esc(e)}</div>`).join('') : ''}<div class="acts"><button class="btn" data-a="fechar">Cancelar</button><button class="btn pri" data-a="seguir">${restaurar ? 'Restaurar este backup' : 'Continuar mesmo assim'}</button></div>`);
  }
  function baixar(buf, nome) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })); a.download = nome; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
  const stamp = () => C.nowStr().replace(/[-: ]/g, '').replace(/^(\d{8})(\d{4})$/, '$1_$2');
  async function salvar() {
    if (!S.data) return;
    try {
      if (S.handle) {
        const f = await S.handle.getFile();
        if (S.mtime && f.lastModified !== S.mtime && !confirm('Este Excel foi alterado fora do sistema desde que você o abriu.\nSe continuar, essas alterações serão sobrescritas.\n\nContinuar mesmo assim?')) return;
        if (S.handle.requestPermission && (await S.handle.requestPermission({ mode: 'readwrite' })) !== 'granted') throw new Error('permissão de gravação negada');
        const buf = await C.toBuffer(S.data), w = await S.handle.createWritable(); await w.write(buf); await w.close();
        const f2 = await S.handle.getFile(); if (f2.size !== buf.byteLength) throw new Error('verificação falhou: o tamanho gravado difere do esperado');
        S.mtime = f2.lastModified; S.dirty = false; S.saved = `Salvo em "${S.file}" às ${C.nowStr().slice(11)}`; toast('Excel salvo e verificado.');
      } else {
        baixar(await C.toBuffer(S.data), S.file || 'Banco_Dados_Exames_RH.xlsx');
        S.dirty = false; S.saved = `Excel baixado às ${C.nowStr().slice(11)} — substitua o arquivo original por ele`; toast('Excel atualizado baixado na pasta Downloads. Substitua o arquivo original.');
      }
    } catch (e) { toast('NÃO foi salvo: ' + e.message, 1); }
    renderBar(); if (S.view === 'arquivo') render();
  }
  async function backup() { if (S.data) { baixar(await C.toBuffer(S.data), `Backup_Exames_RH_${stamp()}.xlsx`); toast('Backup baixado.'); } }

  /* ---------- formulários genéricos ---------- */
  function cellHtml(tn, k, v) {
    if (k === '@sc') { const s = sc(S.cur0); return badge(s.status) + (s.venc ? ` <small>${fd(s.venc)}</small>` : ''); }
    if (k === '@sv') return badge(C.statusVenc(S.cur0.data_vencimento, C.today(), lim()));
    const col = T[tn].cols.find(c => c.k === k);
    if (k === 'matricula' && tn !== 'colaboradores') return `${esc(v)} — ${esc(nameOf(v))}`;
    if (col && col.t === 'd') return fd(v);
    return BC[v] ? badge(v) : esc(v);
  }
  const head = (tn, k) => k === '@sc' ? 'Situação dos exames' : k === '@sv' ? 'Situação do vencimento' : T[tn].cols.find(c => c.k === k).h;
  function tabela(tn) {
    const q = (S.q[tn] || '').toLowerCase(); let rows = S.data[tn];
    if (q) rows = rows.filter(r => (Object.values(r).join(' ') + (r.matricula ? nameOf(r.matricula) : '')).toLowerCase().includes(q));
    if (tn !== 'colaboradores') rows = rows.slice().reverse();
    const sh = SHOW[tn], tot = rows.length; rows = rows.slice(0, 300);
    $('#main').innerHTML = `<div class="ph"><h1>${TITLE[tn]}</h1><div style="display:flex;gap:8px"><input class="search" data-q="${tn}" placeholder="Buscar..." value="${esc(S.q[tn] || '')}"><button class="btn pri" data-a="${tn === 'comunicacoes' ? 'novaCom' : 'novo'}" data-v="${tn}">+ ${tn === 'comunicacoes' ? 'Nova comunicação' : 'Novo'}</button></div></div><p class="hint">${HINT[tn]}</p><div class="card tw"><table><thead><tr>${sh.map(k => `<th>${esc(head(tn, k))}</th>`).join('')}</tr></thead><tbody>${rows.map(r => { S.cur0 = r; return `<tr data-a="${tn === 'colaboradores' ? 'ficha' : tn === 'comunicacoes' ? 'compor' : 'editar'}" data-v="${esc(tn === 'colaboradores' ? r.matricula : tn === 'comunicacoes' ? r.id_com : tn + '|' + r[T[tn].key])}">${sh.map(k => `<td>${cellHtml(tn, k, r[k])}</td>`).join('')}</tr>`; }).join('') || `<tr><td colspan="${sh.length}">Nenhum registro.</td></tr>`}</tbody></table></div>${tot > 300 ? `<p class="hint">Mostrando 300 de ${tot}. Use a busca para filtrar.</p>` : ''}`;
  }
  function field(col, val, ro) {
    const n = 'f_' + col.k; let i;
    if (col.t === 'm') i = `<textarea name="${n}" rows="3">${esc(val)}</textarea>`;
    else if (col.t === 'd') i = `<input type="date" name="${n}" value="${esc(val)}">`;
    else if (col.t === 'l') i = `<select name="${n}"><option value=""></option>${C.opts(S.data, col).map(x => `<option ${x === val ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>`;
    else if (col.t === 'r') i = `<input name="${n}" list="dlc" autocomplete="off" placeholder="Digite matrícula ou nome" value="${esc(val ? val + ' — ' + nameOf(val) : '')}">`;
    else i = `<input name="${n}" value="${esc(val)}" ${ro ? 'readonly style="background:#F5F5F4"' : ''}>`;
    return `<label class="fl ${col.t === 'm' ? 'full' : ''}"><span>${esc(col.h)}${col.r ? ' *' : ''}</span>${i}</label>`;
  }
  function form(tn, row, preset, after) {
    const t = T[tn], isNew = !row, r = row ? { ...row } : { ...(preset || {}) };
    if (isNew && t.pre) r[t.key] = C.nextId(S.data, tn);
    if (isNew && tn === 'agendamentos' && !r.status) r.status = 'Agendado';
    if (isNew && tn === 'colaboradores' && !r.situacao) r.situacao = 'Ativo';
    S.frm = { tn, row, isNew, after };
    modal(`<h2>${isNew ? 'Novo registro' : 'Editar'} — ${esc(TITLE[tn] || t.sheet)}</h2>${tn === 'agendamentos' && isNew ? '<div class="info">Se já existir um agendamento ativo deste colaborador para o mesmo tipo de exame, ele será marcado como "Reagendado" e preservado no histórico.</div>' : ''}<div class="fm" id="frm">${t.cols.map(col => field(col, r[col.k], col.k === t.key && (t.pre || !isNew))).join('')}</div><div class="acts"><button class="btn" data-a="cancelarForm">Cancelar</button><button class="btn pri" data-a="salvarForm">Salvar registro</button></div>`, 1);
  }
  function salvarForm() {
    const { tn, row, isNew, after } = S.frm, t = T[tn], o = {};
    for (const col of t.cols) { const el = document.querySelector(`[name=f_${col.k}]`); let v = el ? el.value.trim() : ''; if (col.t === 'r') v = v.split(' — ')[0].trim(); o[col.k] = v; }
    const miss = t.cols.filter(c => c.r && !o[c.k]); if (miss.length) return toast('Preencha: ' + miss.map(m => m.h).join(', '), 1);
    if (isNew && tn === 'colaboradores' && S.data.colaboradores.some(c => c.matricula === o.matricula)) return toast('Já existe um colaborador com esta matrícula.', 1);
    if (t.cols.some(c => c.t === 'r') && !S.data.colaboradores.some(c => c.matricula === o.matricula)) return toast('Matrícula não encontrada em Colaboradores.', 1);
    if (isNew) {
      if (tn === 'agendamentos' && o.status === 'Agendado') { const p = S.data.agendamentos.find(a => a.matricula === o.matricula && (!o.tipo_exame || !a.tipo_exame || a.tipo_exame === o.tipo_exame) && a.status === 'Agendado'); if (p) { C.log(S.data, user(), tn, C.lk(tn, p), 'Reagendado', 'status', 'Agendado', 'Reagendado'); p.status = 'Reagendado'; o.reagendado_de = p.id_agend; if (!o.tipo_exame) o.tipo_exame = p.tipo_exame; } }
      S.data[tn].push(o); C.log(S.data, user(), tn, C.lk(tn, o), 'Criado');
    } else { t.cols.forEach(c => { if ((row[c.k] || '') !== (o[c.k] || '')) C.log(S.data, user(), tn, C.lk(tn, o), 'Alterado', c.h, row[c.k], o[c.k]); }); Object.assign(row, o); }
    fechar(); dirty(); toast('Registro salvo na memória — lembre de clicar em "Salvar Excel".'); after ? after() : render();
  }

  /* ---------- ficha do colaborador ---------- */
  function ficha(mat) {
    const c = S.data.colaboradores.find(x => x.matricula === mat); if (!c) return; const s = sc(c), D = S.data, by = tn => D[tn].filter(x => x.matricula === mat).reverse();
    const mini = (tn, cols, rows, a) => `<table><thead><tr>${cols.map(k => `<th>${esc(head(tn, k))}</th>`).join('')}</tr></thead><tbody>${rows.map(r => { S.cur0 = r; return `<tr data-a="${a}" data-v="${esc(a === 'compor' ? r.id_com : tn + '|' + r[T[tn].key])}">${cols.map(k => `<td>${cellHtml(tn, k === 'matricula' ? 'x' : k, r[k])}</td>`).join('')}</tr>`; }).join('') || `<tr><td colspan="${cols.length}">Nada registrado.</td></tr>`}</tbody></table>`;
    const logs = D.log.filter(l => l.chave === mat || String(l.chave).startsWith(mat + '/')).slice().reverse().slice(0, 40);
    const tipo = (D.exames.concat().filter(e => e.matricula === mat)[0] || {}).tipo_exame;
    modal(`<div class="ph"><div><h2 style="margin:0">${esc(c.nome)}</h2><span class="hint">Matrícula ${esc(c.matricula)} · ${esc(c.cargo)} · ${esc(c.departamento)}</span></div><div>${badge(c.situacao)} ${badge(s.status)}${s.venc ? ' <small>vence ' + fd(s.venc) + '</small>' : ''}</div></div>
    <div class="dg"><div><small>Unidade / Filial</small>${esc(c.unidade)} / ${esc(c.filial)}</div><div><small>Gestor</small>${esc(c.gestor)}</div><div><small>Admissão</small>${fd(c.data_admissao)}</div><div><small>E-mail corporativo</small>${esc(c.email_corp)}</div><div><small>E-mail pessoal</small>${esc(c.email_pessoal)}</div><div><small>Telefone</small>${esc(c.telefone)}</div></div>${c.obs ? `<div class="info">Obs.: ${esc(c.obs)}</div>` : ''}
    <div class="acts" style="justify-content:flex-start;margin:8px 0 0"><button class="btn" data-a="fEdit" data-v="${esc(mat)}">Editar cadastro</button><button class="btn" data-a="fNovo" data-v="exames|${esc(mat)}">+ Exame</button><button class="btn" data-a="fNovo" data-v="agendamentos|${esc(mat)}">+ Agendar / Reagendar</button><button class="btn" data-a="fNovo" data-v="asos|${esc(mat)}">+ Registrar ASO</button><button class="btn pri" data-a="novaCom" data-v="${esc(mat)}">✉ Gerar e-mail / mensagem</button></div>
    <h3>Exames</h3>${mini('exames', ['id_exame', 'tipo_exame', 'exame', 'data_resultado', 'data_vencimento', '@sv'], by('exames'), 'fEditar')}
    <h3>Agendamentos (inclui faltas e reagendamentos)</h3>${mini('agendamentos', ['id_agend', 'tipo_exame', 'data', 'horario', 'clinica', 'status'], by('agendamentos'), 'fEditar')}
    <h3>ASOs</h3>${mini('asos', ['id_aso', 'tipo_exame', 'data_aso', 'situacao', 'recebido_em'], by('asos'), 'fEditar')}
    <h3>Comunicações</h3>${mini('comunicacoes', ['id_com', 'modelo', 'canal', 'status', 'preparado_em', 'enviado_em'], by('comunicacoes'), 'compor')}
    <h3>Histórico de alterações</h3><table><tbody>${logs.map(l => `<tr><td>${esc(l.data_hora)}</td><td>${esc(l.acao)}</td><td>${esc(l.campo)}</td><td>${esc(l.antes)} → ${esc(l.depois)}</td></tr>`).join('') || '<tr><td>Sem alterações registradas.</td></tr>'}</tbody></table>
    <div class="acts"><button class="btn" data-a="fechar">Fechar</button></div>`, 1);
  }

  /* ---------- comunicações ---------- */
  function novaCom(mat) {
    const mods = S.data.modelos; if (!mods.length) return toast('Cadastre modelos na aba Modelos_Email do Excel.', 1);
    modal(`<h2>Nova comunicação</h2><div class="info">O sistema preenche o texto com os dados do colaborador e registra a comunicação como <b>Preparada</b>. Você revisa e edita antes de enviar.</div><div class="fm"><label class="fl full"><span>Colaborador *</span><input id="n_c" list="dlc" autocomplete="off" value="${mat && mat !== 'comunicacoes' ? esc(mat + ' — ' + nameOf(mat)) : ''}" placeholder="Digite matrícula ou nome"></label><label class="fl"><span>Modelo *</span><select id="n_m">${mods.map(m => `<option value="${esc(m.id_modelo)}">${esc(m.nome)}</option>`).join('')}</select></label><label class="fl"><span>Canal</span><select id="n_k"><option>E-mail</option><option>WhatsApp</option></select></label></div><div class="acts"><button class="btn" data-a="fechar">Cancelar</button><button class="btn pri" data-a="gerarCom">Gerar</button></div>`);
  }
  function gerarCom() {
    const mat = $('#n_c').value.split(' — ')[0].trim(), col = S.data.colaboradores.find(c => c.matricula === mat); if (!col) return toast('Escolha um colaborador da lista.', 1);
    const m = S.data.modelos.find(x => x.id_modelo === $('#n_m').value), cx = C.ctx(S.data, mat, C.today()), canal = $('#n_k').value;
    const o = { id_com: C.nextId(S.data, 'comunicacoes'), matricula: mat, modelo: m.nome, canal, destinatario: canal === 'WhatsApp' ? (col.telefone || '') : C.fill(m.destinatario, cx), copia: C.fill(m.copia, cx), assunto: C.fill(m.assunto, cx), mensagem: C.fill(m.mensagem, cx), status: 'Preparado', preparado_em: C.nowStr(), enviado_em: '', responsavel: user() };
    S.data.comunicacoes.push(o); C.log(S.data, user(), 'comunicacoes', C.lk('comunicacoes', o), 'Criado (preparado)', 'modelo', '', m.nome); dirty(); compor(o.id_com);
    if (!o.destinatario) toast('Atenção: não há destinatário/telefone cadastrado para este colaborador.', 1);
  }
  function compor(id) {
    const o = S.data.comunicacoes.find(x => x.id_com === id); if (!o) return; S.cur = o; const wa = o.canal === 'WhatsApp';
    modal(`<h2>${esc(o.id_com)} — ${esc(o.modelo)} ${badge(o.status)}</h2><p class="hint">${esc(o.matricula)} — ${esc(nameOf(o.matricula))}. Revise e edite. "Abrir" só abre o aplicativo: o envio só é registrado quando você confirmar.${o.enviado_em ? ' Envio confirmado em ' + esc(o.enviado_em) + '.' : ''}</p><div class="fm"><label class="fl"><span>${wa ? 'Telefone' : 'Para'}</span><input id="c_d" value="${esc(o.destinatario)}"></label><label class="fl"><span>Cópia</span><input id="c_c" value="${esc(o.copia)}"></label><label class="fl full"><span>Assunto</span><input id="c_s" value="${esc(o.assunto)}"></label><label class="fl full"><span>Mensagem</span><textarea id="c_m" rows="12">${esc(o.mensagem)}</textarea></label></div><div class="acts"><button class="btn" data-a="cCopiar">📋 Copiar</button><button class="btn" data-a="${wa ? 'cWhats' : 'cMail'}">${wa ? '💬 Abrir WhatsApp' : '✉ Abrir no e-mail (Outlook)'}</button>${wa ? '' : '<button class="btn" data-a="cWhats">💬 WhatsApp</button>'}<button class="btn pri" data-a="cConfirmar">✔ Confirmar que foi enviado</button><button class="btn" data-a="cSalvar">Salvar e fechar</button></div>`, 1);
  }
  function lerCom() {
    const o = S.cur, v = { destinatario: $('#c_d').value, copia: $('#c_c').value, assunto: $('#c_s').value, mensagem: $('#c_m').value };
    if (Object.keys(v).some(k => v[k] !== o[k])) { Object.assign(o, v); C.log(S.data, user(), 'comunicacoes', C.lk('comunicacoes', o), 'Texto editado'); dirty(); }
  }
  function setCom(st) { const o = S.cur; if (o.status === st) return; C.log(S.data, user(), 'comunicacoes', C.lk('comunicacoes', o), 'Status alterado', 'status', o.status, st); o.status = st; if (st === 'Envio confirmado pelo RH') { o.enviado_em = C.nowStr(); o.responsavel = user(); } dirty(); }
  const abrirUrl = u => { const a = document.createElement('a'); a.href = u; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); };

  /* ---------- painel ---------- */
  function painel() {
    const D = S.data, F = S.fl, hoje = C.today(), L = lim();
    const cs = D.colaboradores.filter(c => (!F.empresa || c.empresa === F.empresa) && (!F.unidade || c.unidade === F.unidade) && (!F.departamento || c.departamento === F.departamento) && (!F.gestor || c.gestor === F.gestor));
    const mats = new Set(cs.map(c => c.matricula)), at = cs.filter(c => ['Ativo', 'Afastado'].includes(c.situacao)).map(c => ({ c, ...C.statusColab(D, c, hoje, L) }));
    const n = s => at.filter(x => x.status === s).length, tot = at.length, ok = n('Em dia'), pc = tot ? Math.round(ok / tot * 100) : 0;
    const ag = D.agendamentos.filter(a => mats.has(a.matricula)), asoPend = ag.filter(a => a.status === 'Realizado' && !D.asos.some(s => s.matricula === a.matricula && s.tipo_exame === a.tipo_exame && s.data_aso >= a.data)).length;
    const opt = (k, f) => { const v = [...new Set(D.colaboradores.map(c => c[k]).filter(Boolean))].sort(); return `<select data-f="${f}"><option value="">${f[0].toUpperCase() + f.slice(1)}: todos</option>${v.map(x => `<option ${F[f] === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>`; };
    const a = Math.round(ok / (tot || 1) * 360), b = a + Math.round(n('Próximo do vencimento') / (tot || 1) * 360), c2 = b + Math.round(n('Vencido') / (tot || 1) * 360);
    const bk = [['Vencidos', x => x.venc && C.diffDays(x.venc, hoje) < 0], ['Até 7 dias', x => x.venc && C.diffDays(x.venc, hoje) >= 0 && C.diffDays(x.venc, hoje) <= 7], ['8 a 15 dias', x => x.venc && C.diffDays(x.venc, hoje) > 7 && C.diffDays(x.venc, hoje) <= 15], ['16 a 30 dias', x => x.venc && C.diffDays(x.venc, hoje) > 15 && C.diffDays(x.venc, hoje) <= 30], ['31 a 60 dias', x => x.venc && C.diffDays(x.venc, hoje) > 30 && C.diffDays(x.venc, hoje) <= 60], ['61 a 90 dias', x => x.venc && C.diffDays(x.venc, hoje) > 60 && C.diffDays(x.venc, hoje) <= 90]].map(([l, f]) => [l, at.filter(f).length]);
    const mx = Math.max(1, ...bk.map(x => x[1])), gest = {}; at.filter(x => x.status !== 'Em dia').forEach(x => { const g = x.c.gestor || '(sem gestor)'; gest[g] = (gest[g] || 0) + 1; });
    const atencao = at.filter(x => x.status !== 'Em dia').sort((p, q) => (p.venc || '9').localeCompare(q.venc || '9')).slice(0, 8);
    $('#main').innerHTML = `<div class="ph"><h1>Painel</h1></div><div class="fil">${opt('empresa', 'empresa')}${opt('unidade', 'unidade')}${opt('departamento', 'departamento')}${opt('gestor', 'gestor')}</div>
    <div class="kp"><div class="k"><b>${tot}</b><span>Colaboradores ativos</span></div><div class="k ok"><b>${ok}</b><span>Exames em dia</span></div><div class="k or"><b>${n('Próximo do vencimento')}</b><span>Vencem em até ${L} dias</span></div><div class="k bd"><b>${n('Vencido')}</b><span>Exames vencidos</span></div><div class="k"><b>${n('Sem informação')}</b><span>Sem informação suficiente</span></div><div class="k"><b>${cs.filter(c => c.situacao === 'Admissão pendente').length}</b><span>Admissionais pendentes</span></div><div class="k"><b>${ag.filter(x => x.status === 'Agendado').length}</b><span>Agendamentos confirmados</span></div><div class="k"><b>${ag.filter(x => x.status === 'Realizado').length}</b><span>Exames realizados</span></div><div class="k"><b>${asoPend}</b><span>ASOs pendentes</span></div><div class="k or"><b>${pc}%</b><span>Conformidade</span></div></div>
    <div class="g2"><div class="card"><h2>Situação dos exames</h2><div class="donut" style="background:conic-gradient(#16a34a 0 ${a}deg,#F97316 ${a}deg ${b}deg,#dc2626 ${b}deg ${c2}deg,#a8a29e ${c2}deg 360deg)"><div>${pc}%</div></div><div class="lg"><span><i style="background:#16a34a"></i>Em dia</span><span><i style="background:#F97316"></i>Próximo</span><span><i style="background:#dc2626"></i>Vencido</span><span><i style="background:#a8a29e"></i>Sem informação</span></div></div>
    <div class="card"><h2>Alertas de vencimento</h2>${bk.map(([l, v]) => `<div class="bar"><span>${l}</span><div><i style="width:${v / mx * 100}%"></i></div><b>${v}</b></div>`).join('')}<p class="hint" style="margin:10px 0 0">Calculado ao abrir ou atualizar os dados, com base nas datas informadas pela MMC/PCMSO.</p></div></div>
    <div class="g2"><div class="card"><h2>Precisam de atenção</h2><table><tbody>${atencao.map(x => `<tr data-a="ficha" data-v="${esc(x.c.matricula)}"><td>${esc(x.c.nome)}</td><td>${badge(x.status)}</td><td>${fd(x.venc)}</td></tr>`).join('') || '<tr><td>Nenhuma pendência 🎉</td></tr>'}</tbody></table></div>
    <div class="card"><h2>Pendências por gestor</h2>${Object.entries(gest).sort((p, q) => q[1] - p[1]).map(([g, v]) => `<div class="bar"><span>${esc(g)}</span><div><i style="width:${v / Math.max(...Object.values(gest)) * 100}%"></i></div><b>${v}</b></div>`).join('') || '<p class="hint">Sem pendências.</p>'}</div></div>`;
  }

  /* ---------- comparar com MMC ---------- */
  const KL = { diferente: ['Dados diferentes', 'wn'], novo: ['Exame novo para o colaborador', 'ok'], sem_colab: ['Não localizado no RH', 'bd'], ambiguo: ['Nome repetido no RH', 'bd'], igual: ['Igual', 'gy'] };
  function mmcView() {
    const m = S.mmc; let h = `<div class="ph"><h1>Comparar com o relatório da MMC</h1></div><p class="hint">Carregue o relatório da MMC (ex.: "Exames In Company" ou "Complementares"). O sistema compara com o banco e mostra as diferenças <b>antes</b> de alterar qualquer coisa.</p>
    <div class="card"><div class="fm"><label class="fl"><span>Tipo dos exames deste relatório</span><select id="m_t">${C.LST.tipo.map(x => `<option ${m && m.tipo === x ? 'selected' : x === 'Periódico' && !m ? 'selected' : ''}>${x}</option>`).join('')}</select></label><div style="align-self:end"><button class="btn pri big" data-a="mmcArq">📂 Escolher relatório da MMC (.xlsx)</button></div></div></div>`;
    if (m) {
      const cnt = k => m.items.filter(i => i.kind === k).length, rev = m.items.filter(i => i.kind !== 'igual');
      h += `<div class="kp" style="margin-top:14px"><div class="k or"><b>${cnt('diferente')}</b><span>Com dados diferentes</span></div><div class="k"><b>${cnt('novo')}</b><span>Exames novos</span></div><div class="k bd"><b>${cnt('sem_colab') + cnt('ambiguo')}</b><span>Não localizados / ambíguos</span></div><div class="k ok"><b>${cnt('igual')}</b><span>Já iguais</span></div><div class="k"><b>${m.sem.length}</b><span>Ativos sem linha na MMC</span></div></div>
      <div class="card tw"><table><thead><tr><th></th><th>Colaborador</th><th>Exame</th><th>Ocorrência</th><th>No banco → na MMC</th><th>Situação na MMC</th></tr></thead><tbody>${rev.map(i => `<tr><td>${i.kind === 'diferente' || i.kind === 'novo' ? `<input type="checkbox" data-sel="${i.id}" ${m.sel.has(i.id) ? 'checked' : ''} style="width:auto">` : ''}</td><td>${esc(i.nome)}${i.matricula ? ' <small>(' + esc(i.matricula) + ')</small>' : ''}</td><td>${esc(i.exame)}</td><td><span class="badge b-${KL[i.kind][1]}">${KL[i.kind][0]}</span></td><td>${i.kind === 'diferente' ? i.ch.map(c => `${esc(T.exames.cols.find(x => x.k === c.k).h)}: ${fd(c.rh) || '—'} → <b>${fd(c.mmc)}</b>`).join('<br>') : i.kind === 'novo' ? 'Será criado: vence ' + (fd(i.row.data_vencimento) || 'sem data') : ''}</td><td>${badge(C.statusVenc(i.row.data_vencimento, C.today(), lim()))}</td></tr>`).join('') || '<tr><td colspan="6">Nenhuma diferença encontrada.</td></tr>'}</tbody></table></div>
      ${m.sem.length ? `<h3>Colaboradores ativos que não aparecem no relatório da MMC</h3><div class="card">${m.sem.slice(0, 60).map(c => esc(c.nome)).join(' · ')}</div>` : ''}
      <div class="acts"><button class="btn pri big" data-a="mmcAplicar">Aplicar as ${m.sel.size} atualizações marcadas</button></div>`;
    }
    $('#main').innerHTML = h;
  }
  async function mmcLer(f) {
    try { const { rows, aba } = await C.readMMC(await f.arrayBuffer()), r = C.compare(S.data, rows); const sel = new Set(r.items.filter(i => i.kind === 'diferente' || i.kind === 'novo').map(i => i.id)); S.mmc = { ...r, sel, tipo: $('#m_t').value, arquivo: f.name }; render(); toast(`Relatório lido (aba "${aba}", ${rows.length} linhas). Revise antes de aplicar.`); }
    catch (e) { toast(e.message, 1); }
  }
  async function mmcAplicar() {
    const m = S.mmc; if (!m.sel.size) return toast('Nenhuma atualização marcada.', 1);
    if (!confirm(`Aplicar ${m.sel.size} atualizações?\n\nAntes, será baixado um backup do Excel atual. Nada será apagado: agendamentos, comunicações e observações continuam como estão.`)) return;
    await backup(); const n = C.applyMMC(S.data, m.items, m.sel, { usuario: user(), tipo: $('#m_t').value, arquivo: m.arquivo }); S.mmc = null; dirty(); render();
    toast(`${n.diferente} exames atualizados e ${n.novo} criados. Clique em "Salvar Excel" para gravar.`);
  }

  /* ---------- outras telas ---------- */
  function boasVindas() {
    $('#main').innerHTML = `<div class="hero"><h1>Gestão de Exames Ocupacionais</h1><p>Um único Excel é o seu banco de dados. Você trabalha por aqui, e o sistema guarda tudo no Excel — sem enviar nada para a internet.</p></div>
    <div class="steps"><div class="st"><em>1</em><b>Baixe o modelo</b><p class="hint">Excel com todas as abas, listas e exemplos fictícios. Preencha com os dados reais.</p><a class="btn" href="modelo/Banco_Dados_Exames_RH.xlsx" download>⬇ Baixar modelo do Excel</a></div><div class="st"><em>2</em><b>Abra o seu Excel</b><p class="hint">O sistema confere colunas, duplicidades e erros e mostra o que encontrou.</p><button class="btn pri big" data-a="abrir">📂 Abrir meu Excel</button></div><div class="st"><em>3</em><b>Trabalhe e salve</b><p class="hint">Cadastre, agende, gere e-mails. O botão <b>Salvar Excel</b> avisa quando há algo por salvar.</p></div></div>
    <div class="card"><b>Dica:</b> no Chrome ou Edge o sistema salva direto no arquivo original. Em outros navegadores, ele baixa o Excel atualizado para você substituir o original.</div>`;
  }
  function arquivo() {
    $('#main').innerHTML = `<div class="ph"><h1>Arquivo e backup</h1></div><div class="g2"><div class="card"><h2>Salvar</h2><p class="hint">${S.data ? `Arquivo: <b>${esc(S.file)}</b>.<br>${S.dirty ? '<span style="color:var(--or2)"><b>Há alterações não salvas.</b></span>' : 'Nenhuma alteração pendente.'}` : 'Nenhum Excel aberto.'}<br>${S.handle ? 'O sistema grava direto neste arquivo e confere o resultado.' : S.data ? 'Neste navegador o Excel atualizado é baixado; substitua o original.' : ''}</p><div class="acts" style="justify-content:flex-start"><button class="btn" data-a="abrir">📂 Abrir outro Excel</button>${S.data ? '<button class="btn pri" data-a="salvar">💾 Salvar Excel</button>' : ''}</div></div>
    <div class="card"><h2>Backup e restauração</h2><p class="hint">O backup é uma cópia completa do Excel com data e hora. Para restaurar, escolha um backup: ele substitui os dados abertos (e só vai para o arquivo quando você salvar).</p><div class="acts" style="justify-content:flex-start"><button class="btn" data-a="backup" ${S.data ? '' : 'disabled'}>⬇ Fazer backup agora</button><button class="btn" data-a="restaurar" ${S.data ? '' : 'disabled'}>↩ Restaurar um backup</button></div></div></div>
    <div class="card"><h2>Segurança — limites</h2><p class="hint" style="margin:0">Este sistema não tem login: a proteção real é a do arquivo. Guarde o Excel em pasta corporativa com acesso restrito (a permissão da pasta controla quem vê os dados) e não envie backups por canais abertos. Não guarde CPF, RG, PIS, laudos ou CID. Dois usuários editando ao mesmo tempo podem sobrescrever um ao outro; o sistema avisa se o arquivo mudou desde que foi aberto.</p></div>`;
  }
  function ajuda() {
    $('#main').innerHTML = `<div class="ph"><h1>Ajuda</h1></div><div class="card"><h3 style="margin-top:0">Como usar</h3><ol><li><b>Abra o Excel</b> (menu Arquivo e backup ou tela inicial).</li><li><b>Colaboradores:</b> clique no nome para ver a ficha, agendar, registrar ASO ou gerar e-mails.</li><li><b>Comparar com a MMC:</b> carregue o relatório, revise as diferenças e aplique só o que quiser.</li><li><b>Comunicações:</b> o e-mail nasce como <i>Preparado</i>. Ao abrir no Outlook vira <i>Aberto no aplicativo</i>. Só vira <i>Envio confirmado</i> quando você clicar em confirmar.</li><li><b>Salvar Excel:</b> o aviso laranja no topo mostra se há alterações por salvar. Faça backup antes de mudanças grandes.</li></ol><h3>Regras dos exames</h3><p>O vencimento de cada exame é o "Refazer em" informado pela MMC/PCMSO. O sistema não calcula prazos pelo cargo: sem data informada, o exame aparece como <i>Sem informação</i>.</p><h3>Atalhos</h3><p>Ctrl+S salva o Excel.</p></div>`;
  }

  /* ---------- navegação e eventos ---------- */
  function render() {
    $('#nav').innerHTML = NAV.map(([k, l, i]) => `<button data-a="nav" data-v="${k}" class="${S.view === k ? 'on' : ''}">${ico(i)}${l}</button>`).join('');
    renderBar();
    if (S.data) $('#dlc').innerHTML = S.data.colaboradores.map(c => `<option value="${esc(c.matricula + ' — ' + c.nome)}"></option>`).join('');
    const v = S.view; if (!S.data && v !== 'arquivo' && v !== 'ajuda') return boasVindas();
    ({ painel, arquivo, ajuda, mmc: mmcView })[v] ? ({ painel, arquivo, ajuda, mmc: mmcView })[v]() : tabela(v);
  }
  const rowOf = v => { const [tn, k] = v.split('|'); return [tn, S.data[tn].find(r => String(r[T[tn].key]) === k)]; };
  const A = {
    nav: v => { S.view = v; fechar(); render(); }, abrir, salvar, backup, fechar, seguir: () => window.__go(),
    restaurar: () => $('#inr').click(), mmcArq: () => $('#inm').click(), mmcAplicar, ficha, novaCom, gerarCom, compor, salvarForm,
    novo: tn => form(tn, null, {}, null), editar: v => { const [tn, r] = rowOf(v); if (r) form(tn, r, null, null); },
    fEdit: m => form('colaboradores', S.data.colaboradores.find(c => c.matricula === m), null, () => ficha(m)),
    fNovo: v => { const [tn, m] = v.split('|'), pre = { matricula: m }, p = tn === 'agendamentos' && S.data.agendamentos.find(a => a.matricula === m && a.status === 'Agendado'); if (p) pre.tipo_exame = p.tipo_exame; form(tn, null, pre, () => ficha(m)); },
    fEditar: v => { const [tn, r] = rowOf(v); if (r) form(tn, r, null, () => ficha(r.matricula)); },
    cancelarForm: () => { const a = S.frm && S.frm.after; fechar(); if (a) a(); },
    cCopiar: async () => { lerCom(); try { await navigator.clipboard.writeText(S.cur.assunto + '\n\n' + S.cur.mensagem); toast('Texto copiado.'); } catch (e) { toast('Não foi possível copiar automaticamente: selecione e copie o texto.', 1); } },
    cMail: () => { lerCom(); const o = S.cur; setCom('Aberto no aplicativo'); abrirUrl(`mailto:${encodeURIComponent(o.destinatario).replace(/%40/g, '@').replace(/%2C/g, ',')}?${o.copia ? 'cc=' + encodeURIComponent(o.copia) + '&' : ''}subject=${encodeURIComponent(o.assunto)}&body=${encodeURIComponent(o.mensagem)}`); compor(o.id_com); toast('E-mail aberto no seu aplicativo. Depois de enviar, clique em "Confirmar que foi enviado".'); },
    cWhats: () => { lerCom(); const o = S.cur, col = S.data.colaboradores.find(c => c.matricula === o.matricula) || {}; let ph = String(o.canal === 'WhatsApp' ? o.destinatario : col.telefone || '').replace(/\D/g, ''); if (ph && ph.length <= 11) ph = '55' + ph; setCom('Aberto no aplicativo'); abrirUrl(`https://wa.me/${ph}?text=${encodeURIComponent(o.mensagem)}`); compor(o.id_com); toast('WhatsApp aberto. Depois de enviar, confirme aqui.'); },
    cConfirmar: () => { lerCom(); if (confirm('Confirma que esta mensagem foi realmente enviada?')) { setCom('Envio confirmado pelo RH'); compor(S.cur.id_com); toast('Envio registrado como confirmado.'); } },
    cSalvar: () => { lerCom(); fechar(); render(); }
  };
  document.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b && A[b.dataset.a]) A[b.dataset.a](b.dataset.v, b); });
  document.addEventListener('change', e => {
    const t = e.target; if (t.dataset.q) { S.q[t.dataset.q] = t.value; render(); } else if (t.dataset.f) { S.fl[t.dataset.f] = t.value; render(); } else if (t.dataset.sel) { const id = +t.dataset.sel; t.checked ? S.mmc.sel.add(id) : S.mmc.sel.delete(id); mmcView(); }
    else if (t.id === 'inp' && t.files[0]) { const f = t.files[0]; f.arrayBuffer().then(b => carregar(b, f.name, null, 0)); t.value = ''; }
    else if (t.id === 'inr' && t.files[0]) { const f = t.files[0]; f.arrayBuffer().then(async b => { await backup(); carregar(b, f.name, null, 0, true); }); t.value = ''; }
    else if (t.id === 'inm' && t.files[0]) { const f = t.files[0]; t.value = ''; mmcLer(f); }
  });
  document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); salvar(); } if (e.key === 'Escape') fechar(); });
  window.addEventListener('beforeunload', e => { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } });
  window.__app = { S, A, render, carregar };
  render();
})();
