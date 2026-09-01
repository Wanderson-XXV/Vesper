# Current State — 2026-08-27 — plataforma multicase

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

Consulte `architecture/PLATFORM_ARCHITECTURE.md` para o retrato completo do produto e `architecture/PLATFORM_ROADMAP.md` para a ordem de expansão. Para qualquer track, continue o fluxo: ritual design → narrativa → integração sem quebrar tracks existentes → revisão → playtest → consolidação de feedback.
