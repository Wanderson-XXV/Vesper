# Vesper Engine — especificação do MVP

## Objetivo

Separar **engine** e **campanha**. A engine não sabe quem é Tomás, o que é Vesper ou qual ritual vem primeiro. Ela apenas interpreta conteúdo declarativo.

## Fluxo

`Sala → interação/NPC/passagem → cena → eventos → mudança de GameState → sala`

O `GameState` persistido contém:

- `currentRoom`
- `flags`
- `visitedRooms`
- `completedInteractions`
- `completedChallenges`
- `clues`
- `inventory`
- `presence`
- `challengeAttempts`
- `challengeSeeds`
- `settings`

## Módulos

### `ContentLoader.js`
Carrega JSONs e constrói mapas de acesso rápido.

### `GameState.js`
Save/load em `localStorage`, flags, pistas, progresso e Presença.

### `ConditionEngine.js`
Centraliza requisitos por flags e condições narrativas.

### `ChallengeEngine.js`
Gera entradas determinísticas por seed e calcula a resposta esperada.

Geradores presentes:

- `thresholdCount`
- `groupCount`
- `stateTrace`
- `maxValue`
- `longestRun`

Novos tipos devem ser adicionados aqui, não dentro de componentes de UI.

### `SceneEngine.js`
Executa uma fila de eventos declarativos.

Eventos atuais:

- `say`
- `wait`
- `sound`
- `music`
- `stopMusic`
- `setFlag`
- `addClue`
- `showEvidence`
- `startChallenge`
- `scene`
- `conditionalScene`
- `clockObservation`
- `endCase`

### `AudioManager.js`
Música remota opcional e SFX sintetizados como fallback.

### `AppUI.js`
Renderização da sala, menus, conversas, arquivo, Grimório e desafios. Não contém diálogos da campanha.

## Pacing de cenas

Eventos são sequenciais. Um `say` só termina quando o jogador confirma; um `wait` bloqueia a fila; um `sound` pode ser bloqueante. Isso permite:

`fala → wait 900ms → toc → wait 650ms → toc → fala`

sem depender de um timer iniciado antes de o jogador terminar de ler.

## Progressão pedagógica

A liberdade espacial é maior que a liberdade dos rituais. A campanha bloqueia conexões com flags:

1. Ritual I → libera Galeria
2. Ritual II → libera Ala Privada
3. Ritual III → libera Escritório
4. Ritual IV → libera Porão
5. Ritual V → encerra o caso

Assim a investigação parece menos linear, mas o conhecimento é apresentado em escada.
