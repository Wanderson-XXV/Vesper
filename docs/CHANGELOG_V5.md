# Changelog V5

## P0

- fluxo Guardar documento corrigido;
- celular/mensagens instantâneas removidos da introdução;
- personagem desaparecido protegido por `knownCharacters`;
- SEED/debug removidos da UI dos rituais;
- áudio separado em Master/Música/SFX.

## Visual

- portraits transparentes integrados ao cenário;
- caixa de diálogo fixa para personagem/narração;
- topbar com linguagem tipográfica mais gótica;
- Grimório reconstruído como livro de duas páginas;
- código continua legível dentro de páginas físicas.

## Narrativa / pedagogia

- introdução com carruagem e telegrama;
- motivo dos investigadores especializado reforçado;
- perguntas dependem de flags narrativas;
- Tomás reescrito nos primeiros rituais;
- Ritual 0 e Ritual 1 recebem mais contexto ritualístico;
- protagonista parafraseia o problema antes da UI.

## Arquitetura

- `knownCharacters`;
- evento `discoverCharacter`;
- `learningTrack`;
- `challengeSlot`;
- `content/tracks.json`;
- track `conditionals_beginner` preparada para autoria;
- validador atualizado para tracks e slots.
