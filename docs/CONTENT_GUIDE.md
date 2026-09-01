# Guia rápido de conteúdo

## Adicionar uma sala

Em `content/rooms.json`:

```json
{
  "id": "cozinha",
  "name": "Cozinha",
  "background": "./assets/rooms/cozinha.png",
  "description": "Descrição curta.",
  "firstEnterScene": "kitchen_first",
  "connections": [
    { "to": "hall", "label": "Voltar ao hall" }
  ],
  "interactions": [
    { "id": "drawer", "label": "Abrir gaveta", "scene": "kitchen_drawer", "once": true }
  ],
  "npcs": []
}
```

## Bloquear uma conexão

```json
{
  "to": "porao",
  "label": "Descer para o porão",
  "requires": ["ritual_4_completed"]
}
```

A conexão só fica disponível quando todas as flags em `requires` são verdadeiras.

## Criar uma cena

Em `content/scenes.json`:

```json
"kitchen_first": {
  "events": [
    { "type": "say", "speaker": "Narrador", "text": "A torneira pinga." },
    { "type": "wait", "duration": 900 },
    { "type": "sound", "sound": "knock", "blocking": true, "duration": 300 },
    { "type": "setFlag", "flag": "heard_kitchen_noise", "value": true }
  ]
}
```

## Conversas e confrontos

No personagem:

```json
{
  "id": "confront",
  "label": "Confrontar sobre o relatório",
  "scene": "tomas_confront_2009",
  "requires": ["found_2009_report"]
}
```

Isso faz a opção aparecer somente depois da evidência.

## Retratos de personagem

Adicione uma imagem em `assets/characters/` e informe:

```json
"portrait": "./assets/characters/tomas.png"
```

Sem esse campo, a UI mostra um placeholder estilizado.

## Novo ritual

Adicione uma entrada em `challenges.json`, uma cena de introdução com `startChallenge` e uma cena de sucesso. Se precisar de uma lógica nova de geração/validação, crie um novo `generator.type` em `ChallengeEngine.js`.

## Regra de roteiro recomendada

Não use diálogos para explicar algo que pode ser descoberto por uma evidência ou por uma consequência no ambiente. O código deve resolver um problema do mundo, não um enunciado escolar desconectado.
