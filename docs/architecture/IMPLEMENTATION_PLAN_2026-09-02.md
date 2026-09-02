# Plano de implementação — save, conta e ícones

## Objetivo

Corrigir os bloqueadores de confiabilidade identificados no playtest e na auditoria read-only do Prompt 0, mantendo PostgreSQL como autoridade das investigações autenticadas e preservando a linguagem visual de Vesper.

Decisões relacionadas:

- `0012` — PostgreSQL é a autoridade das investigações autenticadas;
- `0013` — Checkpoints precisos e gestão segura da conta;
- `0014` — Sistema central de ícones Lucide.

## Ordem e paralelismo

| Frente | Pode rodar em paralelo? | Propriedade principal |
|---|---:|---|
| 1. Backend de execução e autenticação | Sim, com a frente 3 | `server/api.mjs`, `server.mjs`, `server/schema.sql`, testes de integração |
| 2. Save preciso no cliente | Depois da frente 1 | `GameState`, `SceneEngine`, `main.js`, ações de save em `AppUI` |
| 3. Fundação de ícones | Sim, com a frente 1 | `src/ui/icons.js`, dependências, documentação visual |
| 4. Conta e perfil no frontend | Depois das frentes 1, 2 e 3 | `ApiClient`, conta em `AppUI`, integração em `main.js` |
| 5. Revisão final | Depois de todas | somente leitura, validação e E2E |

Use worktrees ou branches separados para tarefas paralelas. Se os chats compartilharem a mesma pasta, execute as frentes sequencialmente.

## Registro de execução

### 2026-09-02 — frentes 1 e 3

- Frente 3 — fundação de ícones: implementação concluída, com `src/ui/icons.js`, teste automatizado e documentação. A integração visual nos componentes ainda pertence à frente 4.
- Frente 1 — backend: handlers duplicados revisados e removidos; `node --check server/api.mjs` passou; integração PostgreSQL executada com sucesso.
- `npm run validate` passou dentro do container com PostgreSQL: 14 testes aprovados e nenhum ignorado.

### 2026-09-02 — frente 4

- Área de conta no frontend integrada com consulta de usuário, alteração de username, troca voluntária/obrigatória de senha e logout dentro do controle de conta.
- Cadastro, login e alteração de senha agora exibem confirmação e controle acessível de mostrar/esconder senha; username usa validação de formato no formulário.
- `npm run validate`: 18 testes aprovados e 1 teste PostgreSQL ignorado por ausência de `TEST_DATABASE_URL`.
- `npm run test:ui`: 7 testes aprovados, incluindo conta em viewport estreito e confirmação de senha.

### 2026-09-02 — Prompt 5: revisão integrada

- A frente 4 foi considerada implementada e seus fluxos principais passaram no E2E: `npm run test:ui` com 7/7.
- A integração PostgreSQL passou com 1/1; a validação completa dentro do container passou com 19/19, sem testes ignorados.
- A revisão final não foi aprovada. Foram encontrados 1 CRITICAL, 5 IMPORTANT e 1 POLISH, concentrados em autoridade da conclusão, concorrência/revisão, `pagehide`, validação de eventos, confirmação server-side de senha e glifos Unicode.
- Não foram alterados arquivos durante o Prompt 5. A entrega permanece aberta até o hardening do Prompt 6 e sua nova revisão.
- Ainda faltam testes reais entre dispositivos, reload durante flush ativo, falha online de conclusão e HTTPS real.

## Critérios comuns para todo agente

- ler `docs/INDEX.md` e os documentos roteados antes de editar;
- respeitar `src/AGENTS.md` quando tocar `src/`;
- não mover conteúdo narrativo para código;
- não expor seed, revisão, snapshot ou outros metadados técnicos na HUD;
- adicionar testes proporcionais à alteração;
- preservar alterações existentes e não usar `git reset --hard` ou `git checkout --`;
- executar `npm run validate` antes de entregar;
- informar arquivos alterados, testes executados, testes não possíveis e riscos restantes.

