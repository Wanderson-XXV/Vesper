# AGENTS.md — A Mansão de Vesper

## Regra principal

O repositório é a fonte de verdade do projeto. Não trate histórico de chat como autoridade se o repositório disser outra coisa.

Antes de alterar qualquer arquivo, leia `docs/INDEX.md` e siga o roteamento abaixo. Carregue apenas o contexto relevante para a tarefa.

## Routing

### Roteiro, diálogo, NPC, cena, pacing ou mistério
Leia:
- `docs/canon/NARRATIVE_BIBLE.md`
- `docs/canon/CHARACTER_BIBLE.md`
- `docs/canon/WRITING_RULES.md`
- `docs/pedagogy/RITUAL_PEDAGOGY.md` quando a cena toca um ritual
- a track pedagógica correspondente em `docs/pedagogy/`

Use a skill `vesper-narrative`.

### Ritual, exercício, dica, Grimório ou nova learning track
Leia:
- `docs/pedagogy/RITUAL_PEDAGOGY.md`
- a track correspondente em `docs/pedagogy/`
- `docs/architecture/CONTENT_MODEL.md`

Use a skill `vesper-ritual-design`.

### Novo capítulo/caso
Leia:
- `docs/canon/DESIGN_BIBLE.md`
- `docs/canon/NARRATIVE_BIBLE.md`
- `docs/canon/WORLD_RULES.md`
- `docs/pedagogy/RITUAL_PEDAGOGY.md`
- `docs/architecture/AUTHORING_WORKFLOW.md`

Use a skill `vesper-chapter-authoring`.

### UI, screenshot, tipografia, portrait, asset ou direção visual
Leia:
- `docs/art/ART_DIRECTION.md`
- `docs/art/UI_REFERENCE.md`
- `docs/art/ASSET_MANIFEST.md`
- `docs/feedback/REJECTED_PATTERNS.md`

Use a skill `vesper-ui-review`.

### Engine, estado, JSON loader, áudio, routing ou bug técnico
Leia:
- `docs/architecture/ENGINE_ARCHITECTURE.md`
- `docs/architecture/CONTENT_MODEL.md`
- `docs/architecture/REPO_MAP.md`

Respeite também `src/AGENTS.md`.

### Revisão final antes de entregar
Use `vesper-content-review` e rode os validadores do projeto.

### Feedback novo do diretor do projeto
Se o usuário disser que algo "não parece Vesper", rejeitar uma solução, corrigir uma regra ou estabelecer uma preferência reaproveitável, use `vesper-feedback-consolidation` antes de encerrar a tarefa.

## Invariantes do projeto

- A experiência deve parecer primeiro investigação/terror e só depois exercício pedagógico.
- Setting de fantasia gótica/vitoriana tardia; nada de celular, internet ou estética cyberpunk sem decisão formal de canon.
- Programação é diegética: o aluno programa fora da ficção; o personagem formaliza um ritual dentro dela.
- Tomás é econômico, experiente e claro. Econômico não significa críptico.
- Toda pergunta de diálogo precisa de contexto prévio.
- Narração descreve observáveis; não resolve o mistério pelo jogador.
- Rituais precisam de contexto, consequência, origem dos dados e uma pergunta concreta antes de abrir a HUD.
- Nunca exibir dados internos da engine como `seed` para o jogador.
- A rota pedagógica pode ser linear mesmo quando a investigação permite exploração opcional.
- Uma learning track não deve quebrar ou reescrever outra track sem pedido explícito.
- Assets de referência não são automaticamente assets de produção.
- Regras permanentes devem ser documentadas; feedback útil não deve morrer em uma thread.

## Ordem de autoridade da documentação

1. `docs/INDEX.md` define quais arquivos são canônicos.
2. `docs/decisions/` registra decisões explícitas e prevalece sobre snapshots antigos.
3. Arquivos listados como fonte de verdade no `docs/INDEX.md`.
4. Conteúdo atual (`content/*.json`) para comportamento implementado.
5. Changelogs e documentação histórica apenas como contexto.

Se houver conflito real, não adivinhe. Aponte o conflito e proponha a menor correção consistente.

## Definition of done

Antes de finalizar qualquer alteração relevante:

```bash
npm run validate
```

Para mudanças narrativas ou pedagógicas, também faça uma leitura manual da cena anterior e posterior.

Para mudanças visuais, confira a referência em `docs/art/UI_REFERENCE.md` e os padrões rejeitados.

Quando uma nova decisão permanente surgir, registre em `docs/decisions/` ou promova o feedback para a documentação canônica.
