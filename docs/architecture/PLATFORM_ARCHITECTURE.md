# Arquitetura da Plataforma Vesper

> Estado: MVP multicase implementado, com correções de confiabilidade e gestão de conta aprovadas para implementação. Este documento distingue o produto atual do contrato aprovado; propostas ainda não entregues ficam em `PLATFORM_ROADMAP.md`.

## 1. O que é Vesper

**Vesper** é a plataforma/universo de investigação ritualista. Ela abriga casos independentes, rotas curriculares e variantes de linguagem, conectados por um investigador persistente e pelo metamistério.

**A Mansão de Vesper** não é mais o nome do produto: é o **Caso 01**. **O Observatório das Nove Luzes** é o **Caso 02**.

A unidade de experiência é:

```text
universo → caso → rota curricular → variante de linguagem → execução do aluno
```

- O **universo** estabelece ontologia, personagens recorrentes e perguntas abertas.
- O **caso** estabelece mistério, locais, pistas, escolhas e finais.
- A **rota** escolhe os rituais e a progressão pedagógica daquele caso.
- A **variante de linguagem** adapta a apresentação de Java, Python ou outra linguagem sem alterar a verdade ficcional do caso.
- A **execução** atual valida a saída. Execução arbitrária de código é uma fase separada, não uma promessa implícita do navegador.

## 2. Hub Vesper / Arquivo de Investigações

O Hub é a porta de entrada do produto: a tela de título com o **Arquivo de Investigações**. Não é um terceiro caso, nem exige um local físico comum a todas as histórias.

Ele permite ao jogador:

- selecionar um caso no catálogo;
- selecionar uma rota curricular oferecida pelo caso;
- selecionar linguagem suportada;
- iniciar ou retomar uma execução;
- consultar o investigador persistente (nome, nível, XP e Marcas de Campo);
- entrar/sair de conta quando a API online está ativa.

Uma sessão é obrigatória para iniciar ou retomar uma investigação. Sem sessão, o botão de iniciar abre a entrada do Arquivo; após login ou cadastro, a intenção de iniciar é preservada e o caso escolhido começa diretamente. O acesso à conta fica no canto do Hub, não misturado às ações do caso.

O cadastro inicial pede usuário, senha e código obrigatório da equipe. No MVP, o usuário identifica o investigador; aparência e criação de personagem serão uma etapa posterior do perfil. Privilégios de mentor nunca são solicitados no cadastro público.

O Hub não deve virar dashboard escolar. Sua função é arquivar investigações e dar continuidade, preservando a apresentação de visual novel/investigação.

## 3. Mapa do sistema

```text
Navegador
  ├─ Hub / AppUI
  ├─ ContentLoader ───────┐
  ├─ SceneEngine / ChallengeEngine   ├─ content/catalog.json
  └─ GameState (cache por conta)     └─ content/cases/<caseId>/*.json
                 │
                 │ quando há sessão online
                 ▼
         API Node.js ── ContentRepository + Oráculo
                 │
                 ├─ PostgreSQL: perfil, runs, eventos, tentativas, recompensas
                 └─ relatório do mentor / CSV

Docker Compose
  ├─ Caddy (HTTPS e proxy)
  ├─ App Node.js
  ├─ PostgreSQL
  └─ Backup diário
```

O Hub continua visível sem banco para comunicar indisponibilidade, mas nenhuma investigação inicia ou continua. O servidor é autoridade de snapshots, submissões, recompensas e relatórios; o cache local serve apenas para recuperar alterações pendentes depois de uma nova autenticação.

## 4. Conteúdo multicase

O catálogo global está em `content/catalog.json`. Cada entrada aponta para um pacote isolado em `content/cases/<caseId>/`:

```text
campaign.json     identidade, versão, linguagens, recompensa e ponto inicial
rooms.json        locais, estados visuais, interações e conexões
characters.json   personagens, tópicos e perfis
scenes.json       eventos narrativos, escolhas e finais
challenges.json   rituais, geradores, dicas e contrato ritual
tracks.json       slots narrativos para cada rota curricular
grimoire.json     modelos mentais e adaptações de linguagem
objectives.json   objetivos/registro do caso quando aplicável
```

Regras estruturais:

- IDs, cenas e flags de um caso devem ter prefixo do caso, evitando colisão entre investigações.
- Um caso declara `contentVersion`. Migrações de save são explícitas; nunca se reutiliza o estado de um caso como se fosse de outro.
- A rota altera o tipo de leitura e o encadeamento de rituais, não apenas a sintaxe do mesmo enigma.
- A variante de linguagem adapta o mesmo problema semântico e seus testes; ela não reescreve fatos do caso.
- Escolhas podem alterar relações, flags, cenas e final, mas os fatos necessários ao metamistério convergem.