## Prompt 1 — backend de execução e autenticação

```text
Corrija primeiro os contratos de backend de execução e autenticação do Vesper.

Leia:
- docs/INDEX.md
- docs/architecture/PLATFORM_ARCHITECTURE.md
- docs/architecture/ENGINE_ARCHITECTURE.md
- docs/architecture/CONTENT_MODEL.md
- docs/decisions/0012-postgres-owns-authenticated-case-runs.md
- docs/decisions/0013-precise-checkpoints-and-account-management.md
- src/AGENTS.md

Esta frente é dona de:
- server/api.mjs
- server.mjs
- server/schema.sql, se necessário
- tests/platform-api.integration.test.mjs
- novos testes de backend

Não altere GameState, SceneEngine, main.js, AppUI.js ou icons.js.

Implemente e teste:

1. RunEnvelope e snapshot versionado.
   - escolha uma versão explícita;
   - faça migração/fallback seguro para snapshots legados;
   - valide os campos necessários sem tornar recompensas do cliente autoritativas;
   - preserve eventos append-only e idempotentes.

2. Vinculação estrita da execução.
   - runId, caseId, routeId, languageId e contentVersion precisam coincidir com a linha do banco;
   - rejeite payload cruzando caso, rota, linguagem ou usuário;
   - valide revisão otimista;
   - em conflito, não aplique snapshot nem eventos parcialmente.

3. Ciclo de execução.
   - /runs/start cria execução somente quando não há ativa;
   - /runs/current retorna a execução correta;
   - /runs/restart arquiva a execução anterior e cria a próxima atomicamente;
   - restart deve aceitar e persistir, na mesma transação, o snapshot/eventos finais já recebidos;
   - eventos e respostas da tentativa arquivada devem continuar disponíveis ao mentor;
   - conclusão deve permanecer server-authoritative.

4. Autenticação.
   - cadastro com usuário normalizado, senha mínima de 8 e código de turma obrigatório;
   - login com as mesmas credenciais após cadastro;
   - logout idempotente;
   - troca de senha temporária;
   - troca voluntária de senha com senha atual e confirmação quando aplicável;
   - nenhuma resposta pode incluir password_hash;
   - sessão corrente deve permanecer válida conforme o contrato;
   - invalidar sessões antigas quando a política exigir.

5. Conta.
   - adicione contrato server-side para alteração de username;
   - normalize e valide username;
   - rejeite duplicidade com erro 409;
   - atualize a identidade exibida sem quebrar saves namespaced por userId;
   - exija autenticação e confirmação adequada para alteração sensível.

6. Cookies e disponibilidade.
   - Secure em HTTPS e não em HTTP local;
   - investigue COOKIE_SECURE sem registrar tokens ou senhas;
   - o servidor deve conseguir servir o Hub quando o banco estiver indisponível, retornando 503 na API e mantendo iniciar/retomar/autenticar bloqueados;
   - não desabilite segurança em produção para fazer o teste passar.

7. Adicione integração PostgreSQL para:
   - cadastro → logout → login;
   - troca de senha e login posterior;
   - reset temporário;
   - runId de Caso A com payload de Caso B;
   - rota e linguagem incompatíveis;
   - snapshot inválido;
   - conflito de revisão;
   - restart com eventos;
   - username duplicado;
   - cookie/sessão.

Rode npm run validate. Se TEST_DATABASE_URL não estiver disponível, diga exatamente quais testes ficaram pendentes.
```

## Prompt 2 — save preciso no cliente

