# Roadmap da Plataforma Vesper

> Atualizado em 2026-08-27. Este roadmap separa entrega concluída, validação pendente e expansão futura. Não usar esta lista para inferir que uma fase futura já existe no produto.

## Entregue no MVP multicase

### Fundação do produto

- Vesper como universo/produto; A Mansão de Vesper como Caso 01.
- Hub/Arquivo de Investigações com seleção de caso, rota e linguagem.
- Catálogo global de casos e pacotes isolados por `caseId`.
- Investigador persistente, saves namespaced e migração do save legado do Caso 01.
- Escolhas explícitas, finais nomeados, relações e histórico de eventos.
- XP, Marcas de Campo e ledger de recompensa idempotente.

### Conteúdo e pedagogia

- Ontologia de vestígios, correspondência e rituais com limites canônicos.
- Catálogo reutilizável de anomalias, instrumentos, artefatos, locais, instituições, personagens e perguntas do metamistério.
- Matriz de conceitos e tracks separadas.
- Kit portátil de autoria para outras IAs, com contratos, templates, schemas e checklist de importação.
- Caso 02 — O Observatório das Nove Luzes, com duas rotas completas:
  - ponte: condicionais → loops/arrays;
  - avançada: arrays → matrizes/mapas.

### Backend e operação

- API Node.js e PostgreSQL.
- Contas por usuário/senha, Argon2id e sessão por cookie.
- Equipes, painel de mentor, relatórios e CSV.
- Snapshot + eventos + tentativas de ritual + recompensas auditáveis.
- Row-Level Security e verificação explícita de escopo de equipe.
- Docker Compose com proxy HTTPS, banco e backup diário.
- Oráculo do servidor para validar a saída dos rituais existentes.

## Em validação antes de uso com turmas

- Playtest presencial das duas rotas do Observatório para confirmar duração de 60–90 minutos e calibrar dicas.
- Script doctor contínuo do Caso 01, sobretudo `conditionals_beginner`.
- Teste completo em ambiente HTTPS com conta de mentor, conta de aluno, retomada, relatório e CSV.
- Teste de restauração de um backup em PostgreSQL separado.
- Revisão de licenças de arte e música placeholder antes de publicação.
- Staging separado de produção, com domínio, banco, volumes e segredo próprios.

## Próximas entregas recomendadas

### 1. Consolidação de perfil e metaprogressão

- Caderno cronológico do investigador, reunindo casos concluídos, pistas promovidas e decisões relevantes.
- Catálogo de cosméticos com UI de equipar; hoje o modelo e o ledger existem, mas o catálogo jogável ainda é mínimo.
- Requisitos de caso baseados em conceitos dominados e fatos canônicos declarados.
- Migrações de save por versão de conteúdo, além da migração legada do Caso 01.

### 2. Fábrica de casos

- Criar o Caso 03 a partir do kit portátil, sem mudar regras de mundo apenas para acomodar exercícios.
- Adicionar validadores para manifesto de caso, adaptadores de linguagem e finais versionados.
- Formalizar quais pistas e escolhas podem receber `carryForward` para o perfil global.

### 3. Currículo e plataformas de robótica

- Criar adaptadores de lógica pura para MicroPython/Pybricks.
- Projetar mocks pedagógicos de sensores/motores antes de prometer execução na VPS.
- Acrescentar rotas para orientação a objetos, física e bibliotecas, sempre com um fenômeno e instrumento diegéticos compatíveis.

## Fase isolada: execução de código

Esta fase não deve ser apressada porque altera a superfície de segurança do produto.

1. Subir executor isolado, preferencialmente em outra VPS.
2. Começar com Java e Python em versões fechadas e harnesses do servidor.
3. Aplicar limites de fonte, CPU, tempo de parede, memória, processos, saída e requisição; bloquear rede e mounts do host.
4. Testar timeout, código inválido, excesso de memória/saída, fork bomb e acesso indevido ao host.
5. Somente então substituir, caso a caso, o modo output-only.

Pybricks em hardware continua como modo de saída, mock ou validação no hub até haver simulação específica.

## Critérios para promover uma fase

Uma fase é promovida de roadmap para produto quando possui:

1. regra de canon/documento de arquitetura;
2. modelo de conteúdo ou schema, quando aplicável;
3. validação automatizada;
4. playtest manual do fluxo alterado;
5. migração segura, se toca saves ou dados reais;
6. decisão numerada quando muda uma regra permanente.
