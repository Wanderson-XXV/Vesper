# Matriz curricular de Vesper

## Regra

Conceitos formam um grafo de pré-requisitos. Uma rota seleciona um caminho coerente; um caso declara quais rotas suporta. Liberdade narrativa não autoriza saltos pedagógicos silenciosos.

| Conceito | Pré-requisitos | Movimento mental principal | Rotas atuais |
|---|---|---|---|
| `conditionals` | comparação e booleanos | escolher ação por condição | `conditionals_beginner` |
| `loops` | condicionais | repetir o mesmo procedimento | `bridge_loops_arrays`, `arrays_beginner` |
| `arrays` | variáveis + loops introdutórios | percorrer dados ordenados | `bridge_loops_arrays`, `arrays_beginner` |
| `state` | arrays + comparação | lembrar o percurso atual | `bridge_loops_arrays`, `arrays_beginner` |
| `two_dimensional_arrays` | arrays + loops | localizar por linha e coluna | `advanced_collections` |
| `nested_loops` | loops + matriz | percorrer cada célula | `advanced_collections` |
| `maps` | variáveis + estruturas | associar chave e valor | `advanced_collections` |
| `frequency` | maps + loops | acumular e comparar contagens | `advanced_collections` |
| `objects` | métodos + estado | agrupar identidade e comportamento | planejado |
| `robotics_io` | funções + APIs da plataforma | separar lógica de sensores/atuadores | planejado |

## Variantes de linguagem

- a rota descreve a competência, não a sintaxe;
- cada adaptador declara linguagem, bibliotecas permitidas, template e exemplos;
- ausência de adaptador remove aquela linguagem da seleção do caso;
- Pybricks é uma variante de MicroPython com hardware; lógica simulada deve ser marcada explicitamente.