### Casos registrados

| Caso | Estado | Rotas atuais | Função |
|---|---|---|---|
| Caso 01 — A Mansão de Vesper | jogável/migrado | `arrays_beginner`, `conditionals_beginner` | funda a família Vesper e o desaparecimento de Theo |
| Caso 02 — O Observatório das Nove Luzes | jogável | `bridge_loops_arrays`, `advanced_collections` | apresenta a nona luz e a correspondência remota |

## 5. Rituais e currículo

Rituais são procedimentos formais de correspondência. Dentro da ficção, o investigador mede vestígios e atua com instrumentos; fora dela, o aluno formaliza a regra em programação.

Todo ritual novo declara fenômeno, instrumento, origem e significado dos dados, ação dependente da resposta, risco, operação lógica, saída, consequência, dicas e conhecimento do Grimório. O contrato está detalhado em `docs/pedagogy/RITUAL_PEDAGOGY.md` e no schema `schemas/ritual-contract.schema.json`.

O currículo é uma matriz de conceitos e pré-requisitos, não apenas uma lista linear de fases. Consulte `docs/pedagogy/CURRICULUM_MATRIX.md` para saber quando uma rota pode ser oferecida sem depender de outra.

Linguagens hoje suportadas pela interface: Java e Python. MicroPython/Pybricks pode aparecer em rotas de lógica pura ou APIs simuladas; controle real de hub, motor e sensor não roda genericamente na VPS.

## 6. Estado do jogador e progressão

O estado possui duas escalas.

| Escala | Onde vive | Exemplos |
|---|---|---|
| Execução autenticada do caso | `case_runs` + cache por usuário/run | sala atual, flags, pistas, tentativas, Presença, final |
| Perfil persistente | `investigator_profiles` + cache por usuário | nome, linguagem preferida, XP, nível, Marcas de Campo, cosméticos, relações |

O cache local usa namespace de usuário, caso, rota e execução. O snapshot remoto permite retomada entre dispositivos; revisão otimista impede sobrescrita silenciosa. Reiniciar arquiva a tentativa anterior e cria uma nova, preservando eventos e respostas para relatório e auditoria.

XP e Marcas de Campo usam um ledger idempotente: recarregar página ou reenviar uma requisição não deve duplicar recompensa. Decisões narrativas são registradas, mas nunca recebem pontuação moral. Marcas de Campo servem somente a cosméticos; não há loot box, compra aleatória ou streak.

Somente consequências declaradas para continuidade devem atravessar casos. Flags comuns e internas de uma cena não são metaprogressão.

## 7. Camada online

### Entidades

| Entidade | Responsabilidade |
|---|---|
| `users` e `sessions` | autenticação por usuário/senha e sessão por cookie; o usuário identifica o investigador no MVP |
| `teams` e `team_members` | associação de alunos e mentores |
| `investigator_profiles` | perfil global do investigador |
| `case_runs` | snapshot e estado de cada caso/rota do aluno |
| `story_events` | escolhas, pistas e eventos importáveis |
| `ritual_attempts` | entrada, resposta, tentativa, dica e resultado |
| `reward_transactions` e `cosmetic_unlocks` | auditoria e idempotência de recompensas |

### API pública do frontend

| Endpoint | Uso |
|---|---|
| `GET /api/health` | diagnostica disponibilidade do serviço e do banco |
| `GET /api/catalog` | fornece o catálogo para clientes externos |
| `POST /api/auth/register`, `/login`, `/logout` | conta e sessão |
| `GET /api/me` | perfil e equipes da sessão |
| `POST /api/teams` | cria equipe (mentor/admin) |
| `GET /api/runs/current` | busca a execução ativa e seu snapshot |
| `POST /api/runs/start`, `/restart` | inicia ou arquiva/reabre uma tentativa |
| `POST /api/runs/sync` | grava snapshot com revisão e eventos idempotentes |
| `POST /api/submissions` | valida saída e registra tentativa/recompensa |
| `POST /api/runs/complete` | conclui um caso após rituais obrigatórios |
| `GET /api/mentor/teams/<id>/report(.csv)` | relatório de equipe e exportação |

O painel de mentor é `mentor.html`. Não há ranking público.

### Limites de autoridade e segurança

