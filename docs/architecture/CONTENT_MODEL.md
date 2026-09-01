# Content Model

## Topologia multicase

`content/catalog.json` lista casos e seus `contentPath`. Cada diretório em `content/cases/<caseId>/` contém um pacote completo de campanha, salas, personagens, cenas, desafios, objetivos, tracks e Grimório.

IDs e flags específicos devem usar prefixo do caso. O carregamento resolve, nesta ordem: `caseId → routeId/learningTrack → languageId`.

`campaign.json` também declara `contentVersion`, linguagens, personagens inicialmente conhecidos, recompensas e versão do contrato ritual.

## `scenes.json`
Cena = sequência ordenada de eventos.

Eventos comuns:
- `say`
- `wait`
- `sound`
- `music`
- `showEvidence`
- `setFlag`
- `addClue`
- `startChallenge` / `challengeSlot`
- `gotoRoom`
- `choice` com opções, flags, relação e cena de destino;
- `endCase` com `endingId`, texto e recompensas de conclusão.

Regras:
- preservar IDs quando possível;
- texto de NPC fica aqui, não em UI;
- cenas de ritual precisam estar alinhadas à track ativa.

## `characters.json`
Campos principais:
- `id`, `name`, `role`, `description`, `portrait`;
- `topics[]` com `label`, `scene`, `requires`;
- `profile` para Arquivo de Campo;
- `revealWhen` quando o personagem não é conhecido no início.

## `rooms.json`
Sala define:
- background/estado visual;
- interações;
- NPCs presentes;
- conexões;
- requisitos e flags.

## `challenges.json`
Desafio define o gerador/entrada, resposta, textos de HUD, dicas e consequência. Não colocar detalhes pedagógicos metalinguísticos em fala de NPC.

Casos com `ritualContractVersion` exigem `ritualContract` completo. O problema semântico fica no desafio; exemplos/sintaxe ficam no Grimório e nos adaptadores de linguagem.

## `tracks.json`
Mapeia slots (`gate`, `hall`, `gallery`, `bedroom`, `office`, `basement`) para desafios e cenas da track.

Uma track deve conseguir mudar o currículo sem duplicar toda a mansão.

## `grimoire.json`
Entrada ideal contém:
- `what`;
- `mentalModel`;
- `syntax`;
- `example`;
- `pythonSyntax` e `pythonExample` quando houver a alternativa em Python;
- `commonMistake`;
- `ritualUse`;
- notas diegéticas quando fizer sentido.

## Flags
Flags narrativas devem expressar fatos do mundo, não detalhes de implementação. Ex.: `found_2009_report`, não `button3_enabled`.

Flags são locais ao `caseRun`. Apenas fatos declarados para continuidade são promovidos ao perfil global.
