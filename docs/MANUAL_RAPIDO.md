# Manual rápido — Fase 1

## Publicar no GitHub Pages
1. Crie um repositório e envie TODO o conteúdo desta pasta, **exceto** `node_modules` e qualquer Excel com dados reais.
2. Settings → Pages → Branch `main` / pasta raiz. O sistema abre em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.
3. Alternativa sem internet: abrir `index.html` direto no Chrome/Edge (o salvamento direto no arquivo funciona melhor via Pages/https).
**Nunca** envie o Excel com dados reais ao repositório — ele fica no seu computador/pasta corporativa.

## Dia a dia
1. Abra o sistema → **Abrir meu Excel** (comece com `modelo/Banco_Dados_Exames_RH.xlsx`; apague os exemplos fictícios).
2. Painel: indicadores e alertas. Colaboradores → clique no nome → ficha (+ Exame, + Agendar/Reagendar, + ASO, ✉ e-mail).
3. **Comparar com a MMC**: escolha o tipo, carregue o relatório, revise, desmarque o que não quiser, aplique.
4. **Comunicações**: Gerar → (editar) → Abrir no e-mail/WhatsApp → **Confirmar que foi enviado**.
5. **Salvar Excel** (Ctrl+S). Laranja = há alterações não salvas. Backup: menu *Arquivo e backup*.

## Preenchimento do Excel
Veja `Estrutura_Banco_Dados.md`. Matrícula obrigatória e única; vencimento ("Refazer em") vem da MMC/PCMSO; não coloque CPF/RG/PIS/laudos/CID.

## Testes (opcional, para TI)
`npm i exceljs jsdom` → `node testes/teste_core.js` e `node testes/teste_ui.js`. Para regenerar o modelo: `node ferramentas/gerar_modelo.js`.
