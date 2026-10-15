// Uso: node ferramentas/gerar_modelo.js   (requer: npm i exceljs)
const fs = require('fs'), path = require('path'), Core = require('../js/core.js');
const base = new Date(Date.UTC(2026, 9, 15));
const dia = n => new Date(base.getTime() + n * 864e5).toISOString().slice(0, 10);
const D = {}; Object.keys(Core.T).forEach(k => D[k] = []);
const cols = [
  ['1001', 'Ana Beatriz Souza', 'Sorocaba', 'Operações', 'Analista de Operações', 'Carlos Menezes', -900],
  ['1002', 'Bruno Henrique Lima', 'Sorocaba', 'Operações', 'Assistente de Operações', 'Carlos Menezes', -700],
  ['1003', 'Camila Ferreira Alves', 'Sorocaba', 'Financeiro', 'Analista Financeiro', 'Débora Nunes', -1500],
  ['1004', 'Diego Martins Rocha', 'Campinas', 'Tecnologia', 'Desenvolvedor', 'Eduardo Pires', -400],
  ['1005', 'Elisa Cardoso Pinto', 'Campinas', 'Tecnologia', 'Analista de Suporte', 'Eduardo Pires', -1200],
  ['1006', 'Fábio Teixeira Dias', 'Campinas', 'Comercial', 'Executivo de Contas', 'Fernanda Rocha', -300],
  ['1007', 'Gabriela Moura Costa', 'Sorocaba', 'RH', 'Assistente de RH', 'Débora Nunes', -2000],
  ['1008', 'Henrique Barros Neto', 'Sorocaba', 'Operações', 'Técnico de Campo', 'Carlos Menezes', -1800],
  ['1009', 'Isabela Ramos Vieira', 'Campinas', 'Comercial', 'Analista Comercial', 'Fernanda Rocha', -100],
  ['1010', 'João Pedro Gomes', 'Sorocaba', 'Financeiro', 'Auxiliar Financeiro', 'Débora Nunes', -60],
  ['2001', 'Carlos Menezes', 'Sorocaba', 'Operações', 'Gerente de Operações', 'Diretoria', -3000],
  ['2002', 'Débora Nunes', 'Sorocaba', 'Administrativo', 'Gerente Administrativa', 'Diretoria', -2800],
  ['2003', 'Eduardo Pires', 'Campinas', 'Tecnologia', 'Gerente de Tecnologia', 'Diretoria', -2500],
  ['2004', 'Fernanda Rocha', 'Campinas', 'Comercial', 'Gerente Comercial', 'Diretoria', -2600]];
