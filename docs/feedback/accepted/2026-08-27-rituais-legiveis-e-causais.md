# Feedback consolidado — rituais legíveis e causais

## Classificação

Reutilizável para autoria narrativa e pedagógica.

## Decisão de autoria

Um ritual não pode depender de objetos góticos vagos ou de terminologia não apresentada apenas para produzir atmosfera. Antes de abrir a HUD, o jogador deve conseguir visualizar:

1. o objeto ou mecanismo concreto que está diante dele;
2. o que cada leitura representa fisicamente no mundo;
3. qual ação ou risco depende da resposta;
4. o que mudará na cena quando a decisão for tomada.

Objetos específicos do cenário são bem-vindos quando sua função está clara no contexto. Nomes como "relíquia", "medalhão" ou "instrumento ritual" não substituem essa explicação.

## Consequência para a pedagogia

O código formaliza uma operação que os personagens já precisam executar no mundo. A escolha de variáveis, comparações e saídas deve nascer dessa operação, e não receber uma decoração gótica depois. O jogador deve poder pensar primeiro no ritual e, então, reconhecer que a solução em Java o formaliza.

## Aplicação inicial

Ao concluir `conditionals_beginner`, revisar cada introdução de ritual com essa cadeia: situação observável -> dado identificado -> decisão necessária -> consequência imediata. Não mudar a história-base nem criar outro mistério apenas para acomodar o exercício.

## Complemento — transformações de sequência

Quando o ritual pede uma coluna derivada, e não uma resposta final única, o texto deve dizer explicitamente qual valor deve ser escrito para **cada** leitura. Antes da HUD, inclua uma amostra curta que mostre a regra em funcionamento (por exemplo, `1 1 0 1` se torna `1 2 0 1`). Termos como “nível acumulado”, sem essa correspondência, deixam a tarefa ambígua mesmo quando a regra interna está correta.
