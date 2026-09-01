# Repo Map

```text
AGENTS.md                     roteador global
.agents/skills/               workflows reutilizáveis do Codex
agents/                       papéis de equipe / handoff

content/                      catálogo + conteúdo jogável
  AGENTS.md
  catalog.json
  cases/<caseId>/             pacote isolado do caso

src/                          engine + UI
  AGENTS.md
  engine/
  ui/
  styles/

assets/
  AGENTS.md
  rooms/                      produção atual
  characters/                 produção atual
  source-packs/               material-fonte completo
  candidates/                 opções não aprovadas
  licenses/                   proveniência/licenças
  manifest.json

docs/
  INDEX.md                    mapa de autoridade
  CURRENT_STATE.md            estado operacional
  canon/                      visão, setting, narrativa, personagens, escrita
  pedagogy/                   pedagogia e tracks
  art/                        direção visual e assets
  architecture/               engine, modelo de conteúdo, workflows
  decisions/                  decisões permanentes
  feedback/                   memória de correções
  references/                 screenshots/moodboards

scripts/                      validação e lint
schemas/                      contratos JSON de autoria
server/                       API, banco, relatórios e sync
deploy/                       Docker/VPS e operação
```
