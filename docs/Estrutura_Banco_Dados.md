# Estrutura do Banco de Dados (Excel)

Um único arquivo `.xlsx`. A **matrícula** liga as abas. Datas em dd/mm/aaaa. Cabeçalhos da linha 1 não podem ser renomeados.

## Colaboradores
Cadastro-base (1 linha por colaborador). A matrícula é o identificador único. Não armazena CPF, RG nem PIS.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Matrícula | texto | sim | identificador único |
| Nome completo | texto | sim |  |
| E-mail corporativo | texto | não |  |
| E-mail pessoal | texto | não |  |
| Telefone (WhatsApp) | texto | não |  |
| Empresa | texto | não |  |
| Filial | texto | não |  |
| Unidade | texto | não |  |
| Departamento | texto | não |  |
| Cargo | texto | não |  |
| Gestor | texto | não |  |
| Data de admissão | data | não |  |
| Situação | lista | sim | Ativo / Admissão pendente / Afastado / Desligado |
| Data de desligamento | data | não |  |
| Observações | texto longo | não |  |

## Exames
Um registro por exame do colaborador (admissional, periódico, complementar...). O vencimento vem da MMC/ASO/PCMSO — o sistema não calcula pelo cargo.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| ID do exame | texto | não | identificador único (gerado pelo sistema) |
| Matrícula | matrícula (relaciona com Colaboradores) | sim |  |
| Tipo de exame | lista | não | Admissional / Periódico / Retorno ao trabalho / Mudança de função / Demissional / Complementar |
| Exame | texto | sim |  |
| Último pedido | data | não |  |
| Data do resultado | data | não |  |
| Periodicidade (conforme PCMSO/MMC) | texto | não |  |
| Refazer em (vencimento) | data | não |  |
| Fonte da informação | lista | não | MMC / RH / ASO |
| Status informado pela MMC | texto | não |  |
| Observações | texto longo | não |  |

## Agendamentos
Agendamentos de exames. Reagendar cria uma nova linha e marca a anterior como "Reagendado" (histórico preservado).

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| ID do agendamento | texto | não | identificador único (gerado pelo sistema) |
| Matrícula | matrícula (relaciona com Colaboradores) | sim |  |
| Tipo de exame | lista | não | Admissional / Periódico / Retorno ao trabalho / Mudança de função / Demissional / Complementar |
| Data | data | não |  |
| Horário | texto | não |  |
| Clínica | lista | não | valores da aba Clinicas |
| Guia recebida | lista | não | Sim / Não |
| Status | lista | sim | Agendado / Realizado / Faltou / Reagendado / Cancelado |
| Reagendado de (ID) | texto | não |  |
| Observações | texto longo | não |  |

## ASOs
Controle documental dos ASOs. Guarda só a situação (apto/inapto) e o local do arquivo — nunca laudos ou CID.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| ID do ASO | texto | não | identificador único (gerado pelo sistema) |
| Matrícula | matrícula (relaciona com Colaboradores) | sim |  |
| Tipo de exame | lista | não | Admissional / Periódico / Retorno ao trabalho / Mudança de função / Demissional / Complementar |
| Data do ASO | data | não |  |
| Situação ocupacional | lista | não | Apto / Inapto / Apto com restrição |
| Recebido em | data | não |  |
| Local do arquivo (pasta/link) | texto | não |  |
| Observações | texto longo | não |  |

## Comunicacoes
Histórico de e-mails/WhatsApp. Status: Preparado → Aberto no aplicativo → Envio confirmado pelo RH.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| ID | texto | não | identificador único (gerado pelo sistema) |
| Matrícula | matrícula (relaciona com Colaboradores) | sim |  |
| Modelo | texto | não |  |
| Canal | lista | não | E-mail / WhatsApp |
| Destinatário | texto | não |  |
| Cópia | texto | não |  |
| Assunto | texto | não |  |
| Mensagem | texto longo | não |  |
| Status | lista | não | Preparado / Aberto no aplicativo / Envio confirmado pelo RH |
| Preparado em | texto | não |  |
| Envio confirmado em | texto | não |  |
| Responsável | texto | não |  |

## Modelos_Email
Modelos de comunicação. Campos dinâmicos entre chaves duplas, ex.: {{nome}}.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| ID | texto | não | identificador único (gerado pelo sistema) |
| Nome do modelo | texto | sim |  |
| Destinatário padrão | texto | não |  |
| Cópia padrão | texto | não |  |
| Assunto | texto | não |  |
| Mensagem | texto longo | não |  |

## Clinicas
Clínicas e prestadores (MMC e outras).

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| ID | texto | não | identificador único (gerado pelo sistema) |
| Nome | texto | sim |  |
| Endereço | texto | não |  |
| Telefone | texto | não |  |
| E-mail | texto | não |  |

## Campanhas
Campanhas de exames periódicos (Fase 2).

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| ID | texto | não | identificador único (gerado pelo sistema) |
| Nome | texto | sim |  |
| Início | data | não |  |
| Fim | data | não |  |
| Status | lista | não | Planejada / Em andamento / Encerrada |

## Campanha_Colab
Colaboradores incluídos em cada campanha (Fase 2).

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| ID | texto | não | identificador único (gerado pelo sistema) |
| ID da campanha | texto | sim |  |
| Matrícula | matrícula (relaciona com Colaboradores) | sim |  |
| Situação na campanha | texto | não |  |

## Divergencias_MMC
Registro das diferenças encontradas ao comparar o relatório da MMC com o banco, e a decisão tomada.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| ID | texto | não | identificador único (gerado pelo sistema) |
| Data da importação | texto | não |  |
| Matrícula | texto | não |  |
| Nome | texto | não |  |
| Exame | texto | não |  |
| Campo | texto | não |  |
| Valor no banco | texto | não |  |
| Valor na MMC | texto | não |  |
| Decisão | lista | não | Aplicado / Ignorado |

## Log_Alteracoes
Trilha de auditoria: toda criação/alteração feita pelo sistema (quem, quando, o quê, antes e depois).

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Data/hora | texto | não |  |
| Usuário | texto | não |  |
| Tabela | texto | não |  |
| Chave | texto | não |  |
| Ação | texto | não |  |
| Campo | texto | não |  |
| Antes | texto | não |  |
| Depois | texto | não |  |

## Configuracoes
Parâmetros: responsavel_rh, empresa_nome, email_mmc, dias_alerta.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Parâmetro | texto | sim | identificador único |
| Valor | texto | não |  |

