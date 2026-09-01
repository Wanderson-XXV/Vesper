# Feedback consolidado — legibilidade e controles

## Classificação

Reutilizável para UI, acessibilidade e autoria de ferramentas do jogador.

## Decisão de interface

- A tipografia de diálogo pode ser literária, mas deve ser legível em uma primeira leitura. Preferir uma serif de leitura com tamanho e entrelinha confortáveis a uma fonte decorativa usada como corpo de texto.
- O jogador precisa poder ajustar o tamanho do texto e reencontrar as opções sem depender de um estado específico da interface.
- Texto de diálogo é superfície de leitura e avanço, não conteúdo para seleção: não deve exibir a seleção azul do navegador durante a interação.
- `Esc` abre e fecha as opções como camada temporária, preservando a interface que estava aberta por baixo e devolvendo o foco a ela ao fechar.
- Preferências de áudio são preferências do jogador, não do save atual: não devem ser perdidas ao iniciar outro percurso ou apagar o progresso.
- O Grimório deve parecer objeto físico, mas também ensinar a usá-lo: introdução clara, estrutura visível e rolagem tratada como parte de uma página, não como painel genérico.
- O Grimório pode oferecer a mesma ideia em Java e Python como preferência de leitura; isso não altera automaticamente a linguagem dos rituais ou a progressão da track.

## Aplicado nesta passada

- Nova fonte de leitura para diálogo, tamanho maior e controle de escala nas opções.
- Caixa de diálogo sem seleção de texto e atalho global `Esc` para as opções.
- Preferências globais de áudio e leitura preservadas fora dos saves de campanha.
- Grimório com instrução inicial expandida e barra de rolagem com tratamento de papel.
- Preferência de linguagem Java/Python para a sintaxe e os exemplos do Grimório.