```text
Depois que a frente 1 estiver integrada, corrija o save e a retomada precisa no cliente Vesper.

Leia:
- docs/INDEX.md
- docs/architecture/ENGINE_ARCHITECTURE.md
- docs/architecture/PLATFORM_ARCHITECTURE.md
- docs/decisions/0012-postgres-owns-authenticated-case-runs.md
- docs/decisions/0013-precise-checkpoints-and-account-management.md
- src/AGENTS.md

Leia as alterações atuais do backend antes de editar.

Esta frente é dona de:
- src/engine/GameState.js
- src/engine/SceneEngine.js
- src/main.js
- src/ui/AppUI.js, somente nos fluxos de Hub, iniciar, retomar, salvar e sair e reiniciar;
- tests/game-state-persistence.test.mjs
- tests/ui/auth-save-flow.spec.mjs

Não reescreva a área de conta nem altere server/api.mjs.

Requisitos:

1. O snapshot deve guardar caso, rota, linguagem, versão, sala, flags, pistas, inventário, personagens, relações, presença, tentativas, dicas, desafios, final, jogador, timestamps e cursor narrativo.

2. O cursor deve representar mode, sceneId, nextEventIndex, sceneStack quando necessário e desafio pendente determinístico.

3. Salvar na segunda fala, durante escolha e na entrada de ritual deve permitir retomar exatamente o estado correto. Não marque interação once antes de garantir que a cena foi iniciada de forma retomável.

4. Não salve a cada caractere, wait ou frame; use checkpoints estáveis antes/depois de estados interativos.

5. Continue deve reabrir cena, diálogo, escolha, ritual ou final conforme o cursor. renderRoom() sozinho não é uma retomada válida quando existe cena pendente.

6. Iniciar após autenticação deve distinguir:
   - nova investigação sem execução ativa;
   - retomada de execução existente;
   - nova tentativa explicitamente confirmada.

7. Reiniciar deve enviar o estado final necessário ao endpoint novo, aguardar confirmação, anexar a nova execução e só então iniciar do ponto inicial. Não depender de reload que leve ao Hub sem uma ação clara.

8. Uma execução de outro caso ou rota nunca pode ser reutilizada. A seleção de outro caso deve mostrar seu próprio iniciar/retomar.

9. Corrija corrida entre flush ativo, alterações durante o flush, pagehide e revisão otimista. Falhas devem permanecer visíveis.

10. Após iniciar uma execução online, marque corretamente o estado como server-authoritative.

Adicione testes para round-trip de snapshot, introdução interrompida, escolha, ritual, inventário, flags, troca de caso, restart, concorrência e erro de sincronização.

Rode npm run validate e npm run test:ui quando houver ambiente disponível.
```

## Prompt 3 — fundação central de ícones

```text
Em paralelo com a frente 1, crie a fundação de ícones do Vesper.

Leia:
- docs/INDEX.md
- docs/art/ART_DIRECTION.md
- docs/art/UI_REFERENCE.md
- docs/art/ASSET_MANIFEST.md
- docs/feedback/REJECTED_PATTERNS.md
- docs/decisions/0014-lucide-icon-system.md

Esta frente é dona de:
- src/ui/icons.js
- docs/art/ICON_LIBRARY.md
- package.json/package-lock.json, se necessário
- estilos genéricos de ícone, somente se necessário

Não altere AppUI.js ou main.js.

Use Lucide como fonte visual, mas implemente um registro local e determinístico, sem CDN em runtime. Fonte: https://lucide.dev/ — licença ISC.

Crie helper central para pelo menos:
user-round, log-out, eye, eye-off, save, rotate-ccw, backpack, book-open, settings-2, chevron-right, arrow-left, x, shield-check e play.

Regras:
- nenhum emoji ou glifo Unicode como substituto;
- SVGs não devem ser copiados manualmente em cada componente;
- ícone isolado precisa de aria-label/tooltip;
- ícones complementam texto importante;
- visual fino, discreto, sóbrio e coerente com terror investigativo;
- documente origem, licença, nomes e convenções;
- adicione teste para nome inexistente.

Rode npm run validate.
```

## Prompt 4 — área de conta e perfil no frontend

