# Learning Tracks — trocar currículo sem duplicar a mansão

## Princípio

A história é uma camada. A progressão pedagógica é outra. Uma turma pode investigar o mesmo caso usando rituais diferentes.

## Arquivos

- `content/campaign.json` escolhe a track ativa.
- `content/tracks.json` mapeia slots narrativos para IDs de desafio.
- `content/challenges.json` contém as definições dos desafios.
- `content/scenes.json` chama **slots**, não IDs fixos.

Exemplo:

```json
{ "type": "startChallenge", "challengeSlot": "hall" }
```

Na track de arrays:

```json
"hall": "ritual_1"
```

Na track de condicionais:

```json
"hall": "ifelse_hall"
```

## Slots oficiais do Caso 01

- `gate` — tutorial inicial;
- `hall` — primeiro desafio real;
- `gallery` — segundo degrau;
- `bedroom` — terceiro degrau;
- `office` — quarto degrau;
- `basement` — clímax pedagógico.

## Track arrays_beginner

Status: **playable**.

Progressão: array + for + if → comparação com anterior → estado/reset → máximo → consecutivos.

## Track conditionals_beginner

Status: **authoring-ready**.

Objetivo: `if`, `else`, `else if`, condições combinadas. Os desafios-base já existem, mas cada slot precisa de uma pequena variante narrativa para não usar diálogos escritos para arrays.

## Regra para criar uma track nova

1. liste o que o aluno já sabe;
2. limite cada ritual a no máximo um conceito novo principal;
3. preserve cenário, NPCs e mistério;
4. escreva somente as cenas de contexto que realmente precisam mudar;
5. mapeie os mesmos slots para desafios novos;
6. valide com `npm run validate`;
7. faça um teste de mesa perguntando: “o aluno consegue explicar em português o que o programa precisa fazer?”.
