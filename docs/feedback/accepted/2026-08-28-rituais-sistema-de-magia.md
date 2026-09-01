# Feedback consolidado — rituais como sistema de magia e caminho até os puzzles

## Classificação

Reutilizável / canon (promovido à decisão `docs/decisions/0011-rituais-como-sistema-de-magia-legivel.md`).

## Feedback do diretor (2026-08-28)

Os rituais não estavam funcionando como sistema de magia do mundo: soavam como "uma forma esquisitona de falar demais de programação". Diálogos dos Casos 01 e 02 falavam em medir coisas sem que o jogador entendesse o quê nem para quê; Tomás despachava tarefas ("faz isso") sem o jogador entender como aquilo ajudava, o que o ritual faria no mundo, nem o que o ritual de fato fazia na ficção. O caminho até os puzzles parecia jogado.

Referência positiva aprovada pelo diretor: o ritual do portão/contrapeso — abrir a tranca **equilibrando os níveis da fechadura** — porque a lei do mundo é legível e o código a formaliza. A escrita, porém, não conseguiu passar isso.

Instrução adicional: **não usar o texto atual do Caso 01 como referência de voz**; ele passará por revisão própria depois.

## Regras extraídas (já promovidas)

1. Ritual = declaração (lei escrita sem brecha) + trabalho (operação física na cena). Ver `VESPER_WORLD_CATALOG.md` → "Declaração e trabalho".
2. A lei do fenômeno cabe numa frase de personagem e é dita **antes** da HUD.
3. Personagens falam de objetos e marcas; a precisão técnica mora na face do instrumento (HUD).
4. O custo físico do erro é declarado antes da HUD.
5. A Protagonista reformula o objetivo, nunca o procedimento.
6. Verbos rituais não se repetem dentro de um caso (verbo por ritual: medir, classificar, contar, localizar, comparar/confrontar, alinhar/afinar, isolar, cruzar, estabilizar, interromper).

## Aplicação

Reescrita do Caso 02 (ver `docs/authoring/CASE02_REOUTLINE.md`): chegada com lacre rompido por dentro, frentes paralelas no Ato 1 (documentos, placa escondida, margem do índice, tópicos do Tomás), ritual 2 transformado em Confrontar (dois registros, dados autorais via gerador `fixed`), ritual avançado final transformado em Cruzar (filtrar células firmes antes de contar; a resposta ingênua global é propositalmente errada).

## Pendências registradas

- Asset de exterior/portão do observatório (hoje a chegada é conduzida por narração sobre o fundo da câmara).
- Geradores de engine `divergencePositions` e `crossReference` para replay variado dos rituais de confronto/cruzamento (hoje `fixed`; sem impacto por playthrough, pois o seed já é fixo).
- Revisão de voz do Caso 01 sob as mesmas regras (tarefa própria).
