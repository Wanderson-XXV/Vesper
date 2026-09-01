# Changelog — V4

## Abertura
- Tela principal reduzida a **A Mansão de Vesper** + Iniciar/Continuar/Opções.
- Removidos subtítulo e textos que antecipavam o mistério.
- Adicionada tela de registro do nome do jogador.
- O nome passa a aparecer nos diálogos e no inventário.
- Reescrita completa da chegada à mansão para explicar, através de cena, quem é Lívia, quem é Tomás, quem desapareceu e por que a equipe foi chamada.

## Tutorial
- Novo `ritual_0`: Leitura dos Selos.
- Entrada fixa e pequena: `1 0 1 1 0 1`.
- O objetivo pedagógico do ritual é ensinar o loop do jogo, não testar dificuldade.
- Tomás oferece dicas progressivas dentro do modal do ritual.
- O portão só libera a entrada na mansão após o tutorial.

## Direção do jogador
- Objetivo removido da HUD.
- Anotação atual aparece apenas dentro do Inventário.
- Biblioteca e Galeria ficam bloqueadas até a primeira triagem do Hall, deixando o começo mais linear.

## Personagens
- Tomás continua usando o Butler do asset pack.
- Lívia agora usa a personagem Girl do asset pack, mais coerente com uma integrante da família Vesper.
- Theo não usa mais uma imagem feminina incorreta e fica oculto da lista de pessoas até ser encontrado.
- Portraits usam `object-fit: contain`, evitando cortar o rosto.

## UI
- `NA SALA` virou `NESTE LOCAL` no exterior e `NESTE AMBIENTE` nos cômodos.
- `SAÍDAS` virou `ACESSOS`.
- Topbar mais limpa, sem objetivo textual permanente.
- Tipografia usa EB Garamond + Inter via Google Fonts, com fallbacks locais.
- Durante cenas narrativas, a HUD some.

## Grimório
- Reescrito para parecer um caderno de campo, não documentação seca.
- Entradas são desbloqueadas conforme os rituais avançam.
- Arrays, for e if ficam disponíveis desde o tutorial.
