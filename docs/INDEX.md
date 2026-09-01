# Knowledge Map — A Mansão de Vesper

Este arquivo é o ponto de entrada da memória do projeto. Quando houver dúvida sobre qual documento seguir, use esta tabela.

## Fontes de verdade

| Assunto | Fonte canônica |
|---|---|
| visão e pilares do jogo | `canon/DESIGN_BIBLE.md` |
| ontologia ritual e catálogo reutilizável do mundo | `canon/VESPER_WORLD_CATALOG.md` |
| setting e tecnologia permitida | `canon/WORLD_RULES.md` |
| verdade interna do Caso 01 e regras de mistério | `canon/NARRATIVE_BIBLE.md` |
| voz e função dos personagens | `canon/CHARACTER_BIBLE.md` |
| regras de diálogo e narração | `canon/WRITING_RULES.md` |
| pedagogia dos rituais | `pedagogy/RITUAL_PEDAGOGY.md` |
| track de arrays/for/if | `pedagogy/TRACK_ARRAYS.md` |
| track de if/else | `pedagogy/TRACK_CONDITIONALS.md` |
| matriz de conceitos e pré-requisitos | `pedagogy/CURRICULUM_MATRIX.md` |
| track ponte condicionais/loops/arrays | `pedagogy/TRACK_BRIDGE_LOOPS_ARRAYS.md` |
| track avançada matrizes/mapas | `pedagogy/TRACK_ADVANCED_COLLECTIONS.md` |
| direção visual | `art/ART_DIRECTION.md` |
| interpretação das referências de No, I'm Not a Human | `art/UI_REFERENCE.md` |
| assets aprovados e suas origens | `art/ASSET_MANIFEST.md` + `../assets/manifest.json` |
| arquitetura de engine | `architecture/ENGINE_ARCHITECTURE.md` |
| produto, Hub, persistência, backend e operação | `architecture/PLATFORM_ARCHITECTURE.md` |
| formatos de conteúdo | `architecture/CONTENT_MODEL.md` |
| mapa do repositório | `architecture/REPO_MAP.md` |
| processo de criação/revisão | `architecture/AUTHORING_WORKFLOW.md` |
| roadmap de plataforma e fronteiras futuras | `architecture/PLATFORM_ROADMAP.md` |
| pacote portátil para outras IAs | `authoring/portable/README.md` |
| estado atual e pendências | `CURRENT_STATE.md` |
| prompts operacionais para agentes | `AGENT_PLAYBOOK.md` |
| decisões permanentes | `decisions/` |
| coisas explicitamente rejeitadas | `feedback/REJECTED_PATTERNS.md` |

## Estado da documentação antiga

Os arquivos antigos diretamente em `docs/` (`01_DESIGN_BIBLE.md`, `02_NARRATIVE_BIBLE.md`, changelogs etc.) foram preservados por histórico e compatibilidade. Para novas decisões, prefira os caminhos canônicos acima.

## Fluxo de atualização

1. usuário dá feedback;
2. feedback específico pode ir para `feedback/inbox/`;
3. se for regra reaproveitável, registrar em `feedback/accepted/`;
4. promover a regra para a bíblia/decisão adequada;
5. atualizar `CURRENT_STATE.md` se mudar o estado do projeto.

Não use um changelog como fonte de canon.
