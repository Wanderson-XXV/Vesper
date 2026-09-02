# Current State — 2026-09-02 — plataforma multicase

## Produto

MVP jogável de **Vesper**, antologia investigativa web com casos, rotas curriculares e variantes Java/Python.

## Caso atual

**Caso 01 — Mansão de Vesper**. A história base acompanha o desaparecimento de Theo Vesper, Lívia Vesper e o investigador ritualista Tomás Vale.

**Caso 02 — O Observatório das Nove Luzes**. Reescrito em 2026-08-28 sob a decisão `0011` (rituais como sistema de magia: declaração + trabalho): chegada com lacre rompido por dentro, frentes paralelas de investigação no Ato 1, tópicos de conversa com Tomás, verbos rituais distintos por desafio (Apartar, Confrontar, Afinar / Localizar, Isolar, Cruzar) e escolha final precedida de ledger de pistas. Outline em `docs/authoring/CASE02_REOUTLINE.md`.

## Learning tracks

- `arrays_beginner`: jogável; arrays, `for`, `if`, comparação, estado, máximo e consecutivos.
- `conditionals_beginner`: jogável no Caso 01; decisões binárias, limites, faixas, condições combinadas, múltiplas variáveis e integração final.
- `bridge_loops_arrays`: jogável no Caso 02; repetição, índices e estado.
- `advanced_collections`: jogável no Caso 02; matrizes, loops aninhados, mapas e frequências.

## Plataforma

- catálogo multicase e seleção de caso/rota/linguagem;
- snapshots PostgreSQL com retomada entre dispositivos, revisão otimista e cache namespaced por conta/execução;
- perfil local persistente, XP, Marcas de Campo e relações;
- eventos de escolha/final e ledger idempotente;
- contratos de ritual e kit portátil de autoria;
- backend PostgreSQL, contas, equipes, relatórios e implantação Docker implementados;
- Hub/Arquivo de Investigações como entrada para selecionar caso, rota e linguagem;
- sessão e banco obrigatórios para iniciar ou retomar; cadastro estudantil com usuário, senha e código de turma;
- reinício arquiva tentativas anteriores; menu do caso oferece salvar e sair com confirmação remota;
- mentor consulta respostas por tentativa e pode emitir senha temporária para alunos da própria equipe;
- validação online por oráculo de saída, com o cliente fora da autoridade de recompensa.

## Confiabilidade e engenharia — acompanhamento 2026-09-02

O MVP possui a infraestrutura de contas, runs, snapshots e eventos, mas o playtest revelou bloqueadores antes de uso com turmas:

- cursor de cena agora é persistido no cliente, incluindo fala, escolha, ritual pendente e encerramento;
- backend já valida estritamente `runId`, caso, rota, linguagem, versão e revisão;
- snapshots versionados já possuem contrato, migração e validação server-side;
- o fluxo de iniciar após autenticação distingue retomada de execução já existente;
- o reinício envia o checkpoint final e preserva eventos antes de arquivar a tentativa;
- a área de conta agora permite perfil, username, troca de senha, confirmações, visibilidade acessível de senha e logout separado;
- o hardening do Prompt 6 tornou a conclusão online server-authoritative, com final local somente após confirmação remota, CAS obrigatório e retry explícito quando a API falha;
- eventos de escolha, pista, tentativa e dica agora usam identidade e sequência determinísticas, validam a origem declarada e não concedem recompensa de pista pelo sync genérico; escolhas só alteram relações quando correspondem ao cursor pendente;
- o cache local registra o request em voo: uma alteração feita durante o flush pode ser rebaseada com segurança quando o snapshot remoto confirma exatamente o request anterior; conflitos preservam uma cópia local de recuperação e permanecem visíveis;
- `pagehide` usa beacon somente quando não há request ativo. Como navegadores não garantem entrega após o descarregamento, o checkpoint continua no cache e é reconciliado na próxima carga; reload real durante request ativo continua sendo cenário de teste manual;
- cadastro agora exige confirmação de senha também no servidor, e os glifos de interface remanescentes foram substituídos pelo registro local de ícones;
- no ambiente local, `npm run validate` passou com 22 testes e 1 integração PostgreSQL ignorada por ausência de `TEST_DATABASE_URL`; no container, a integração PostgreSQL do Prompt 6 passou sem `SKIP`, e `npm run test:ui` passou com 8/8.

O contrato permanente está em `docs/decisions/0013-precise-checkpoints-and-account-management.md` e o padrão de ícones em `docs/decisions/0014-lucide-icon-system.md`. A execução das tarefas está em `docs/architecture/IMPLEMENTATION_PLAN_2026-09-02.md`.

### Acompanhamento das frentes

- Fundação local de ícones: concluída, coberta por testes e integrada aos controles antes representados por glifos em `AppUI.js`.
- Backend de execução/autenticação: handlers duplicados revisados e removidos; `node --check` passou; integração PostgreSQL e validação completa passaram no container com 19 testes e nenhum `SKIP`.
- Save preciso no cliente: implementado com checkpoints estáveis, retomada por cursor, restart sem reload para o Hub, conclusão confirmada pelo servidor e recuperação coordenada de flush/`pagehide`.
- Área de conta no frontend: implementada com avatar/nome clicável, perfil, username, troca de senha, confirmações client/server-side, toggles acessíveis e logout dentro da conta.

## Assets atuais

- 7 backgrounds principais da mansão + exterior com portão fechado;
- 2 backgrounds produzidos para o Observatório (arquivo e cúpula);
- sprites de Tomás e Lívia derivados do Visual Novel Horror Asset Pack da Kalaverita;
- pack completo preservado em `assets/source-packs/kalaverita-horror-vn/`;
- referências de No, I'm Not a Human preservadas em `docs/references/ninah/` somente para direção visual;
- uma faixa longa de suspense usada como música placeholder.

## Pontos ainda abertos

- fazer playtest editorial da `conditionals_beginner`, principalmente do ritmo das seis cenas específicas;
- diálogos do Caso 01 ainda merecem script doctor contínuo; **revisão de voz do Caso 01 sob a decisão 0011** (o texto atual não deve servir de referência — feedback do diretor em 2026-08-28);
- Caso 02: falta asset de exterior/portão do observatório (a chegada hoje é conduzida por narração) e geradores de engine `divergencePositions`/`crossReference` para variar os rituais de confronto/cruzamento entre playthroughs (hoje usam `fixed`);
- sistema de expressões faciais ainda pode ser aprofundado;
- evidências/perfis/Grimório podem continuar ganhando acabamento;
- licenças de backgrounds e música placeholder devem ser revisadas antes de publicação pública/comercial;
- o Caso 02 precisa de playtest presencial com as duas turmas para calibrar duração e dificuldade;
- produção ainda exige domínio real, credenciais fora do exemplo, HTTPS e teste de restauração de backup;
- a configuração local em Docker foi verificada com PostgreSQL saudável, migração aplicada e API online;
- execução de código permanece uma fase isolada e não está habilitada na aplicação principal.

## Próximo fluxo recomendado

Consulte `architecture/PLATFORM_ARCHITECTURE.md` para o retrato completo do produto e `architecture/PLATFORM_ROADMAP.md` para a ordem de expansão. Para qualquer track, continue o fluxo: ritual design → narrativa → integração sem quebrar tracks existentes → revisão → playtest → consolidação de feedback. Para plataforma, use também `architecture/SCALABILITY_PLAN_2026-09-02.md`.
