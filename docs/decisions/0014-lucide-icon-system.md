# 0014 — Sistema central de ícones Lucide

## Status

Aprovada para implementação em 2026-09-02.

## Decisão

O Vesper adotará Lucide como fonte visual para ícones de interface. A implementação será centralizada em um módulo local de ícones, com um subconjunto curado e determinístico, sem depender de CDN em runtime.

Os ícones serão SVGs de traço fino, discretos e funcionais. Textos importantes continuarão visíveis; ícones não substituirão rótulos críticos. Ícones isolados terão nome acessível, tooltip ou `aria-label`.

O módulo inicial deverá cobrir, pelo menos: conta, sair, mostrar/esconder senha, salvar, reiniciar, inventário, Grimório, opções, fechar, voltar, continuar e confirmação.

## Motivo

Uma biblioteca central evita emoji, glifos Unicode inconsistentes e SVGs copiados de forma desigual entre telas. Lucide oferece SVGs leves, consistentes e customizáveis, com licença ISC: https://lucide.dev/

## Restrições visuais

- não usar ícones coloridos de videogame;
- não transformar o Hub em dashboard;
- não adicionar bordas ou decoração sem função;
- manter cena, fundo e texto como elementos dominantes;
- documentar a origem e os nomes disponíveis em `docs/art/ICON_LIBRARY.md`.

## Arquivos afetados

- `src/ui/icons.js`
- `src/styles/main.css`
- `package.json` e `package-lock.json`, somente se necessários
- `docs/art/ICON_LIBRARY.md`