- Senhas recebem hash Argon2id; o navegador nunca armazena senha.
- Sessões são cookies `HttpOnly`, `SameSite=Lax` e `Secure` em HTTPS.
- PostgreSQL usa Row-Level Security para escopo do aluno e de mentores da mesma equipe.
- O servidor valida se a entrada está dentro do gerador permitido antes de premiar uma saída.
- O cliente não é autoridade de XP, Marcas, recompensa opcional ou tentativa premiada.
- O servidor ainda aceita entrada gerada pelo cliente no modelo output-only atual. Quando houver execução de código, os casos e instâncias devem ser emitidos e mantidos pelo servidor/executor.

## 8. Operação e implantação

`deploy/docker-compose.yml` sobe quatro serviços: `postgres`, `app`, `caddy` e `backup`.

- **Caddy** termina HTTPS e encaminha para a aplicação.
- **App** aplica migrações e inicia o servidor Node.js.
- **PostgreSQL** armazena conta, equipe, perfil, runs e eventos.
- **Backup** cria dump diário e respeita a retenção configurada.

Para VPS, use um domínio real, credenciais fora do exemplo e `COOKIE_SECURE=true`. Para teste local HTTP, use `DOMAIN=http://localhost` e `COOKIE_SECURE=false`. A runbook fica em `deploy/README.md`.

### Diagnóstico de falhas no navegador

As respostas da API incluem o cabeçalho `X-Vesper-Request-Id`. O cliente registra falhas com rota, método, status, duração, código e esse identificador, sem registrar senha, cookie, snapshot ou payload da tentativa. O servidor registra a mesma falha em JSON com o `requestId`, facilitando o cruzamento com `docker compose logs app`.

Quando um jogador relatar um erro, pedir que abra DevTools → Console, reproduza a falha e execute `vesperDiagnostics()`. O resultado é um relatório copiável com as últimas falhas do navegador; o `requestId` permite localizar o evento correspondente no log do VPS.

Após a configuração inicial, o deploy repetível usa `deploy/update.sh`; opcionalmente, `.github/workflows/deploy.yml` executa validação e chama esse script por SSH após cada `push` em `main`. O workflow não transporta `.env` nem dados do banco.

Backups só contam como proteção depois de um teste de restauração em banco separado. Staging deve usar outro projeto Compose, domínio, `.env` e volumes.

## 9. Execução de código: fronteira futura

O produto hoje pede e valida saída produzida pelo programa. Ele **não executa código de aluno** no app, na VPS ou no container web.

Quando Java/Python executáveis forem habilitados, a arquitetura exige um executor separado (Judge0 ou equivalente), rede desabilitada, imagens fechadas, limites de CPU/memória/processos/saída, sem mounts do host e sem acesso ao socket Docker. Consulte `deploy/executor/README.md`.

Pybricks com hardware permanece fora desse executor até existir uma estratégia aprovada de mock, simulação ou validação no hub.

## 10. Fontes de verdade e manutenção

- Canon de mundo e rituais: `docs/canon/` e `docs/pedagogy/`.
- Formato de conteúdo: `docs/architecture/CONTENT_MODEL.md`.
- Processo de autoria: `docs/architecture/AUTHORING_WORKFLOW.md` e `docs/authoring/portable/`.
- Decisões permanentes: `docs/decisions/`.
- Estado e próximos passos: `docs/CURRENT_STATE.md` e `docs/architecture/PLATFORM_ROADMAP.md`.

Antes de integrar alteração narrativa, pedagógica ou estrutural, rode `npm run validate`. Mudanças de conteúdo também exigem leitura da cena anterior, alvo e posterior; mudanças de plataforma exigem teste manual do Hub e do fluxo que foi alterado.

## 11. Contrato aprovado de confiabilidade e conta

A decisão `0013` formaliza a retomada precisa: uma execução não é apenas sala, flags e inventário. Ela precisa carregar um cursor narrativo versionado capaz de reconstruir cena, fala, escolha, ritual ou encerramento. O servidor deve rejeitar mistura de `runId`, caso, rota, linguagem, versão e revisão.

Iniciar, retomar e criar nova tentativa são intenções diferentes. Uma nova tentativa arquiva a execução ativa e cria outra de forma atômica, preservando eventos e respostas da tentativa anterior. O Hub continua permitindo escolher outro caso ou rota sem reutilizar o save selecionado anteriormente.

A gestão de conta é separada das ações da investigação. O contrato aprovado inclui consulta de perfil, alteração de usuário e alteração de senha com confirmação, além de mostrar/esconder senha no frontend. A implementação não inclui ainda criação completa de personagem ou sistema de skins.

O acompanhamento executável, os responsáveis por área e os prompts de integração estão em `docs/architecture/IMPLEMENTATION_PLAN_2026-09-02.md`.
