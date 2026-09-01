# Feedback consolidado — transições de tela vs. seleção in-place

## Classificação

Reutilizável (UI/engine). O usuário rejeitou a solução de um agente anterior que aplicou o fade de saída da tela de título inteira (`_animateTitleOut`) a ações que apenas atualizam estado no lugar (trocar rota de investigação e linguagem). Resultado observado: fade desnecessário da página inteira e tela presa invisível — "quebrou, não carrega".

## Aprendizados promovidos

- fade-out de tela inteira só precede saída real da tela (trocar de caso, iniciar/continuar investigação, navegação com reload);
- seleções in-place (rota de investigação, linguagem) nunca disparam transição de saída; usam micro-animação local (ex.: slide sutil do item ativo);
- ao atualizar estado sem navegar, sempre restaurar/garantir o estado visual final (opacity/transform) — uma transição de saída sem reentrada deixa a tela morta;
- `_animateTitleOut` em `src/ui/AppUI.js` é exclusivo de saída da tela de título; `_animateRouteSelect` cobre a troca de rota in-place.

## Promovido para

- `docs/feedback/REJECTED_PATTERNS.md` (seção UI);
- implementação de referência em `src/ui/AppUI.js` (`showTitle`, `_animateRouteSelect`).
