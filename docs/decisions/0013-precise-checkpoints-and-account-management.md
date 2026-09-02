# 0013 — Checkpoints precisos e gestão segura da conta

## Status

Aprovada para implementação em 2026-09-02. Esta decisão formaliza a correção de confiabilidade identificada na auditoria read-only; a implementação ainda precisa passar pelos prompts de engenharia e pela revisão final.

## Contexto

O MVP já possui PostgreSQL, sessões, snapshots, eventos e cache local namespaced, mas o cursor narrativo permanece apenas em memória. Ao salvar durante uma cena, a execução pode voltar à sala sem saber qual fala, escolha ou ritual estava ativo. Além disso, a API aceita um `runId` sem conferir todos os identificadores enviados contra a execução armazenada.

A interface também mistura o acesso à conta com logout e não oferece gestão básica de usuário e senha.

## Decisão

1. PostgreSQL continua sendo a autoridade da execução autenticada. `localStorage` é apenas cache de recuperação e nunca decide retomada, recompensa, conclusão ou acesso.

2. Toda execução será tratada como um `RunEnvelope` com metadados canônicos no servidor:

   - `runId`;
   - `caseId`;
   - `routeId`;
   - `languageId`;
   - `contentVersion`;
   - `attemptNumber`;
   - `revision`;
   - `status`;
   - `snapshot`;
   - eventos append-only idempotentes.

3. O snapshot terá versão explícita e conterá o estado necessário para reconstruir a investigação: sala, flags, pistas, inventário, personagens conhecidos, relações, presença, tentativas, dicas, desafios, final, jogador e cursor narrativo.

4. O cursor narrativo terá, no mínimo:

   - `mode` (`explore`, `scene`, `choice`, `challenge` ou `ending`);
   - `sceneId`;
   - `nextEventIndex`;
   - `sceneStack` quando houver composição de cenas;
   - desafio pendente e seus dados determinísticos quando aplicável.

5. Saves ocorrerão em checkpoints estáveis de evento. O jogo não precisa salvar cada caractere digitado, espera ou frame de animação; precisa salvar antes/depois de estados interativos de forma que repetir um evento seja seguro e não pular um evento seja garantido.

6. A API rejeitará payloads cujo `runId`, caso, rota, linguagem, versão ou revisão não correspondam à execução autenticada. Conflitos de revisão não poderão aplicar snapshot ou eventos parcialmente.

7. “Iniciar caso”, “retomar investigação” e “nova tentativa” serão ações distintas:

   - iniciar sem execução ativa cria uma execução;
   - retomar usa o snapshot remoto e seu cursor;
   - nova tentativa arquiva a execução ativa e cria outra atomicamente;
   - trocar de caso ou rota nunca reutiliza o save de outro caso/rota.

8. O reinício deve preservar no servidor a tentativa anterior, seus eventos e respostas já recebidos. A nova execução só será aberta depois da confirmação da operação remota.

9. O acesso à conta ficará separado das ações do caso. A conta permitirá consultar o usuário, alterar nome de usuário e alterar senha, sempre com confirmação e sem persistir senhas no navegador.

10. Cadastro, login e troca de senha terão confirmação visual da senha e controle acessível para mostrar/esconder o valor. A política de cookie deve diferenciar corretamente desenvolvimento HTTP e produção HTTPS, sem reduzir a segurança em produção.

## Consequências

- Saves antigos precisarão de migração explícita ou fallback seguro.
- O servidor deverá validar o envelope e o snapshot sem confiar no cliente para recompensas ou conclusão.
- O fluxo de retomada será testado em cena, escolha, ritual, sala, reload, outra aba e outro dispositivo.
- A troca de nome não poderá invalidar saves, pois os caches usam `userId`, não o nome textual.
- Alterações de `server/api.mjs` de execução e autenticação serão integradas na mesma frente para evitar contratos concorrentes.

## Arquivos e áreas afetados

- `src/engine/GameState.js`
- `src/engine/SceneEngine.js`
- `src/main.js`
- `src/ui/AppUI.js`
- `src/engine/ApiClient.js`
- `server/api.mjs`
- `server.mjs`
- `server/schema.sql`
- testes unitários, de integração e Playwright

## Não decidido nesta fase

- criação visual completa do personagem;
- skins e cosméticos além do modelo já existente;
- slots manuais de save;
- execução arbitrária de código do aluno.
