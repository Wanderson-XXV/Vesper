# Implantação VPS

## Produção

1. instale Docker Engine e o plugin Compose numa VPS Linux;
2. copie `../.env.example` para `deploy/.env` e troque todas as credenciais; o arquivo de exemplo fica na raiz do repositório;
3. aponte o DNS de `DOMAIN` para a VPS;
4. dentro de `deploy/`, execute `docker compose --env-file .env -f docker-compose.yml up -d --build`;
5. confirme que `https://<DOMAIN>/api/health` responde com `database: true`;
6. crie o primeiro mentor no container da aplicação:

```bash
docker compose --env-file .env -f docker-compose.yml exec \
  -e MENTOR_USERNAME=professor \
  -e MENTOR_PASSWORD='troque-esta-senha-longa' app npm run user:create-mentor
```

7. abra `/mentor.html`, crie uma equipe e entregue seu código aos alunos. O cadastro estudantil exige esse código.

Em qualquer ambiente, a aplicação encerra imediatamente sem `DATABASE_URL`; não existe fallback jogável offline. O teste local também deve usar o Compose, para reproduzir o fluxo com PostgreSQL, cookies e autenticação.

## Teste local

Para executar o Compose a partir da raiz do repositório, mantenha o `.env` também na raiz e passe-o explicitamente:

```powershell
docker compose --env-file .env -f deploy/docker-compose.yml up -d --build
```

Para HTTP local, use `DOMAIN=http://localhost`, `HTTP_PORT=3005` e `COOKIE_SECURE=false`. A porta publicada para o navegador será `http://localhost:3005`. Em VPS, use um domínio real e `COOKIE_SECURE=true`.

Após o primeiro `up`, crie o mentor inicial e uma equipe:

```powershell
docker compose --env-file .env -f deploy/docker-compose.yml exec `
  -e MENTOR_USERNAME=wanderson `
  -e MENTOR_PASSWORD=superposte1 app npm run user:create-mentor
```

Abra `http://localhost:3005/mentor.html`, entre como mentor, crie a equipe e use o código gerado para cadastrar a conta do aluno em `http://localhost:3005`. Sem login válido, o caso não inicia nem retoma.

Não deixe valores de `.env.example` em ambiente acessível: eles são apenas placeholders. Se o banco já foi inicializado com uma senha placeholder e ainda não possui dados que precisam ser preservados, recrie o volume antes de usar as credenciais definitivas. Em banco com dados, siga um procedimento de rotação de senha e backup, sem apagar o volume.

## Backups

O serviço `backup` produz um dump diário em `deploy/backups/` e remove arquivos além da retenção. Copie os dumps para armazenamento externo. Uma vez por mês, restaure um dump em banco temporário; backup não testado não conta como recuperação.

Exemplo de verificação mensal, sempre em outro banco/volume:

```bash
createdb vesper_restore_test
pg_restore --clean --if-exists --no-owner -d vesper_restore_test /caminho/vesper-AAAAMMDD-HHMMSS.dump
psql vesper_restore_test -c "select count(*) from case_runs;"
dropdb vesper_restore_test
```

## Staging

Use outro domínio, `.env`, volumes e projeto Compose (`-p vesper-staging`). Nunca use a base de alunos para testar migração ou conteúdo experimental.

## Execução de código

Não faz parte desta composição. Código de aluno nunca recebe o socket Docker nem roda no host da aplicação. Consulte `executor/README.md` antes de ativar um serviço separado.
