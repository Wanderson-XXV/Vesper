# Contrato de entrega externa

## Arquivos obrigatórios

- `case-brief.md` preenchido;
- `package-manifest.json` baseado no template;
- `campaign.json`, `rooms.json`, `characters.json`, `scenes.json`, `challenges.json`, `objectives.json`, `tracks.json`, `grimoire.json`;
- relatório de decisões de canon propostas;
- lista de pontos que exigem aprovação humana.

## Regras de formato

- JSON válido, UTF-8, sem comentários;
- IDs em `snake_case`, prefixados pelo caso quando não forem globais;
- flags descrevem fatos do mundo;
- toda referência precisa existir no mesmo pacote ou no catálogo compartilhado declarado;
- não incluir código JavaScript arbitrário em condições;
- nenhuma decisão permanente é aplicada silenciosamente;
- assets externos entram apenas como candidatos com origem/licença.

## Gate de importação

1. validar contra schemas;
2. rodar `npm run validate`;
3. revisar todas as rotas e finais alcançáveis;
4. fazer leitura manual das cenas adjacentes aos rituais;
5. verificar UI em desktop e viewport estreita;
6. registrar decisões canônicas aprovadas.

