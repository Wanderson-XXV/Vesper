# Asset Manifest — leitura humana

A fonte de dados é `assets/manifest.json`.

## Categorias
- `production`: arquivo atualmente referenciado pelo jogo;
- `source-pack`: material-fonte completo disponível para novas escolhas/edições;
- `reference`: inspira direção visual, nunca entra automaticamente no jogo;
- `candidate`: opção ainda sem aprovação.

## Regras
- não renomear produção sem atualizar referências;
- não promover referência para produção sem revisar origem/licença;
- preservar packs completos em `source-packs` quando eles forem úteis para futuras expressões/props;
- registrar qualquer asset externo novo no manifest.
