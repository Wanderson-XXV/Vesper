# Implantação VPS

## Instalação atual na Hostinger

A produção existente usa uma VPS Hostinger com Ubuntu 24.04 e Docker. O clone está em `/opt/apps/vesper`; o proxy externo publica o jogo em `https://tiereducation.com.br/vesper/`. Não altere o `.env`, as portas `3005`/`3443`, o Caddy ou os volumes para fazer uma atualização normal.

Para atualizar manualmente:

```bash
cd /opt/apps/vesper
bash deploy/update.sh
```

O script faz `git pull --ff-only`, reconstrói somente os containers necessários e valida o app e o PostgreSQL por dentro do Compose. O health check esperado é `200` com `database: true`.

O primeiro provisionamento desta VPS já foi feito. Se uma instalação nova for criada no futuro, aí sim será necessário configurar `.env`, DNS, proxy e credenciais separadamente.

Para criar o primeiro mentor no container da aplicação:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml exec \
  -e MENTOR_USERNAME=professor \
  -e MENTOR_PASSWORD='troque-esta-senha-longa' app npm run user:create-mentor
```

Depois, abra `/mentor.html`, crie uma equipe e entregue seu código aos alunos. O cadastro estudantil exige esse código.

Sem `DATABASE_URL`, o servidor mantém o Hub visível para comunicar a indisponibilidade, mas API, autenticação e investigações ficam bloqueadas. O teste local deve usar o Compose, para reproduzir o fluxo com PostgreSQL, cookies e autenticação.

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

## Teste de integração PostgreSQL

O teste `tests/platform-api.integration.test.mjs` é ignorado quando `TEST_DATABASE_URL` não existe. Para executá-lo no ambiente local, rode o processo dentro do container `app`; ali o hostname do banco é `postgres`, definido pela rede interna do Compose.

Na raiz do repositório, com `.env` configurado:

```powershell
docker compose --env-file .env -f deploy/docker-compose.yml up -d --build

$testDbUrl = (Get-Content .env | Where-Object { $_ -like 'DATABASE_URL=*' }).Substring(13)

docker compose --env-file .env -f deploy/docker-compose.yml exec -T `
  -e "TEST_DATABASE_URL=$testDbUrl" app node --test tests/platform-api.integration.test.mjs
```

Para rodar toda a validação com o teste online habilitado:

```powershell
docker compose --env-file .env -f deploy/docker-compose.yml exec -T `
  -e "TEST_DATABASE_URL=$testDbUrl" app npm run validate
```

O resultado esperado é que o teste PostgreSQL não apareça como `SKIP`. Não use `localhost` na URL do banco dentro do container `app`; use a URL com `@postgres:5432/`. A senha deve permanecer somente no `.env` local e nunca ser colada em chat ou commit.

## Deploy simples depois do commit

O caminho recomendado é fazer commit, enviar para `main` e deixar o GitHub Actions atualizar a VPS:

```bash
git add .
git commit -m "descreva a mudança"
git push origin main
```

O workflow `.github/workflows/deploy.yml` roda `npm run validate`, conecta por SSH, executa `deploy/update.sh` e só termina com sucesso depois de validar a aplicação e o PostgreSQL pelo endpoint interno de saúde. Ele não copia `.env`, não recria volumes e não executa migrações destrutivas. Dois pushes não rodam simultaneamente.

### Configuração única da VPS

Na instalação atual, o workflow deve apontar para `/opt/apps/vesper`. Para confirmar manualmente que a atualização funciona:

```bash
bash /opt/apps/vesper/deploy/update.sh
```

O usuário SSH usado pelo Actions precisa conseguir executar Docker (normalmente, estar no grupo `docker`) e ler/escrever o clone do repositório. O `origin` da VPS deve permitir `git pull`; para repositório privado, configure uma deploy key somente de leitura no servidor.

### Segredos do GitHub Actions

Cadastre estes cinco secrets no repositório, em **Settings → Secrets and variables → Actions**:

| Secret | Valor |
|---|---|
| `VPS_HOST` | domínio ou IP da VPS |
| `VPS_USER` | usuário Linux do deploy |
| `VPS_SSH_KEY` | chave privada dedicada, sem passphrase interativa |
| `VPS_KNOWN_HOSTS` | saída previamente verificada de `ssh-keyscan -H <host>` |
| `VPS_APP_DIR` | diretório absoluto do clone: `/opt/apps/vesper` |

`VPS_KNOWN_HOSTS` deve ser obtido e revisado por uma pessoa administradora; não deixe o workflow aceitar qualquer host com `StrictHostKeyChecking=no`. O primeiro deploy e qualquer troca de chave SSH devem ser feitos conscientemente.

O gatilho é `push` em `main`. Um commit apenas local não alcança a VPS; use `git push` ou o botão **Run workflow** para uma atualização manual. Se o deploy falhar, o Compose preserva o volume e a versão anterior continua descrita no clone; corrija a causa e reenvie. Antes de rollback, verifique o estado das migrações e dos dados.
