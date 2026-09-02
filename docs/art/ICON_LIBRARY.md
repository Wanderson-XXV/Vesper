# Biblioteca de ícones do Vesper

## Origem e licença

O Vesper usa o [Lucide](https://lucide.dev/) como fonte visual. O subconjunto
curado é mantido localmente em `src/ui/icons.js`, com geometrias SVG de 24 × 24
e traço herdado por `currentColor`. Não há CDN nem carregamento remoto em
runtime.

Lucide é distribuído sob a licença ISC. A licença oficial e os avisos de
copyright estão no [repositório do Lucide](https://github.com/lucide-icons/lucide/blob/main/LICENSE).
O próprio aviso do projeto também identifica as partes derivadas de Feather,
distribuídas sob MIT. Este documento mantém a origem registrada para o
subconjunto incorporado ao Vesper.

## API local

`icon(name, options)` retorna markup SVG determinístico para uso em templates.
`createIcon(name, options)` retorna um `SVGElement` para uso no DOM. O registro
somente leitura também é exportado como `ICON_REGISTRY`. A lista disponível
pode ser consultada por `ICON_NAMES` ou `getIconNames()`, e `hasIcon(name)` evita
depender de nomes fora do registro.

Opções relevantes:

- `size`: largura e altura, por padrão `1em`;
- `strokeWidth`: espessura do traço, por padrão `1.5`;
- `className`: classe adicional, mantendo `vesper-icon`;
- `label`: nome acessível para um ícone informativo;
- `tooltip` ou `title`: texto acessível e tooltip nativo;
- `decorative`: marca explicitamente o SVG como decorativo.

Nome inexistente lança `RangeError`; isso evita fallback silencioso para outro
ícone e mantém a biblioteca determinística.

## Registro inicial

| Nome | Uso previsto |
|---|---|
| `user-round` | conta e investigador |
| `log-out` | sair do Arquivo |
| `eye` / `eye-off` | mostrar ou esconder senha |
| `save` | salvar e sair |
| `rotate-ccw` | nova tentativa |
| `backpack` | inventário |
| `book-open` | Grimório |
| `settings-2` | opções |
| `chevron-right` | avançar ou indicar navegação |
| `arrow-left` | voltar |
| `x` | fechar |
| `shield-check` | confirmação de segurança e marcador discreto de ação ritual |
| `play` | iniciar ou retomar |

## Convenções de uso

- ícones complementam rótulos; nunca removem texto importante da ação;
- um ícone isolado precisa de `label`, `title` ou `tooltip`;
- um ícone ao lado de texto pode permanecer decorativo (`aria-hidden`);
- não usar emoji, caracteres de seta ou glifos Unicode como substitutos;
- não copiar SVG manualmente em componentes: registrar o nome e usar o helper;
- preferir o traço fino, discreto e sóbrio, sem cores de videogame ou ornamento;
- manter a cena, o fundo e a leitura como elementos dominantes da interface.

Novos ícones devem ser adicionados ao registro e a esta tabela antes de serem
usados nos componentes.
