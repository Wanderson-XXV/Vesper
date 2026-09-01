# Fluxo de autoria e manutenção

Use este arquivo quando continuar o projeto em outro chat ou com outra IA.

## Antes de alterar qualquer coisa

Leia, nesta ordem:

1. `01_DESIGN_BIBLE.md`
2. `02_NARRATIVE_BIBLE.md`
3. `03_UI_UX_BIBLE.md`
4. `04_RITUAL_PEDAGOGY.md`
5. `06_REPO_MAP.md`
6. `09_LEARNING_TRACKS.md` se a mudança envolver currículo.

## Classifique a alteração

### Roteiro
Edite `content/scenes.json`. Não mexa na UI para mudar uma fala.

### Assunto de conversa
Edite `content/characters.json` e garanta que exista uma flag que estabeleça o assunto antes de a pergunta aparecer.

### Ritual
Edite `content/challenges.json`. Se a dificuldade é de outra turma, prefira criar/alterar uma learning track em vez de destruir a atual.

### Grimório
Edite `content/grimoire.json`. Cada entrada possui: `what`, `mentalModel`, `syntax`, `example`, `commonMistake`, `ritualUse`.

### UI
Só edite `AppUI.js` / `main.css` quando o comportamento ou apresentação do sistema realmente precisa mudar.

## Checklist de cena

- O jogador sabe por que esta conversa está acontecendo?
- Alguma pergunta aparece antes do assunto ser introduzido?
- A narração observa ou está explicando a interpretação?
- Há tecnologia incompatível com o setting?
- Tomás está claro sem virar professor expositivo?
- A cena revela algo que deveria ser recompensa futura?

## Checklist de ritual

- Situação concreta;
- risco/consequência;
- origem dos dados;
- protagonista parafraseia a tarefa;
- UI abre só depois disso;
- até três dicas;
- consequência no mundo depois do acerto.

## Ao finalizar

```bash
npm run validate
```

Atualize `CHANGELOG` e qualquer Bible afetada pela decisão.
