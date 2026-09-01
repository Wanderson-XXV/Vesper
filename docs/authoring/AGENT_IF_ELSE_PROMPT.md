# Prompt para o agente — tornar jogável a track de IF / ELSE

Você está trabalhando no repositório **A Mansão de Vesper — MVP V6**.

Seu objetivo é **completar a learning track `conditionals_beginner`** para alunos iniciantes que estão aprendendo principalmente `if`, `if/else`, `else if`, operadores de comparação e condições combinadas simples.

## Antes de editar qualquer arquivo

Leia, nesta ordem:

1. `docs/00_INDEX.md`
2. `docs/01_DESIGN_BIBLE.md`
3. `docs/02_NARRATIVE_BIBLE.md`
4. `docs/03_UI_UX_BIBLE.md`
5. `docs/04_RITUAL_PEDAGOGY.md`
6. `docs/05_CONTENT_ARCHITECTURE.md`
7. `docs/09_LEARNING_TRACKS.md`
8. `docs/10_AUTHORING_WORKFLOW.md`
9. `docs/authoring/specs/WRITING_RULES.md`
10. `docs/authoring/specs/IF_ELSE_TRACK.md`
11. `docs/authoring/specs/V6_SPEC.md`

Depois inspecione:

- `content/tracks.json`
- `content/challenges.json`
- `content/scenes.json`
- `content/rooms.json`
- `content/grimoire.json`
- `src/engine/SceneEngine.js`
- `src/ui/AppUI.js`

## Regras fundamentais

- **Não quebre nem reescreva a track `arrays_beginner`.** Ela é a referência jogável existente.
- A track `conditionals_beginner` precisa funcionar como uma campanha paralela usando a mesma mansão, personagens, evidências principais e revelações narrativas.
- Não exija arrays, `for` ou `while` como solução principal nos rituais desta track.
- Não troque apenas o `challengeId`. Cada ritual precisa ter **cena de contexto própria**, pois uma tarefa sobre uma única leitura não pode ser introduzida com diálogo sobre dezenas de registros.
- Use a arquitetura de `sceneSlots` já presente na V6. Os slots são:
  - `gate_ritual_intro`
  - `hall_ritual_intro`
  - `gallery_ritual_intro`
  - `bedroom_ritual_intro`
  - `office_ritual_intro`
  - `basement_ritual_intro`
- Preencha `conditionals_beginner.sceneSlots` com as novas cenas.
- Os rituais desta track devem continuar usando os mesmos **flags narrativos de progressão** (`ritual_0_completed`, `ritual_1_completed` etc.) para que as portas e cenas compartilhadas continuem funcionando.
- Se um `successScene` atual falar explicitamente de arrays, contagem ou sequência e não combinar com a nova tarefa, crie um `successScene` específico da track de condicionais.
- A consequência do programa precisa acontecer no mundo: escolher um traço ritual, isolar uma peça, classificar uma moldura, permitir/recuar, estabilizar um mecanismo etc.
- Tomás é direto, mas deve ser compreensível e útil. Não escreva frases crípticas que escondem a tarefa pedagógica.
- Antes de abrir a HUD de um ritual, a cena deve deixar claro:
  1. o que está acontecendo;
  2. por que importa agora;
  3. o que a entrada representa no mundo;
  4. qual decisão/resposta precisamos obter.
- A protagonista deve reformular a tarefa em linguagem simples quando isso ajudar o aluno.
- Não usar linguagem metalinguística como “é fácil de propósito”, “tutorial”, “agora você aprendeu”.
- Preserve o setting gótico/vitoriano. Nada de celular, telas digitais modernas ou linguagem diegética de software.

## Progressão pedagógica obrigatória

Siga `docs/authoring/specs/IF_ELSE_TRACK.md` como base:

### Portão — `if / else`
Entrada: um único `0` ou `1`.
Decisão entre duas ações rituais.

### Hall — comparação + `if / else`
Entrada: uma leitura entre `0` e `10`.
Abaixo de `7` → `MANUSEAR`; `7` ou mais → `ISOLAR`.

### Galeria — `if / else if / else`
Entrada de `0` a `10`.
Classificar em `DORMENTE`, `ATIVA` ou `HOSTIL`.

### Quarto — `&&`
Dois estados binários.
Só seguir se duas condições forem verdadeiras ao mesmo tempo.

### Escritório — faixas com `else if`
Três estados de um mecanismo conforme uma leitura.

### Porão — integração
Combinar condições simples para decidir entre três ações finais.

Você pode ajustar nomes e valores se isso melhorar o roteiro, desde que preserve a escada pedagógica.

## Grimório

Adicione/ajuste entradas de Grimório para a track sem apagar as existentes. O aluno precisa ter consulta útil sobre:

- comparação (`==`, `!=`, `>`, `<`, `>=`, `<=`);
- `if`;
- `if / else`;
- `else if`;
- `&&` e, se fizer sentido, `||`.

Cada entrada deve seguir o formato existente e incluir, quando apropriado:
- `what`
- `mentalModel`
- `syntax`
- `example`
- `commonMistake`
- `ritualUse`
- `protagonistNote`
- `tomasTip`

## Teste da track

A V6 aceita override por query string.

Use:

`http://localhost:5173/?track=conditionals_beginner`

para testar a track sem mudar permanentemente a campanha principal.

## Entregáveis

1. `conditionals_beginner` com status `playable` em `content/tracks.json`.
2. Todos os `sceneSlots` da track preenchidos.
3. Desafios de condicionais revisados/reescritos em `content/challenges.json`.
4. Cenas de introdução e, quando necessário, de sucesso em `content/scenes.json`.
5. Grimório atualizado para suportar a progressão.
6. Nenhuma regressão na track `arrays_beginner`.
7. Rode `node scripts/validate-content.mjs` e corrija referências quebradas.
8. Crie `docs/CHANGELOG_IF_ELSE_TRACK.md` explicando o que foi alterado e quais cenas ainda merecem revisão autoral manual.

## Importante sobre roteiro

Não tente “embelezar” toda a campanha. Faça primeiro uma versão funcional, clara e coerente. Marque no changelog quais diálogos você considera candidatos a refinamento posterior. O usuário pretende fazer uma segunda passada de roteiro externamente depois que a track estiver jogável.
