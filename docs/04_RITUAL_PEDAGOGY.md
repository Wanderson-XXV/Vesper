# Ritual Pedagogy — como ensinar programação dentro da aventura

## 1. O que é um ritual

Um ritual é um problema do mundo que pode ser formalizado como uma regra computacional.

O jogador precisa:

1. entender a situação;
2. identificar o que precisa descobrir;
3. receber dados;
4. escrever código em Java fora do jogo;
5. executar;
6. informar a saída;
7. observar a consequência narrativa.

---

## 2. Estrutura obrigatória de um ritual

### A. Situação
O mundo apresenta um problema concreto.

### B. Stakes
Por que precisamos resolver isso agora?

### C. Dados
O instrumento/registro fornece os valores.

### D. Parafraseamento
A protagonista ou Tomás confirma o que exatamente deve ser obtido.

### E. Ritual
A UI apresenta somente os dados necessários.

### F. Ajuda opcional
Grimório e Tomás.

### G. Consequência
Algo muda no mundo.

---

## 3. Tomás como mentor

Tomás deve explicar **o fenômeno antes do algoritmo**.

Exemplo ruim:
> “Sete pra cima vai pro saco preto. Me diz quantos.”

Exemplo correto:
> “O leitor mede o resíduo de cada objeto. Sete é o limite de segurança. Tudo que marcar sete ou mais precisa ser isolado antes que a gente mexa no restante.”

Protagonista:
> “Então eu só preciso descobrir quantos passaram do limite.”

Tomás:
> “Isso.”

A tela do ritual abre depois dessa confirmação.

---

## 4. Escada de ajuda

Cada ritual deve possuir até três dicas.

### Dica 1 — raciocínio
> “Olha uma leitura de cada vez. Para cada uma, decide se ela entra na contagem.”

### Dica 2 — estrutura
> “Um `for` pode percorrer as leituras. Dentro dele, um `if` decide se aquela leitura conta.”

### Dica 3 — operacional
> “Começa um contador em zero. Quando a leitura atual for 7 ou maior, aumenta esse contador.”

Evitar entregar código completo na dica, salvo quando o objetivo da aula é aprender sintaxe muito inicial.

---

## 5. Ritual 0 — tutorial

O primeiro ritual é propositalmente fácil.

Exemplo:
`1 0 1 1 0 1`

Objetivo:
contar quantos selos estão ativos.

O aluno pode contar no olho. Isso é aceitável.

A função desse ritual é ensinar o fluxo da mecânica.

---

## 6. Track A — Arrays / for / if

Progressão atual sugerida:

### Ritual 0 — Selos do portão
- array simples;
- for;
- if;
- contador;
- 6 valores.

### Ritual 1 — Triagem de objetos
- array;
- for;
- if com comparação;
- contador;
- ~15–20 valores.

### Ritual 2 — Linhagens da galeria
- comparar atual com anterior;
- mudança de grupos.

### Ritual 3 — Interferência de Theo
- estado que cresce/reseta.

### Ritual 4 — Maior leitura
- máximo.

### Ritual final — estabilidade
- combinar comparação + estado + máximo;
- equivalente ao problema de consecutivos.

---

## 7. Track B — alunos iniciando if / else

Essa track deve poder usar a mesma mansão e história com rituais diferentes.

### Objetivo pedagógico

- compreender condição verdadeira/falsa;
- escolher ação A ou B;
- construir `if`, `else if`, `else`;
- só depois introduzir repetição.

### Sugestões de rituais

#### Ritual 0 — Chave do portão
Uma única leitura.

Regra:
- se o símbolo estiver ativo (`1`), usar a chave ritual A;
- senão, usar a chave ritual B.

Saída: `A` ou `B`.

#### Ritual 1 — Frasco seguro ou contaminado
Uma leitura numérica.

- `< 7`: SEGURO
- `>= 7`: ISOLAR

#### Ritual 2 — Três níveis de interferência

- abaixo de 4: ESTÁVEL
- 4 a 7: ALERTA
- acima de 7: PERIGO

Trabalha `if / else if / else`.

#### Ritual 3 — Escolha de rota
Combinar duas condições simples.

Exemplo:
- porta possui selo?
- corredor possui interferência?

O resultado define uma ação narrativa.

#### Depois
Introduzir `for` ou `while` quando fizer sentido para processar muitos registros.

---

## 8. Sistema de tracks

A história não deve ser duplicada inteira sempre que muda o currículo.

Ideal arquitetural:

```json
"learningTrack": "arrays_beginner"
```

E slots narrativos:

```json
"ritualSlots": {
  "gate": "ritual_gate_arrays",
  "hall": "ritual_hall_arrays",
  "gallery": "ritual_gallery_arrays"
}
```

Outra campanha/track pode substituir apenas esses IDs:

```json
"learningTrack": "conditionals_beginner",
"ritualSlots": {
  "gate": "ritual_gate_ifelse",
  "hall": "ritual_hall_ifelse",
  "gallery": "ritual_gallery_ifelse"
}
```

Assim cenário, personagens e mistério podem ser compartilhados.

---

## 9. Critério de dificuldade

Antes de aprovar um ritual, responder:

- Quantos conceitos novos aparecem aqui?
- Qual foi o último ritual concluído?
- Existe uma habilidade nova ou apenas combinação de habilidades conhecidas?
- Um aluno consegue explicar em português o que o programa deve fazer antes de escrever código?

Se a resposta à última pergunta for não, o problema está mal apresentado.