```text
Depois das frentes 1, 2 e 3, implemente a área básica de conta do Vesper.

Leia:
- docs/INDEX.md
- docs/architecture/PLATFORM_ARCHITECTURE.md
- docs/architecture/ENGINE_ARCHITECTURE.md
- docs/art/ART_DIRECTION.md
- docs/art/UI_REFERENCE.md
- docs/feedback/REJECTED_PATTERNS.md
- docs/decisions/0013-precise-checkpoints-and-account-management.md
- docs/decisions/0014-lucide-icon-system.md
- src/AGENTS.md

Leia o diff atual antes de editar. Preserve o código de save e retomada da frente 2.

Esta frente é dona de:
- src/engine/ApiClient.js
- src/ui/AppUI.js, na área de conta/autenticação;
- src/main.js, somente na integração da conta;
- testes Playwright e testes de API necessários.

Requisitos:

1. O botão superior direito deve abrir “Minha conta”, mostrando o usuário atual, e ter logout como ação separada.

2. A conta deve permitir:
   - consultar usuário;
   - alterar username;
   - alterar senha;
   - confirmar ações sensíveis;
   - exibir sucesso/erro;
   - sair do Arquivo.

3. Alteração de username deve validar formato, normalizar, tratar duplicidade e não quebrar saves por userId.

4. Todos os fluxos de senha devem ter:
   - senha atual quando aplicável;
   - nova senha;
   - confirmação da nova senha;
   - botão olho usando src/ui/icons.js;
   - autocomplete apropriado;
   - nenhum valor persistido.

5. Cadastro e troca obrigatória de senha também devem ter confirmação e mostrar/esconder acessível.

6. Não reintroduza logout único nem transforme o Hub em dashboard. Preserve fundo, hierarquia, leitura e viewport estreito.

7. Teste:
   - cadastro;
   - login posterior;
   - logout;
   - alteração de username;
   - username duplicado;
   - confirmação de senha incorreta;
   - mostrar/esconder senha;
   - troca de senha e novo login;
   - retomada de investigação sem regressão.

Rode npm run validate e npm run test:ui.
```

## Prompt 5 — revisão integrada final

```text
Faça uma revisão final read-only do Vesper após as frentes 1–4.

Use a skill vesper-content-review e leia:
- docs/INDEX.md
- docs/decisions/0012-postgres-owns-authenticated-case-runs.md
- docs/decisions/0013-precise-checkpoints-and-account-management.md
- docs/decisions/0014-lucide-icon-system.md
- docs/architecture/IMPLEMENTATION_PLAN_2026-09-02.md
- docs/art/ART_DIRECTION.md
- docs/art/UI_REFERENCE.md
- docs/feedback/REJECTED_PATTERNS.md

Revise o diff inteiro e teste:

1. cadastro → logout → login;
2. troca de senha → login posterior;
3. reset temporário → troca obrigatória;
4. iniciar caso novo;
5. salvar na introdução;
6. retomar exatamente na fala/evento correto;
7. preservar sala, inventário, flags, pistas, personagens e relações;
8. reiniciar criando nova tentativa e preservando a anterior;
9. trocar de caso/rota sem misturar saves;
10. reload durante cena, escolha e ritual;
11. conta e logout separado;
12. desktop e viewport estreito;
13. ausência de emoji/glifos fora da biblioteca;
14. ausência de seed/revisão/snapshot na HUD.

Rode:
- npm run validate
- npm run test:ui
- integração PostgreSQL com TEST_DATABASE_URL

Não altere arquivos. Entregue CRITICAL / IMPORTANT / POLISH, com evidência de arquivo, teste e risco restante. Registre testes impossíveis por falta de ambiente.
```

## Registro de execucao — Prompt 2

- GameState agora emite snapshot versionado com cursor narrativo, aliases de selecao e cache local sem preferencias audiovisuais no payload remoto.
- SceneEngine grava checkpoints estaveis e retoma explore, cena, escolha, ritual e final, incluindo cenas compostas e desafio deterministico.
- Hub/start/continue/restart foram integrados sem misturar casos ou rotas; restart preserva o estado final e inicia a nova tentativa apos confirmacao.
- Flush concorrente e pagehide foram protegidos contra perda/duplicacao silenciosa; falhas continuam visiveis na HUD.
- `npm run validate` e `npm run test:ui` passaram; a integracao PostgreSQL permanece dependente de `TEST_DATABASE_URL`.

