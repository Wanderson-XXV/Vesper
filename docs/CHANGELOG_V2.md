# Vesper MVP 0.2 — revisão de direção

Esta revisão responde ao primeiro playtest visual.

## Mudanças principais

- Menu inicial agora é uma tela preta de arquivo/caso, sem revelar a mansão antes do início.
- Exploração usa um painel de ações menor e remove descrições persistentes de ambiente.
- Ao iniciar uma cena, os menus da sala são limpos para não competir com o diálogo.
- Diálogos agora reservam espaço para o portrait do personagem que está falando.
- `characters.json` continua aceitando `portrait`; enquanto não houver asset real, a engine usa silhueta provisória.
- Tipografia foi separada em três papéis: UI, narrativa e dados de ritual.
- Foi criado `content/objectives.json` para guiar o aluno com um “Fio Atual” diegético.
- Rituais importantes são discretamente marcados com `∴` no menu da sala.
- Portas ainda bloqueadas deixam de aparecer como botões genéricos; surgem quando a história libera o caminho.
- Os cinco rituais continuam didaticamente lineares, embora a investigação opcional entre eles continue livre.
- Diálogos, narrações, descrições de pistas e textos dos desafios foram reescritos para reduzir exposição e respostas prontas.
- Abrir o Grimório durante um ritual não gera mais uma seed nova ao retornar.

## Portraits

Em `content/characters.json`, adicione por exemplo:

```json
"portrait": "./assets/characters/tomas.png"
```

A UI usará automaticamente esse arquivo tanto no menu de conversa quanto durante as falas.
