# Plano de escalabilidade e futuras adições — 2026-09-02

## Objetivo

Preparar Vesper para crescer de um MVP multicase para uma plataforma de investigações persistentes sem antecipar microserviços, monetização ou execução insegura de código. O próximo deploy continua simples; as expansões devem preservar a separação entre conteúdo, estado da investigação, perfil do investigador e infraestrutura.

Este é um plano de implementação. Regras de canon, pedagógicas ou de privacidade só se tornam permanentes depois de uma decisão numerada e da atualização da fonte canônica correspondente.

## Princípios de fronteira

1. **Conta não é save.** A conta identifica a pessoa; o perfil guarda sua continuidade global; cada execução guarda um caso, rota, idioma, versão de conteúdo e tentativa.
2. **O servidor é autoridade do que importa.** PostgreSQL decide identidade, acesso, revisão do save, conclusão, tentativas e recompensas. O navegador mantém apenas cache de recuperação.
3. **Narrativa ramificada é conteúdo declarativo.** Escolhas produzem fatos e consequências explicitamente definidos no pacote do caso; a engine não deve receber regras de uma cena escondidas em código.
4. **Morte ou fracasso é estado narrativo, não punição de conta.** Uma tentativa terminal pode ser consultada pelo mentor e pelo investigador, e uma nova tentativa deve ser aberta sem apagar a anterior.
5. **Cosmético não altera pedagogia.** Avatar, roupa e itens visuais podem expressar progresso, mas não devem dar vantagem em ritual, esconder conteúdo ou converter escolha narrativa em nota moral.
6. **Executar código é uma fronteira de segurança.** Java e Python devem rodar em executor separado, com versões fechadas e harnesses mantidos pelo servidor; nunca dentro do app ou no host do banco.

## Modelo de estado-alvo

| Camada | Identidade | Dados principais | Autoridade |
|---|---|---|---|
| Conta | `userId` | login, sessão, equipes, papel | servidor |
| Perfil do investigador | `userId` estável | nome público, avatar, XP, nível quando decidido, Marcas de Campo, cosméticos equipados | servidor + ledger |
| Mundo contínuo | `userId` + fatos promovidos | pistas e consequências permitidas entre casos | servidor, por `carryForward` explícito |
| Execução | `runId` | caso, rota, idioma, versão, tentativa, cursor, snapshot | PostgreSQL |
| Histórico | `runId` | escolhas, pistas, respostas, dicas, submissões e finais | eventos append-only |
| Conteúdo | `caseId` + `contentVersion` | cenas, salas, desafios, tracks, catálogo cosmético | repositório versionado |

Fluxo desejado:

```text
Conta ──1:1── Perfil do investigador ──┬── fatos globais autorizados
                                      └── cosméticos possuídos/equipados
Conta ──N:N── Equipes ── mentor vê relatórios autorizados
Perfil ──N:N── Execuções ── eventos/rituais ── final da tentativa
Conteúdo versionado ────────────────────────┘
```

O schema atual já oferece uma base útil (`users`, `sessions`, `investigator_profiles`, `case_runs`, `story_events`, `ritual_attempts`, `reward_transactions` e `cosmetic_unlocks`). A próxima evolução deve adicionar contratos e migrações incrementais, não substituir `userId` por username nem colocar todo o estado em uma tabela global de jogador.

## Fases recomendadas

### Fase 0 — deploy repetível (agora)

- usar `deploy/update.sh` tanto manualmente quanto pelo workflow de GitHub Actions;
- manter `.env`, volumes, backups e chaves fora do commit;
- validar `/api/health` após cada atualização;
- separar produção, staging e local por domínio, projeto Compose, `.env` e volumes;
- testar restauração de backup antes de colocar uma turma real.

### Fase 1 — operação antes de escalar produto

- adicionar CI obrigatório para `npm run validate`, testes de UI e integração PostgreSQL;
- registrar versão do commit e duração do deploy sem registrar senha, cookie ou fonte do aluno;
- criar staging com migração e smoke test automáticos;
- definir política de rollback compatível com migrações forward-only;
- medir erros de sync, latência de `/runs/*`, falhas de login, tempo de ritual e uso de disco;
- revisar limites de backup, retenção e restauração mensal.

Critério de saída: uma atualização pode ser repetida, observada e revertida sem apagar dados; o teste de restauração passa em banco separado.

### Fase 2 — perfil, avatar e metaprogressão

1. Fixar um contrato de perfil público separado de credenciais: nome exibido, avatar, preferências locais e visibilidade para colegas/mentor.
2. Criar catálogo de cosméticos versionado, com `cosmeticId`, slots compatíveis, origem/licença, raridade apenas visual e status publicável.
3. Manter posse e equipamento no servidor; equipar deve ser idempotente e não alterar snapshots de casos.
4. Usar o ledger existente para desbloqueios. Nunca conceder cosmético apenas porque o cliente declarou uma pontuação.
5. Só criar “níveis” quando a fórmula e o propósito pedagógico estiverem claros. Uma recomendação inicial é nível como resumo de XP, sem bloquear conteúdo obrigatório.
6. Adiar loja, comparação social e ranking público até haver decisões de privacidade, moderação, idade e escopo da turma.

Decisões ainda necessárias: fonte dos pontos, se repetição dá recompensa, se falhar um caso dá XP, quais dados colegas podem ver e se o avatar pode usar upload ou apenas catálogo aprovado. Recomendação: XP por aprendizagem verificável e conclusão; Marcas de Campo para cosméticos; nenhuma pontuação moral por escolher sobreviver, sacrificar alguém ou falhar narrativamente.

### Fase 3 — histórias dependentes de escolhas

