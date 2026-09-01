# Repo Map — onde editar cada coisa

> Este mapa deve ser atualizado sempre que a estrutura mudar.

## Conteúdo

### História e cenas
`content/scenes.json`

Use para:
- diálogos;
- narração;
- flags;
- eventos;
- evidências;
- gatilhos de ritual.

### Personagens e perguntas
`content/characters.json`

Use para:
- nome;
- função;
- portrait;
- tópicos de conversa;
- requisitos para mostrar perguntas.

### Salas e conexões
`content/rooms.json`

Use para:
- background;
- ações disponíveis;
- NPCs presentes;
- portas/conexões;
- requisitos de acesso.

### Rituais
`content/challenges.json`

Use para:
- tipo de gerador;
- quantidade de dados;
- objetivo;
- dicas;
- cena de sucesso.

### Grimório
`content/grimoire.json`

Use para:
- conceitos ensinados;
- exemplos Java;
- progressão de conhecimento.

### Próximo passo do caso
`content/objectives.json`

Preferir usar como **Anotações do Caso**, não como HUD permanente.

### Learning tracks
`content/tracks.json`

Use para:
- mapear slots narrativos para rituais;
- manter versões pedagógicas diferentes da mesma aventura;
- trocar currículo sem duplicar salas e mistério.

### Campanha
`content/campaign.json`

Use para:
- título;
- sala inicial;
- cena inicial;
- áudio;
- configurações globais da campanha.

---

## Engine

### `src/engine/GameState.js`
Save, flags, progresso, configurações.

### `src/engine/SceneEngine.js`
Como eventos narrativos são executados.

### `src/engine/ChallengeEngine.js`
Como entradas são geradas e respostas calculadas.

### `src/engine/AudioManager.js`
Música e SFX.

---

## UI

### `src/ui/AppUI.js`
Renderiza:
- exploração;
- conversa;
- diálogo;
- documento;
- ritual;
- inventário;
- grimório;
- opções.

### `src/styles/main.css`
Tipografia, layout, caixas, retratos, modais, filtros e responsividade.

---

## Regra prática para manutenção

Antes de editar algo, identifique a categoria:

- “quero mudar o que Tomás fala” → `scenes.json`
- “quero que essa pergunta só apareça depois de uma pista” → `characters.json` + flag em `scenes.json`
- “quero outro exercício” → `challenges.json`
- “quero mudar a sala conectada” → `rooms.json`
- “quero mudar a aparência da caixa” → `main.css`
- “quero um novo tipo de comportamento de cena” → engine

Se uma mudança de conteúdo exigir editar React/UI, verificar se a engine está acoplada demais.
