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
Nesta track, o jogador não “processa muitos registros”. Ele **interpreta sinais e toma decisões**. A fantasia é de leitura ritual: instrumentos, selos, cores, pressão, temperatura, posição de ponteiros, estados de mecanismos.

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
- abaixo de `7`: `MANUSEAR`;
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
Uma moldura reage ao exame e o ponteiro possui três faixas gravadas no mostrador.

### Entrada
Um inteiro de `0` a `10`.

### Regra
- `0–3`: `DORMENTE`;
- `4–7`: `ATIVA`;
- `8–10`: `HOSTIL`.

### Função narrativa
A classificação determina como o jogador examina a moldura e libera uma pista diferente sobre os retratos.

### Ajuda de Tomás
“Começa pela faixa mais baixa. Depois testa a próxima. O que não couber em nenhuma das duas fica na última.”

---

## Slot 3 — Quarto: A Agulha Dupla

### Conceito
`&&` com `if / else`

### Situação
O detector de Theo possui dois indicadores: selo ativo e interferência presente.

### Entrada
Dois inteiros (`0` ou `1`): `selo`, `interferencia`.

### Regra
- se `selo == 1` **e** `interferencia == 0`: `SEGUIR`;
- caso contrário: `RECUAR`.

### Função narrativa
Decide se o corredor indicado no caderno de Theo pode ser atravessado naquele estado.

### Ajuda de Tomás
“Não basta uma das duas coisas estar certa. Para seguir, as duas condições precisam ser verdadeiras ao mesmo tempo.”

---

## Slot 4 — Escritório: Três Estados do Mecanismo

### Conceito
faixas + `else if`

### Situação
O mecanismo oculto da escrivaninha apresenta pressão ritual.

### Entrada
Um inteiro de `0` a `12`.

### Regra
- `0–3`: `LIVRE`;
- `4–7`: `INSTÁVEL`;
- `8+`: `TRAVADO`.

### Função narrativa
A resposta correta determina se é seguro girar a peça, estabilizar antes ou procurar outra forma de abrir.

---

## Slot 5 — Porão: Decisão Final

### Conceito
condicionais compostas como integração

### Situação
A câmara final possui três sinais: presença do selo, resposta do mecanismo e interferência.

### Entrada
Três valores simples.

### Regra proposta
- selo ativo + mecanismo responde + sem interferência → `ABRIR`;
- selo ativo + interferência → `CONTER`;
- qualquer outro estado → `ESPERAR`.

### Objetivo pedagógico
Combinar tudo sem transformar a tarefa em um loop ou array.

### Função narrativa
A resposta decide como o último selo é abordado e conduz à mesma revelação principal da campanha, preservando o conteúdo narrativo compartilhado.

---

# Observação de autoria

As cenas de introdução de cada rito **precisam ser diferentes da track de arrays**. Não basta trocar o `challengeId`. O mundo deve apresentar dados compatíveis com a decisão de um único estado, não falar de dezenas de registros quando só há uma leitura.
