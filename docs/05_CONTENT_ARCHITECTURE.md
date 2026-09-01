# Content Architecture — JSON e engine

## 1. Objetivo

A engine deve saber **como executar uma aventura**, não **qual é a história de Vesper**.

Campanhas, salas, personagens, falas, rituais e pistas devem ser conteúdo declarativo.

---

## 2. Estrutura recomendada

```text
src/
  engine/
  ui/

campaigns/
  vesper/
    campaign.json
    characters.json
    rooms.json
    objectives.json
    grimoire.json
    scenes/
      intro.json
      exterior.json
      hall.json
      gallery.json
      library.json
      office.json
      bedroom.json
      basement.json
    tracks/
      arrays_beginner.json
      conditionals_beginner.json
    challenges/
      arrays/
      conditionals/

assets/
  rooms/
  characters/
  evidence/
  audio/
```

No MVP atual os JSONs podem continuar agrupados em arquivos únicos, mas essa é a direção quando crescer.

---

## 3. GameState recomendado

```json
{
  "player": {
    "name": "",
    "portrait": null
  },
  "currentRoom": "exterior",
  "flags": {},
  "knownCharacters": ["livia", "tomas"],
  "visitedRooms": [],
  "completedInteractions": [],
  "completedChallenges": [],
  "clues": [],
  "inventory": [],
  "presence": 0,
  "settings": {
    "masterVolume": 0.8,
    "musicVolume": 0.35,
    "sfxVolume": 0.85,
    "muted": false,
    "textSpeed": 24
  }
}
```

### `knownCharacters`
Só personagens nessa lista aparecem no Arquivo/Inventário.

Theo não entra nessa lista até ser revelado.

---

## 4. Personagens

Exemplo:

```json
{
  "id": "tomas",
  "name": "Tomás Vale",
  "role": "Investigador de campo",
  "portrait": "...",
  "topics": [
    {
      "id": "been_here",
      "label": "Você já esteve nesta casa antes?",
      "scene": "tomas_been_here",
      "requires": ["topic_mansion_established"]
    }
  ]
}
```

### Regras

- `label` é uma pergunta completa;
- cada assunto pode exigir flags;
- um tópico não aparece antes de o jogador saber que ele existe.

---

## 5. Cenas

Uma cena é uma lista de eventos.

```json
{
  "id": "example",
  "events": [
    { "type": "say", "speaker": "tomas", "text": "..." },
    { "type": "wait", "duration": 600 },
    { "type": "sound", "sound": "knock" },
    { "type": "setFlag", "flag": "heard_knock", "value": true }
  ]
}
```

### Eventos importantes

- `say`
- `wait`
- `sound`
- `music`
- `setFlag`
- `addClue`
- `discoverCharacter`
- `showEvidence`
- `startChallenge`
- `gotoRoom`
- `conditionalScene`

### Novo evento recomendado: `discoverCharacter`

```json
{
  "type": "discoverCharacter",
  "character": "theo"
}
```

Adiciona o personagem a `knownCharacters`.

---

## 6. Evidências

`showEvidence` não deve automaticamente continuar quando o jogador pressiona Guardar.

Fluxo correto:

1. renderiza evidência;
2. jogador clica Guardar;
3. `addClue`;
4. toca SFX;
5. fecha overlay;
6. evento termina;
7. SceneEngine continua.

O botão “Guardar” é uma ação real, não apenas “Próximo”.

---

## 7. Desafios

Um challenge deve separar:

- **contexto narrativo** — normalmente na cena anterior;
- **dados do ritual**;
- **resultado esperado**;
- **dicas**;
- **consequência de sucesso**.

Exemplo de metadados visíveis:

```json
{
  "displayMeta": [
    "18 leituras recuperadas",
    "limite de isolamento: 7"
  ]
}
```

Não exibir seed ao aluno.

---

## 8. Objetivos/anotações

Objetivos não devem viver na HUD por padrão.

Guardar no Caderno do Caso:

```json
{
  "id": "trace_theo",
  "title": "Último passo confirmado",
  "text": "Theo entrou pela frente. O portão ainda conserva marcas de ritual.",
  "requires": ["intro_complete"],
  "hideWhen": ["gate_open"]
}
```

---

## 9. Grimório

Entrada recomendada:

```json
{
  "id": "arrays",
  "unlockFlag": "grimoire_arrays",
  "title": "Registros em sequência",
  "concept": "Array",
  "what": "...",
  "mentalModel": "...",
  "syntax": "...",
  "example": "...",
  "commonMistake": "...",
  "ritualUse": "..."
}
```

Isso é melhor do que um único `body` porque permite uma UI de livro mais rica.