cols.forEach(([m, n, u, d, cg, g, adm]) => D.colaboradores.push({ matricula: m, nome: n, email_corp: n.split(' ')[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') + '.' + m + '@empresa-ficticia.com.br', email_pessoal: 'pessoal' + m + '@exemplo.com', telefone: '(15) 99999-' + m, empresa: 'Empresa Fictícia S.A.', filial: u === 'Sorocaba' ? '01' : '02', unidade: u, departamento: d, cargo: cg, gestor: g, data_admissao: dia(adm), situacao: 'Ativo', data_desligamento: '', obs: '' }));
D.colaboradores.push({ matricula: '3001', nome: 'Lucas Andrade Prado (candidato)', email_corp: '', email_pessoal: 'lucas.prado@exemplo.com', telefone: '(15) 98888-3001', empresa: 'Empresa Fictícia S.A.', filial: '01', unidade: 'Sorocaba', departamento: 'Operações', cargo: 'Analista de Operações', gestor: 'Carlos Menezes', data_admissao: dia(12), situacao: 'Admissão pendente', data_desligamento: '', obs: 'Exemplo de admissão em andamento' });
// vencimentos informados (fictícios) — simulam o "Refazer em" da MMC
const venc = { 1001: 200, 1002: 20, 1003: -15, 1004: 80, 1005: -90, 1006: 5, 1007: 300, 1008: 45, 1009: 150, 2001: 10, 2002: 400, 2003: 55 };
Object.entries(venc).forEach(([m, v]) => D.exames.push({ id_exame: Core.nextId(D, 'exames'), matricula: m, tipo_exame: 'Periódico', exame: 'Exame Clínico', ultimo_pedido: dia(v - 365), data_resultado: dia(v - 360), periodicidade: '12 meses', data_vencimento: dia(v), fonte: 'MMC', status_mmc: v < 0 ? 'Vencido' : 'Em dia', obs: '' }));
D.exames.push({ id_exame: Core.nextId(D, 'exames'), matricula: '1008', tipo_exame: 'Complementar', exame: 'Audiometria', ultimo_pedido: dia(-340), data_resultado: dia(-335), periodicidade: '6 meses', data_vencimento: dia(-150), fonte: 'MMC', status_mmc: 'Vencido', obs: 'Exposição a ruído (exemplo)' });
D.exames.push({ id_exame: Core.nextId(D, 'exames'), matricula: '1010', tipo_exame: 'Admissional', exame: 'Exame Clínico', ultimo_pedido: dia(-60), data_resultado: dia(-58), periodicidade: '', data_vencimento: '', fonte: 'RH', status_mmc: '', obs: 'Vencimento ainda não informado pela MMC' });
D.clinicas.push({ id_clinica: 'CLI-0001', nome: 'MMC Medicina Ocupacional (fictícia)', endereco: 'Rua Exemplo, 123 - Centro - Sorocaba/SP', telefone: '(15) 3333-0000', email: 'agendamento@mmc-ficticia.com.br' });
D.agendamentos.push(
  { id_agend: 'AG-0001', matricula: '1002', tipo_exame: 'Periódico', data: dia(7), horario: '08:30', clinica: D.clinicas[0].nome, guia_recebida: 'Sim', status: 'Reagendado', reagendado_de: '', obs: 'Reagendado a pedido do colaborador' },
  { id_agend: 'AG-0002', matricula: '1002', tipo_exame: 'Periódico', data: dia(14), horario: '10:00', clinica: D.clinicas[0].nome, guia_recebida: 'Sim', status: 'Agendado', reagendado_de: 'AG-0001', obs: '' },
  { id_agend: 'AG-0003', matricula: '1003', tipo_exame: 'Periódico', data: dia(-5), horario: '09:00', clinica: D.clinicas[0].nome, guia_recebida: 'Sim', status: 'Realizado', reagendado_de: '', obs: 'ASO ainda não recebido' },
  { id_agend: 'AG-0004', matricula: '3001', tipo_exame: 'Admissional', data: dia(5), horario: '14:00', clinica: D.clinicas[0].nome, guia_recebida: 'Sim', status: 'Agendado', reagendado_de: '', obs: '' });
D.asos.push({ id_aso: 'ASO-0001', matricula: '1001', tipo_exame: 'Periódico', data_aso: dia(-165), situacao: 'Apto', recebido_em: dia(-160), caminho: '\\\\servidor\\RH\\ASOs\\2026\\1001_ASO.pdf', obs: 'Caminho de exemplo' });
const M = (n, d, a, m) => D.modelos.push({ id_modelo: 'MOD-' + String(D.modelos.length + 1).padStart(4, '0'), nome: n, destinatario: d, copia: '', assunto: a, mensagem: m + '\n\nAtenciosamente,\n{{responsavel}}\n{{empresa}}' });
M('Solicitação de exame admissional (MMC)', '{{email_mmc}}', 'Solicitação de agendamento - exame admissional - {{nome}}', 'Prezados,\n\nSolicitamos o agendamento do exame admissional do(a) candidato(a):\n\nNome: {{nome}}\nCargo: {{cargo}}\nUnidade: {{unidade}}\nData prevista de admissão: {{data_admissao}}\nE-mail: {{email_pessoal}}\nTelefone: {{telefone}}\n\nFicamos no aguardo da guia e da confirmação de data e horário.');
M('Envio da guia ao candidato', '{{email_pessoal}}', 'Guia do exame admissional - {{empresa}}', 'Olá, {{nome}}!\n\nSegue em anexo a guia do seu exame {{tipo_exame}}.\n\nData: {{data}}\nHorário: {{horario}}\nLocal: {{clinica}}\nEndereço: {{endereco}}\n\nLeve um documento com foto. Após o exame, envie ao RH o comprovante/ASO.');
M('Confirmação do agendamento', '{{email_pessoal}}', 'Agendamento confirmado - {{tipo_exame}}', 'Olá, {{nome}}!\n\nSeu exame {{tipo_exame}} está confirmado:\n\nData: {{data}}\nHorário: {{horario}}\nLocal: {{clinica}} - {{endereco}}');
M('Lembrete de exame agendado', '{{email_corp}}', 'Lembrete: exame {{tipo_exame}} em {{data}}', 'Olá, {{nome}}!\n\nLembramos que você tem exame agendado em {{data}} às {{horario}}, na {{clinica}} ({{endereco}}).');
M('Convocação para exame periódico', '{{email_corp}}', 'Convocação para exame periódico - {{nome}}', 'Olá, {{nome}}!\n\nSeu exame periódico vence em {{vencimento}}. Pedimos que realize o exame o quanto antes.\n\nO agendamento será confirmado pelo RH com a clínica.');
M('Cobrança de exame não realizado', '{{email_corp}}', 'Pendência: exame ocupacional - {{nome}}', 'Olá, {{nome}}!\n\nIdentificamos que seu exame ocupacional (vencimento: {{vencimento}}) ainda está pendente. Pedimos que entre em contato com o RH para regularizar.');
M('Solicitação de reagendamento', '{{email_mmc}}', 'Solicitação de reagendamento - {{nome}}', 'Prezados,\n\nSolicitamos o reagendamento do exame de {{nome}} (matrícula {{matricula}}), atualmente marcado para {{data}} às {{horario}}.');
M('Comunicação de ausência ao exame', '{{email_corp}}', 'Ausência ao exame agendado - {{nome}}', 'Olá, {{nome}}!\n\nConstatamos sua ausência ao exame {{tipo_exame}} agendado para {{data}}. Entre em contato com o RH para reagendarmos.');
M('Cobrança de ASO pendente (MMC)', '{{email_mmc}}', 'ASO pendente - {{nome}} (mat. {{matricula}})', 'Prezados,\n\nO exame de {{nome}} foi realizado em {{data}}, mas ainda não recebemos o ASO. Pedimos o envio assim que possível.');
M('Correção de informações (parceiro)', '{{email_mmc}}', 'Solicitação de correção - {{nome}} (mat. {{matricula}})', 'Prezados,\n\nIdentificamos divergência nas informações de {{nome}} em seu relatório. Pedimos a conferência e correção dos dados:\n\n[descreva a divergência]');
M('Pendências da equipe (gestor)', '{{gestor_email}}', 'Pendências de exames ocupacionais da sua equipe', 'Olá, {{gestor}}!\n\nPendências de exames ocupacionais na sua equipe:\n\n{{pendencias}}\n\nContamos com seu apoio para que os colaboradores regularizem.');
M('Conclusão de campanha', '{{email_corp}}', 'Campanha de exames concluída', 'Olá, {{nome}}!\n\nConfirmamos a conclusão do seu exame na campanha de exames periódicos. Obrigado!');
D.campanhas.push({ id_campanha: 'CAM-0001', nome: 'Campanha de Setembro 2026', inicio: '2026-09-01', fim: '2026-09-30', status: 'Encerrada' }, { id_campanha: 'CAM-0002', nome: 'Campanha de Novembro 2026', inicio: '2026-11-01', fim: '2026-11-30', status: 'Planejada' });
[['responsavel_rh', 'Equipe de RH'], ['empresa_nome', 'Empresa Fictícia S.A.'], ['email_mmc', 'agendamento@mmc-ficticia.com.br'], ['dias_alerta', '30']].forEach(([chave, valor]) => D.config.push({ chave, valor }));
Core.log(D, 'Sistema', 'config', '', 'Modelo criado com dados fictícios');
(async () => {
  const out = process.argv[2] || path.join(__dirname, '..', 'modelo', 'Banco_Dados_Exames_RH.xlsx');
  fs.writeFileSync(out, await Core.toBuffer(D));
  fs.writeFileSync(path.join(__dirname, '..', 'docs', 'Estrutura_Banco_Dados.md'), Core.docMd());
  console.log('OK', out);
})();
