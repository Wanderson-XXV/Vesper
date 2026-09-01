# AGENTS.md — content/

Este diretório é conteúdo autoral, não engine.

Antes de editar:
- leia `../docs/INDEX.md`;
- identifique a learning track afetada;
- identifique o caso e mantenha IDs/flags específicos prefixados;
- leia a cena anterior e posterior quando mexer em `scenes.json`;
- preserve IDs existentes sempre que possível.
- um pacote jogável fica em `cases/<caseId>/`; registre-o em `catalog.json` somente quando validado.

Regras:
- não conserte diálogo alterando `AppUI.js`;
- não coloque lógica arbitrária JavaScript dentro de JSON;
- perguntas novas em `characters.json` precisam de `requires` quando o assunto não é conhecido desde o início;
- novos rituais devem estar documentados na track pedagógica;
- alterações de canon exigem atualização de `docs/canon/` ou `docs/decisions/`;
- não reutilize automaticamente introduções narrativas de uma track em outra se os dados mudarem de natureza.

Após editar, rode `npm run validate`.
