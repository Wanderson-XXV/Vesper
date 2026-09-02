# Feedback consolidado — save preciso, conta e ícones

## Classificação

Regra reutilizável de arquitetura, produto e UI.

## Aprendizados promovidos

- retomada precisa reconstruir o ponto narrativo, não apenas a sala atual;
- `runId`, caso, rota, linguagem, versão e revisão precisam ser validados juntos no servidor;
- iniciar, retomar e criar nova tentativa são intenções diferentes;
- reiniciar deve preservar a tentativa arquivada e eventos já recebidos;
- falha de conclusão ou sincronização não pode ser escondida por um reload ou cartão de sucesso;
- cadastro, login, logout e troca de senha precisam ser testados como ciclo completo em ambiente hospedado;
- a conta deve abrir uma área própria, com confirmação para alterações sensíveis;
- o acesso autenticado deve aparecer como um avatar com o nome do usuário; logout fica dentro da área de conta, não como botão irmão no topo;
- controles de senha precisam de confirmação e mostrar/esconder acessível;
- ícones devem vir de uma biblioteca central, nunca de emoji ou glifos espalhados.

## Promovido para

- decisão `0013` — checkpoints precisos e gestão segura da conta;
- decisão `0014` — sistema central de ícones Lucide;
- `docs/architecture/ENGINE_ARCHITECTURE.md`;
- `docs/architecture/PLATFORM_ARCHITECTURE.md`;
- `docs/CURRENT_STATE.md`;
- `docs/architecture/IMPLEMENTATION_PLAN_2026-09-02.md`.

## Evidência da auditoria

O cursor de cena está somente em memória em `SceneEngine`; `continueGame()` renderiza a sala sem retomar a cena; `/api/runs/start` reutiliza uma execução ativa; e a API não compara todos os identificadores do payload com a execução persistida. O teste online completo ainda depende de `TEST_DATABASE_URL`.
