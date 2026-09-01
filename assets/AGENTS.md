# AGENTS.md — assets/

Assets são separados por intenção:

- arquivos já referenciados pelo jogo na raiz de `assets/` são produção atual;
- `source-packs/` guarda material-fonte completo para consulta e futuras trocas;
- `candidates/` guarda opções ainda não aprovadas;
- `licenses/` registra origem e restrições.

Nunca mover ou renomear asset de produção sem atualizar todas as referências e rodar `npm run check:assets`.

Não promova uma referência visual para produção sem verificar origem/licença.
