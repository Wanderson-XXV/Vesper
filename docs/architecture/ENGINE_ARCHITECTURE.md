# Engine Architecture

## Objetivo
A engine interpreta conteúdo; a campanha descreve o que acontece. Evitar conteúdo narrativo hardcoded em `src/`.

## Camadas

### `src/engine/`
- `ContentLoader.js`: carrega catálogo e pacote do caso selecionado;
- `GameState.js`: perfil global, save por caso/rota, flags, eventos, recompensas e migração do save legado;
- `ConditionEngine.js`: requirements/hideWhen;
- `SceneEngine.js`: fila de eventos narrativos;
- `ChallengeEngine.js`: gera/valida rituais;
- `AudioManager.js`: música/SFX e volumes.

### `src/ui/`
`AppUI.js` renderiza estados de jogo. Deve receber dados do conteúdo, não conhecer o roteiro.

### `content/`
Autoridade para salas, cenas, NPCs, desafios, tracks, Grimório e objetivos.

## Princípios técnicos
- cenas usam eventos declarativos;
- condições usam operadores conhecidos, não JavaScript arbitrário;
- learning tracks mapeiam slots narrativos para desafios/cenas específicos;
- saves são separados por caso e track; linguagem pertence ao perfil e à execução;
- escolhas são eventos explícitos e finais possuem `endingId`;
- recompensas usam ledger idempotente;
- mudanças puramente narrativas devem evitar tocar engine;
- novo comportamento recorrente pode justificar novo tipo de evento.

## Quando alterar engine
Só quando o conteúdo atual não consegue expressar uma necessidade reaproveitável. Se a solução serve apenas a uma frase/cena, provavelmente pertence ao JSON.

## Persistência online

Investigações exigem sessão e PostgreSQL disponíveis. Snapshots e eventos são sincronizados com revisão otimista; o `localStorage` é somente cache de recuperação isolado por conta e execução. O servidor valida autoria, acesso por equipe e recompensas; o cliente não é autoridade para XP, resposta premiada ou retomada.
