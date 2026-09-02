# Feedback consolidado — clareza do espaço do mentor

## Classificação

Regra reutilizável de produto e UI administrativa.

## Feedback observado

- ações sensíveis não podem parecer inertes nem depender apenas de diálogos nativos do navegador;
- um campo editável nunca deve ser usado apenas para exibir um valor, sobretudo em redefinição de senha;
- redefinir acesso precisa explicar o que foi alterado, quais sessões foram encerradas e qual é o próximo passo do investigador;
- identificadores normalizados em minúsculas não devem ser apresentados como se fossem o nome humano do investigador;
- o espaço do mentor precisa da mesma qualidade tipográfica e hierarquia visual do restante de Vesper, sem se tornar um mosaico de dashboard/SaaS.

## Aplicação

- a redefinição agora usa formulário explícito, confirmação da senha temporária, estado de envio e confirmação persistente;
- nome de exibição e identificador de login aparecem com papéis visuais distintos;
- equipe ativa, sessão do mentor, estado vazio, falha e exportação têm hierarquia própria;
- a página continua operacional e sóbria, com tabela como superfície principal e sem cards aninhados.

## Promovido para

- `docs/feedback/REJECTED_PATTERNS.md` como barreira contra diálogos nativos ambíguos e páginas operacionais sem estados visíveis.
