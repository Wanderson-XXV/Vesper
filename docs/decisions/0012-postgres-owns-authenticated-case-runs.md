# 0012 — PostgreSQL é a autoridade das investigações autenticadas

## Decisão

Uma investigação só pode iniciar ou continuar com sessão válida e banco disponível. O PostgreSQL é a fonte oficial do snapshot, das respostas e do histórico; o armazenamento do navegador é apenas cache de recuperação isolado por usuário e execução e nunca autoriza jogo offline.

Cada usuário possui no máximo uma execução ativa por caso e rota. Reiniciar arquiva a execução atual e cria a tentativa seguinte, preservando respostas e eventos para o mentor. Saves usam revisão otimista para impedir sobrescrita silenciosa entre abas ou dispositivos.

Estudantes entram por código obrigatório de equipe. Mentores são criados administrativamente e podem emitir senha temporária apenas para estudantes das próprias equipes.

## Consequência

O Hub pode continuar visível durante uma falha do serviço, mas iniciar, retomar e autenticar ficam bloqueados. “Salvar e sair” só encerra o caso após confirmação remota; slots manuais não fazem parte desta fase.
