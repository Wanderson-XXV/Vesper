# V5 Backlog — decisões aprovadas

Esta lista registra feedback já aceito e não deve ser “rediscutido” a cada versão.

## Prioridade P0 — bugs / quebra de imersão

- [x] Corrigir **Guardar documento**: adicionar ao Arquivo, tocar SFX, fechar overlay e só então continuar cena.
- [x] Remover celular/mensagens instantâneas da introdução e reescrever usando meio coerente com o setting.
- [x] Não mostrar Theo em Pessoas antes de sua imagem/identidade ser revelada.
- [x] Remover `SEED` da UI do ritual.
- [x] Separar volume em **Master / Música / SFX**.

## Prioridade P1 — consistência visual

- [x] Retratos maiores, integrados ao cenário e sem retângulo verde sólido.
- [x] Fixar **mesmo tamanho e posição** da caixa-base para personagem e narração.
- [x] Refinar fonte da topbar para algo mais atmosférico e menos genérico.
- [x] Tornar Grimório visualmente um livro/caderno antigo.
- [x] Manter código em bloco legível, mas dentro de página tematizada.

## Prioridade P1 — narrativa

- [x] Reescrever introdução sem tecnologia moderna.
- [x] Reforçar ligeiramente por que investigadores especializados foram chamados.
- [x] Só desbloquear perguntas de conversa depois que o assunto foi apresentado.
- [x] Revisar todas as falas de Tomás: econômico, mas claro.
- [x] Dar mais contexto ritualístico antes de abrir os dois primeiros desafios.
- [x] Protagonista deve verbalizar o problema lógico em linguagem natural antes da tela do ritual.

## Prioridade P1 — Grimório

- [x] Remover texto-pitch “não é só documentação...”
- [x] Primeira abertura: fala natural e curta da protagonista.
- [x] Expandir entradas para: o que é / como pensar / sintaxe / exemplo / erro comum / uso ritual.
- [x] Mostrar apenas conhecimentos desbloqueados.

## Prioridade P2 — arquitetura para amanhã

- [x] Criar suporte conceitual a **learning tracks**.
- [x] Manter track atual de arrays/for/if.
- [x] Criar track para alunos iniciando `if / else`.
- [x] Evitar duplicar história inteira: trocar slots de ritual e pequenas cenas associadas.

## Critérios de aceite da V5

A V5 só é considerada melhor se:

1. um jogador novo entende quem é, por que está na mansão e o que procura;
2. nenhum elemento moderno quebra o setting;
3. primeira conversa não oferece perguntas sem contexto;
4. primeiro ritual parece parte do mundo, não um modal de plataforma de exercícios;
5. documento pode ser guardado sem a cena continuar atrás dele;
6. música pode ficar baixa sem reduzir SFX;
7. Grimório parece um objeto da aventura;
8. a UI não revela dados internos da engine.


## Observação pós-implementação

A track `conditionals_beginner` foi criada como estrutura e conjunto de desafios protótipo, mas permanece marcada como `authoring-ready`: antes de ativá-la, escrever as pequenas variações de cena que apresentam cada problema em linguagem coerente com `if / else`.