- manter `caseRun` como unidade de continuidade local;
- registrar escolhas e consequências como eventos com IDs estáveis, em vez de derivar o passado apenas do snapshot;
- declarar em cada caso quais fatos têm `carryForward` e como uma versão nova os migra;
- distinguir `active`, `completed`, `failed`, `archived` e demais estados terminais no contrato de run;
- permitir finais de sobrevivência, desaparecimento ou morte sem apagar a biografia do investigador;
- abrir a próxima tentativa atomicamente e preservar o relatório da anterior;
- oferecer ao autor uma validação de grafo para detectar destino inexistente, ciclo acidental, requisito impossível e final sem consequência definida.

O mundo global deve receber somente fatos canônicos promovidos pelo caso. Flags internas, itens temporários e detalhes de uma cena permanecem no run. Isso permite que cada investigador tenha um percurso diferente sem transformar cada combinação de escolhas em uma nova cópia de toda a campanha.

### Fase 4 — execução segura de Java e Python

O primeiro desenho deve ser assíncrono e explícito:

1. Vesper cria uma submissão com `submissionId`, `runId`, `challengeId`, linguagem, versão, fonte e parâmetros permitidos.
2. Um executor isolado recebe somente um job assinado e devolve estado, stdout/stderr truncados, tempo, memória e diagnóstico.
3. O servidor compara a saída com o harness/caso de teste mantido no servidor; o cliente não escolhe os testes nem a recompensa.
4. O resultado idempotente vira `ritual_attempt`/evento e só então pode liberar consequência ou recompensa.

Contrato mínimo antes de turma: imagem imutável por linguagem, rede desabilitada, sem mount do host, sem socket Docker, filesystem temporário, limites de CPU/parede/memória/processos/fonte/saída, fila e rate limit por usuário/equipe, timeout e cancelamento. Testar código inválido, loop infinito, fork bomb, saída infinita, exfiltração, leitura do host e concorrência.

Começar com poucos exercícios de entrada/saída determinísticos. Para Pybricks e hardware, usar mock aprovado ou validação no hub; não simular sensor real com uma execução genérica na VPS.

### Fase 5 — escala técnica somente quando houver sinal

- manter o monólito Node + PostgreSQL enquanto a carga couber nele;
- separar executor e, depois, workers de relatórios apenas quando métricas mostrarem necessidade;
- mover assets grandes e dumps para armazenamento externo com política de retenção;
- adicionar fila para submissions e geração de relatórios, mantendo comandos idempotentes;
- criar read models para mentor quando consultas de equipe deixarem de ser previsíveis;
- usar réplicas de leitura apenas depois de definir consistência aceitável para save, recompensa e relatório.

Não criar microserviço para cada entidade. A unidade de escalabilidade deve seguir a fronteira de risco: app de jogo, banco de dados, executor não confiável e processamento assíncrono.

## Ordem prática dos próximos prompts

### Prompt A — endurecer o deploy

> Leia `docs/INDEX.md`, `docs/architecture/PLATFORM_ARCHITECTURE.md`, `docs/architecture/SCALABILITY_PLAN_2026-09-02.md` e `deploy/README.md`. Configure somente CI/staging/smoke test do deploy existente. Não altere conteúdo narrativo, schema de conta ou executor. Adicione validação de `npm run validate`, teste PostgreSQL quando disponível, proteção de segredos e documentação de rollback. Rode os validadores e não marque produção como saudável sem `/api/health` com banco.

### Prompt B — perfil e cosméticos

> Leia `docs/INDEX.md`, `docs/architecture/PLATFORM_ARCHITECTURE.md`, `docs/architecture/CONTENT_MODEL.md`, `docs/architecture/SCALABILITY_PLAN_2026-09-02.md` e as decisões vigentes. Projete primeiro, e só implemente após registrar a decisão sobre pontos, níveis, privacidade e morte narrativa. Preserve `userId`, runs e ledger; cosméticos não podem dar vantagem pedagógica. Entregue schema/migração, contrato, catálogo mínimo, testes de idempotência e UI sem transformar o Hub em dashboard.

### Prompt C — continuidade narrativa

> Leia `docs/INDEX.md`, `docs/canon/`, `docs/architecture/CONTENT_MODEL.md`, `docs/architecture/ENGINE_ARCHITECTURE.md` e `docs/architecture/SCALABILITY_PLAN_2026-09-02.md`. Crie um contrato declarativo para fatos globais, `carryForward`, estados terminais e migração por versão. Adicione validador de grafo e um caso de teste com sobrevivência e falha. Não pontue escolhas moralmente, não misture flags locais com perfil global e não reescreva tracks existentes.

### Prompt D — executor controlado

> Leia `docs/INDEX.md`, `docs/pedagogy/RITUAL_PEDAGOGY.md`, `docs/architecture/CONTENT_MODEL.md`, `docs/architecture/SCALABILITY_PLAN_2026-09-02.md` e `deploy/executor/README.md`. Faça um protótipo separado do app com Java e Python em versões fechadas, harness server-side, rede desligada, limites rígidos e testes adversariais. Não dê ao app socket Docker, mounts ou execução local. Comece com um exercício determinístico e mantenha fallback output-only até a revisão de segurança.

## Definition of done das expansões

Uma fase só entra no produto quando possui:

- decisão documentada para cada regra nova de produto;
- contrato de dados e migração reversível ou estratégia forward-only explicitada;
- autoridade server-side e idempotência definidas;
- testes unitários, integração e fluxo de usuário proporcional ao risco;
- playtest quando tocar narrativa, pedagogia ou progressão;
- observabilidade, backup e rollback considerados quando tocar produção;
- atualização de `docs/INDEX.md`, `CURRENT_STATE.md` e `PLATFORM_ROADMAP.md` quando o estado do projeto mudar.
