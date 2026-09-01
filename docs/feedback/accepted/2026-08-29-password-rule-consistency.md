# Feedback consolidado — consistência da senha no ambiente interno

## Classificação

Feedback reutilizável de operação e onboarding.

## Aprendizado promovido

- O comando interno de criação/atualização de mentor deve usar o mesmo mínimo de 8 caracteres já aplicado ao cadastro e à troca de senha.
- Não adicionar requisitos mais rígidos em comandos de desenvolvimento/operação sem uma decisão explícita de produto ou segurança.
- No ambiente local interno, o mentor de teste deve ser provisionado automaticamente pelo bootstrap do Compose; não exigir um comando manual separado para começar a testar.

## Aplicação

`server/create-mentor.mjs` agora aceita `MENTOR_PASSWORD` com 8 ou mais caracteres, mantendo a exigência de autenticação e hash Argon2id.