### Revisao independente da frente 2

- `npm run test:ui`: 5 testes aprovados.
- `npm run validate`: 18 testes aprovados e 1 teste PostgreSQL ignorado por ausencia de `TEST_DATABASE_URL` no processo local.
- `git diff --check`: passou.
- Nenhum achado CRITICAL ou IMPORTANT novo na revisao de estado, cursor, retomada e UI.
- A regressao PostgreSQL deve ser repetida depois da integracao final das frentes seguintes.

## Checklist de acompanhamento

- [x] Frente 1 limpa de handlers duplicados e validada com PostgreSQL real
- [x] Frente 2 integrada sem regressão de tracks ou conteúdo
- [x] Frente 3 implementada e documentada; integração parcial feita na conta, com glifos restantes para o hardening
- [x] Frente 4 integrada com testes de conta
- [x] `npm run validate` passou após a integração
- [x] `npm run test:ui` passou com servidor disponível (7/7)
- [x] Integração PostgreSQL e `npm run validate` passaram no container com `TEST_DATABASE_URL` (19/19, sem skips)
- [ ] teste de restauração/retomada em outro dispositivo executado
- [x] decisão e `CURRENT_STATE.md` atualizados após a entrega
- [x] revisão `vesper-content-review` sem CRITICAL ou IMPORTANT aberto
- [x] hardening pós-revisão aplicado e revalidado
- [ ] cenários de falha online, flush ativo/pagehide e HTTPS real exercitados

## Prompt 6 — hardening pós-revisão final

Envie este prompt em um único chat, depois que as frentes 1–4 já estiverem integradas. Ele é sequencial porque altera contratos que atravessam backend, cliente e testes.

