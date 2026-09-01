# Learning Track — Condicionais Iniciantes

## Público
Alunos que estão aprendendo principalmente:
- `if`;
- `if / else`;
- `else if`;
- operadores de comparação;
- condições combinadas simples.

Não exigir arrays ou loops como solução principal.

## Filosofia
Nesta track, o jogador não “processa muitos registros”. Ele **interpreta sinais e toma decisões**. Cada rito apresenta uma situação observável, uma leitura pontual e uma ação que muda o que os investigadores podem fazer em seguida.

Os valores nunca são números soltos: representam a resposta de um selo, o resíduo retido numa peça, a reação de uma moldura, o estado de uma passagem ou medidas de uma trava física.

A progressão pedagógica é linear, embora a investigação possa conter conteúdo opcional.

---

## Slot 0 — Portão: O Selo de Entrada

### Conceito
`if / else`

### Situação
O portão tem um selo de dupla resposta. Um ponteiro ritual pode repousar em `1` (o selo responde) ou `0` (o selo está apagado).

### Entrada
Um único inteiro: `0` ou `1`.

### Regra
- se `1`, imprimir `ROMPER`;
- senão, imprimir `IGNORAR`.

### Por que existe no mundo
Tomás precisa saber qual dos dois traços de giz ritual deve aplicar. Tocar um selo apagado com o traço de ruptura desperdiça reagente e pode fechar a trava novamente.

### Ajuda de Tomás
1. “Você só precisa responder uma pergunta: o selo ainda responde?”
2. “Se responde, há uma ação. Se não, há outra. Duas saídas.”

---

## Slot 1 — Hall: Triagem de uma Peça

### Conceito
comparação + `if / else`

### Situação
Um objeto ligado a Theo produz uma leitura de resíduo.

### Entrada
Um inteiro de `0` a `10`.

### Regra
- abaixo de `7`: `EXAMINAR`;
- `7` ou mais: `ISOLAR`.

### Função narrativa
Determina se o objeto pode ser examinado diretamente ou precisa entrar numa caixa de isolamento antes de revelar a próxima pista.

### Ajuda de Tomás
“Não está procurando um número específico. Está decidindo de que lado do limite a leitura caiu.”

---

## Slot 2 — Galeria: Estado da Moldura

### Conceito
`if / else if / else`

### Situação
Uma moldura reage à luz da maleta. A intensidade indica se ela pode ser observada, precisa ter o vidro fixado ou deve ficar sem toque.

### Entrada
Um inteiro de `0` a `10`.

### Regra
- `0–3`: `OBSERVAR`;
- `4–7`: `FIXAR`;
- `8–10`: `RECUAR`.

### Função narrativa
A resposta determina o procedimento seguro diante da moldura. Concluído o procedimento, a placa sob o retrato revela o número do trinco da escada.

### Ajuda de Tomás
“Começa pela faixa mais baixa. Depois testa a próxima. O que não couber em nenhuma das duas fica na última.”

---

## Slot 3 — Quarto: A Agulha Dupla

### Conceito
`&&` com `if / else`

### Situação
O detector de Theo possui dois indicadores: rastro encontrado e distorção presente na passagem.

### Entrada
Dois inteiros (`0` ou `1`): `rastro`, `distorcao`.

### Regra
- se `rastro == 1` **e** `distorcao == 0`: `SEGUIR`;
- caso contrário: `RECUAR`.

### Função narrativa
Decide se o corredor indicado no caderno de Theo pode ser atravessado naquele estado.

### Ajuda de Tomás
“Não basta uma das duas coisas estar certa. Para seguir, as duas condições precisam ser verdadeiras ao mesmo tempo.”

---

## Slot 4 — Escritório: Trava de Contrapeso

### Conceito
múltiplas variáveis + cálculo intermediário + `if / else if / else`

### Situação
Sob a escrivaninha, uma barra de metal está presa por um pino central. Um bloco fica em cada lado; a barra puxa a trava para o lado que exerce mais força.

### Entrada
Quatro inteiros, nesta ordem: massa esquerda, distância esquerda, massa direita, distância direita.

### Regra
- calcular `massaEsquerda * distanciaEsquerda`;
- calcular `massaDireita * distanciaDireita`;
- imprimir `ESQUERDA`, `DIREITA` ou `EQUILIBRIO` conforme o maior resultado — ou igualdade.

### Função narrativa
A resposta diz a Tomás onde prender a barra antes de abrir a gaveta. A escolha correta evita que a trava se mova e revela o segundo fundo da escrivaninha.

### Pré-requisito
Multiplicação e variáveis simples já devem ser conhecidos. O único salto novo do rito é organizar quatro medidas com nomes claros e comparar os dois resultados.

---

## Slot 5 — Porão: Decisão Final

### Conceito
condicionais compostas como integração

### Situação
A câmara final possui três sinais: resposta do selo, alinhamento da passagem e interferência.

### Entrada
Três valores simples.

### Regra proposta
- selo ativo + passagem alinhada + sem interferência → `ABRIR`;
- selo ativo + interferência → `CONTER`;
- qualquer outro estado → `ESPERAR`.

### Objetivo pedagógico
Combinar tudo sem transformar a tarefa em um loop ou array.

### Função narrativa
A resposta decide como o último selo é abordado e conduz à mesma revelação principal da campanha, preservando o conteúdo narrativo compartilhado.

## Transição para repetição

Esta track encerra a aprendizagem de condicionais no Porão. A ideia das lâmpadas e de sequências longas fica como passagem narrativa para a próxima track: depois que o jogador entende uma decisão isolada, encontra um rolo com muitos acionamentos do mesmo mecanismo. A pergunta deixa de ser “qual procedimento cabe agora?” e passa a ser “como aplicar a mesma regra a cada registro?”. Esse é o ponto de entrada natural para arrays e `for`, sem exigir repetição nesta track.

---

# Observação de autoria

As cenas de introdução de cada rito **precisam ser diferentes da track de arrays**. Não basta trocar o `challengeId`. O mundo deve apresentar dados compatíveis com a decisão de um único estado, não falar de dezenas de registros quando só há uma leitura.
