# A Mansão de Vesper — MVP V6.1 Agent-Ready

Visual novel investigativa educacional em que programação Java funciona como linguagem ritual para investigar fenômenos sobrenaturais.

Esta versão transforma o repositório em memória persistente do projeto para trabalho com agentes: `AGENTS.md`, documentação canônica, roles, skills, referências locais, source packs, feedback consolidável e validações.

## Rodar com Docker

O Docker sobe a aplicação, o PostgreSQL e o Caddy juntos. O Docker Desktop deve estar aberto.

### Docker local

Execute os comandos a partir da raiz do repositório.

1. Crie o arquivo de configuração local:

```powershell
Copy-Item .env.example .env
```

2. No `.env`, use estes valores para HTTP local:

```env
DOMAIN=http://localhost
HTTP_PORT=3005
COOKIE_SECURE=false
BOOTSTRAP_DEFAULT_MENTOR=true
```

3. Suba a aplicação:

```powershell
docker compose --env-file .env -f deploy/docker-compose.yml up -d --build
```

Abra `http://localhost:3005`. Com `BOOTSTRAP_DEFAULT_MENTOR=true`, o Compose cria a conta de teste `wanderson`, com senha `superposte1`. Use `/mentor.html` para criar uma equipe e depois cadastre o aluno com o código da equipe.

Para verificar a saúde:

```powershell
curl http://localhost:3005/api/health
# esperado: {"ok":true,"mode":"online","database":true}
```

Para parar o ambiente local:

```powershell
docker compose --env-file .env -f deploy/docker-compose.yml down
```

### Docker em produção (VPS)

Na VPS Hostinger atual, mantenha as credenciais fora do repositório. O clone está em `/opt/apps/vesper`, o proxy já publica `https://tiereducation.com.br/vesper/` e o Compose usa as portas `3005`/`3443`.

1. O arquivo `deploy/.env` já existe na instalação atual. Não o substitua.

```powershell
cd /opt/apps/vesper
```

Para atualizar a instalação, execute apenas:

```bash
bash deploy/update.sh
```

2. Confirme o status dos containers:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml ps
```

3. Confirme `https://tiereducation.com.br/vesper/` e o health check interno:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml exec -T app node --input-type=module -e 'const r=await fetch("http://127.0.0.1:5173/api/health"); console.log(r.status, await r.text())'
```

Não use `BOOTSTRAP_DEFAULT_MENTOR=true` em produção. Para o procedimento completo e o deploy automático, consulte `deploy/README.md`.

Depois da configuração inicial, o fluxo normal é `git commit` + `git push origin main`; o workflow de deploy atualiza a VPS. Consulte `deploy/README.md` para os secrets e o primeiro setup.

Não execute `npm start`: a forma suportada de executar o jogo é pelo Docker Compose, com PostgreSQL disponível.

## Learning tracks

Arrays:

```text
http://localhost:3005/
```

Condicionais em autoria:

```text
http://localhost:3005/?track=conditionals_beginner
```

As URLs acima assumem o modo Docker.

## Se você é um agente

1. leia `AGENTS.md`;
2. abra `docs/INDEX.md`;
3. use o routing/skill correspondente à tarefa;
4. não dependa de histórico de chat para decisões permanentes;
5. rode `npm run validate` antes de finalizar.

Skills do repo ficam em:

```text
.agents/skills/
```

Papéis/handoffs ficam em:

```text
agents/
```

Prompts curtos para tarefas comuns:

```text
docs/AGENT_PLAYBOOK.md
```

## Documentação principal

- `docs/INDEX.md` — mapa de autoridade;
- `docs/CURRENT_STATE.md` — estado atual;
- `docs/canon/` — visão, setting, narrativa, personagens e escrita;
- `docs/pedagogy/` — rituais e learning tracks;
- `docs/art/` — direção visual, referências e assets;
- `docs/architecture/` — engine, formatos e workflows;
- `docs/feedback/` — memória das correções do diretor;
- `docs/decisions/` — decisões permanentes.

Arquivos antigos em `docs/` foram preservados como histórico/compatibilidade; `docs/INDEX.md` diz quais documentos são fontes de verdade.

## Assets e referências

- produção atual: `assets/rooms/`, `assets/characters/` e demais caminhos existentes;
- pack completo da Kalaverita: `assets/source-packs/kalaverita-horror-vn/`;
- candidatos: `assets/candidates/`;
- licenças/proveniência: `assets/licenses/` e `assets/manifest.json`;
- referências NINAH: `docs/references/ninah/` (somente referência visual, não produção).

## Validação

```bash
npm run validate
```

Executa:
- validação de referências de conteúdo;
- lint narrativo básico;
- checagem de assets;
- checagem da estrutura agent-ready/skills.

## Track de If/Else

O prompt legado detalhado continua em `AGENT_IF_ELSE_PROMPT.md`, mas um agente no repo pode receber simplesmente:

> Termine `conditionals_beginner` como track jogável. Siga `AGENTS.md`, use `vesper-ritual-design` e depois `vesper-narrative`. Não altere `arrays_beginner`. Rode `npm run validate`.