```text
Corrija os achados CRITICAL e IMPORTANT da revisão do Prompt 5 no Vesper. Esta é uma tarefa de hardening; não reescreva as frentes já implementadas e não altere conteúdo narrativo sem necessidade.

Leia antes de editar:
- docs/INDEX.md
- docs/architecture/ENGINE_ARCHITECTURE.md
- docs/architecture/PLATFORM_ARCHITECTURE.md
- docs/architecture/CONTENT_MODEL.md
- docs/decisions/0012-postgres-owns-authenticated-case-runs.md
- docs/decisions/0013-precise-checkpoints-and-account-management.md
- docs/decisions/0014-lucide-icon-system.md
- docs/architecture/IMPLEMENTATION_PLAN_2026-09-02.md
- docs/CURRENT_STATE.md
- src/AGENTS.md

Use vesper-content-review ao final. Leia o diff atual inteiro antes de editar.

Escopo permitido:
- server/api.mjs, server.mjs e testes de API/integrados;
- src/engine/ApiClient.js, src/engine/GameState.js, src/engine/SceneEngine.js;
- src/main.js e src/ui/AppUI.js;
- src/ui/icons.js, somente para completar nomes realmente usados;
- testes unitários/E2E e documentação de acompanhamento.

1. Conclusão server-authoritative
   - Em uma execução autenticada/online, não marque `caseCompleted` localmente nem exiba um final confirmado antes de `/api/runs/complete` responder com sucesso.
   - Se a conclusão falhar, mantenha a execução retomável, mostre erro persistente e ofereça retry explícito; não trate `console.warn` como confirmação.
   - O servidor deve decidir a conclusão, ending válido e recompensas. Não aceite `caseCompleted` do snapshot de sync como autoridade.
   - Preserve um fluxo offline/demo apenas se ele já existir e estiver claramente separado do fluxo online.

2. Revisão otimista na conclusão
   - `ApiClient.completeCase` deve enviar `revision`, `contentVersion` e os identificadores do envelope atual.
   - `/api/runs/complete` deve aplicar CAS/validação de revisão como os demais endpoints; payload obsoleto deve retornar conflito sem sobrescrever snapshot mais novo.
   - Adicione teste de conclusão concorrente/obsoleta.

3. Flush e pagehide
   - Revise a corrida entre flush ativo e `pagehide`. Não descarte silenciosamente o último estado quando já houver request em andamento.
   - Use a estratégia compatível com o contrato atual (coordenação de revisão, `sendBeacon`/`keepalive` e retry seguro, conforme aplicável), sem duplicar eventos nem aceitar snapshot antigo.
   - Adicione teste determinístico para alteração durante flush, pagehide e recuperação após falha. Se o navegador limitar a garantia, documente o limite e o estado visível ao usuário.

4. Eventos não confiáveis do cliente
   - Um `story_choice`, `clue_found` ou evento equivalente forjado/repetido não pode criar relações, recompensas ou outros efeitos server-side apenas por estar no snapshot enviado pelo cliente.
   - Valide tipo, identidade, ordem, idempotência e compatibilidade com o estado/cursor permitido; use chaves determinísticas de aplicação, não IDs aleatórios como única proteção.
   - Se a validação completa depender de uma ação específica, remova o efeito do sync genérico ou crie o menor endpoint autoritativo necessário.
   - Adicione testes para `clue_found` forjado, repetição com novo ID e `story_choice` fora de ordem.

5. Confirmação de senha no servidor
   - `/api/auth/register` deve validar `confirmPassword` server-side, com erro claro e sem persistir conta em caso de divergência.
   - Cubra cadastro válido, confirmação divergente e login posterior.

6. Biblioteca de ícones
   - Substitua em `src/ui` os glifos Unicode de interface (`∴`, `→`, `←`, `×` e equivalentes) por `icon()`/`createIcon()` do registro local.
   - Se faltar um nome semântico, adicione-o ao registro e teste-o. Não use emoji, glifo ou SVG duplicado como atalho.
   - Garanta que ícones isolados tenham nome acessível e que texto importante continue textual.

7. Documentação e verificação
   - Corrija as contradições antigas em `docs/CURRENT_STATE.md` e registre o resultado desta execução no plano.
   - Rode `npm run validate`, `npm run test:ui`, `git diff --check` e a integração PostgreSQL com `TEST_DATABASE_URL` dentro do container.
   - Faça uma revisão final read-only e reporte CRITICAL / IMPORTANT / POLISH, incluindo explicitamente os testes ainda impossíveis: multi-dispositivo real, reload durante flush ativo e HTTPS real, caso continuem fora do ambiente.
   - Não declare a tarefa concluída se permanecer qualquer CRITICAL ou IMPORTANT.
```

### Registro de execução — Prompt 6

- conclusão online passou a depender da resposta de `/api/runs/complete`; falhas mantêm a execução ativa, exibem estado persistente e oferecem retry explícito;
- conclusão envia envelope completo e revisão, valida CAS, rituais, cursor e ending compatível no servidor, retorna o snapshot concluído canônico e aceita retry idempotente quando a resposta anterior se perde;
- sync genérico deixou de aceitar conclusão/recompensa do cliente; eventos aceitos têm tipo, origem, identidade semântica e sequência validados, com escolha fora de ordem e pista forjada rejeitadas;
- cadastro valida `confirmPassword` antes do hash e da transação de criação;
- flush ativo/`pagehide` preserva metadados do request no cache, permite rebase seguro após confirmação e guarda cópia separada quando há conflito real;
- glifos `∴`, `→`, `←` e `×` foram substituídos pelos helpers da biblioteca local, mantendo texto e nomes acessíveis;
- `npm run validate`: 22 testes aprovados e 1 integração PostgreSQL ignorada localmente por ausência de `TEST_DATABASE_URL`;
- `npm run test:ui`: 8/8 aprovados;
- `npm run validate` no container com `TEST_DATABASE_URL`: 23/23 aprovados, sem `SKIP`;
- revisão final `vesper-content-review`: nenhum CRITICAL, IMPORTANT ou POLISH aberto;
- permanecem manuais/fora do ambiente: multi-dispositivo real, reload real durante flush ativo e HTTPS real.
