# UI / UX Bible — Vesper

## 1. Direção visual

A interface deve parecer parte de uma experiência de horror gótico, não uma aplicação web moderna.

### Referência principal
**No, I’m Not a Human** como referência de composição:

- personagem grande;
- cenário visível;
- caixa de diálogo simples e estável;
- escolhas escuras e legíveis;
- evidências em destaque;
- textura/vinheta/ruído;
- pouca HUD permanente.

---

## 2. Retratos e sprites

### Durante diálogo

- usar personagem em escala grande, aproximadamente de meio-corpo a corpo inteiro;
- sprite integrado ao cenário;
- evitar retângulo verde sólido atrás do personagem;
- preferir PNG transparente + sombra/vinheta discreta;
- personagem pode ocupar 25–35% da largura da tela;
- cabeça nunca deve ser cortada;
- enquadramento consistente por personagem.

### Em menu de conversa

- usar o mesmo sprite, um pouco maior;
- nome e função discretos abaixo/lateral;
- sem card que pareça ficha de CRM.

### Em “Pessoas”

- somente personagens já conhecidos pelo jogador;
- personagem desaparecido não aparece até ser revelado em cena;
- não mostrar conteúdo que o jogador ainda não sabe.

---

## 3. Caixa de diálogo

### Regra fixa
**Toda fala e toda narração usa a mesma caixa-base, na mesma posição e com o mesmo tamanho.**

A diferença de estado deve vir por:

- portrait presente ou ausente;
- cor do nome;
- itálico da narração;
- pequeno detalhe de estilo;
- nunca por mudar drasticamente largura/altura/posição.

### Comportamento

- clique 1 / Enter / Espaço: completa texto;
- clique 2 / Enter / Espaço: avança;
- em evento bloqueado, input não avança;
- texto deve ter largura confortável para leitura.

---

## 4. Exploração

Os rótulos devem ser contextuais.

Evitar “NA SALA” no exterior.

Preferência:

- **AÇÕES**
- **PESSOAS**
- **ACESSOS**

ou, se o layout ficar mais limpo, omitir títulos redundantes.

Nunca mostrar muitas ações simultaneamente se a narrativa ainda não ensinou o jogador a usá-las.

---

## 5. Topbar

A topbar deve ser mínima.

### Permitido

- nome do local;
- Inventário;
- Opções;
- indicador discreto de Presença, se necessário.

### Não mostrar permanentemente

- objetivo narrativo completo;
- spoilers;
- códigos internos;
- número de ritual;
- seed;
- dados que pertencem ao inventário.

### Tipografia desejada

- títulos / nomes: serifada gótica elegante;
- texto de diálogo: serifada legível;
- UI funcional: fonte forte e compacta, sem cara de dashboard.

Sugestões de direção (não obrigação):

- `Cormorant Garamond` / `EB Garamond` para narrativa;
- `IM FELL English SC` ou `Cormorant SC` para pequenos títulos;
- uma sans discreta apenas para controles técnicos.

---

## 6. Documentos e evidências

A tela de documento foi aprovada como direção: papel antigo / material físico.

### Botão Guardar

**Guardar deve:**

1. adicionar a evidência ao Arquivo;
2. tocar SFX curto de papel/arquivo;
3. fechar a visualização do documento;
4. somente então continuar a cena.

Nunca continuar a história por trás do documento aberto.

### Estado após guardar

Se a mesma evidência for reaberta pelo Arquivo, o botão deve ser **Fechar**, não Guardar.

---

## 7. Inventário

O Inventário é o hub pessoal do investigador.

Pode conter:

- Caderno/Arquivo do Caso;
- Grimório;
- itens físicos;
- Pessoas conhecidas;
- próximo passo/anotação, se necessário.

A protagonista pode ter uma fala curta **na primeira vez** que o menu é aberto, mas não deve repetir um texto de pitch toda vez.

Natural:
> “É aqui que eu guardo o que já consegui confirmar. Se eu esquecer uma regra, o Grimório está junto.”

Artificial:
> “Não é só documentação. É um caderno de sobrevivência com ideias curtas e padrões úteis...”

---

## 8. Grimório

O Grimório deve parecer um **objeto antigo**, não um painel técnico.

### Visual

- papel envelhecido;
- textura de livro/caderno;
- títulos em tinta;
- abas/marcadores discretos;
- código inserido como trecho técnico dentro da página;
- evitar grandes blocos negros de UI cyberpunk ao redor de tudo.

### Estrutura de cada entrada

1. **O que é** — explicação simples;
2. **Como pensar** — modelo mental;
3. **Forma em Java** — sintaxe;
4. **Exemplo curto**;
5. **Erro comum**;
6. **Quando eu usaria isso num ritual**.

### Progressão

Não mostrar conceitos ainda não desbloqueados.

O Grimório cresce junto com o aluno.

---

## 9. Ritual

A interface do ritual pode ser mais técnica que o restante, mas ainda pertence ao mundo.

### Não mostrar

- `SEED`;
- códigos internos de geração;
- labels de debug;
- termos que revelam a implementação da engine.

### Pode mostrar

- quantidade de registros em linguagem natural;
- limite de leitura;
- transcrição dos dados;
- objetivo do ritual;
- botão Copiar Registro;
- campo de resposta;
- Abrir Grimório;
- Pedir orientação a Tomás.

### Exemplo

Em vez de:
`SEED FFC3FD5A / N=18 / LIMIAR >= 7`

usar:

`18 leituras recuperadas`  ·  `limite de isolamento: 7`

---

## 10. Áudio

Configurações devem separar:

- **Master**;
- **Música**;
- **Efeitos sonoros**.

Volume final de música = Master × Música.
Volume final de SFX = Master × SFX.

Objetivo: permitir música baixa e efeitos claramente audíveis.
