# AGENTS.md — src/

Este diretório contém engine e apresentação. Não mova conteúdo narrativo para código.

Antes de editar, leia:
- `../docs/architecture/ENGINE_ARCHITECTURE.md`
- `../docs/architecture/CONTENT_MODEL.md`
- `../docs/art/ART_DIRECTION.md` se a mudança for visual.

Regras:
- prefira tornar a engine mais genérica em vez de hardcodar uma cena específica;
- conteúdo deve continuar editável em JSON quando razoável;
- preserve saves por caso e learning track, incluindo migrações de versão;
- HUD deve esconder detalhes técnicos sem valor diegético;
- não transforme o projeto em dashboard/SaaS;
- alterações de áudio devem manter controles separados de master, música e SFX.

Rode `npm run validate` antes de finalizar.
