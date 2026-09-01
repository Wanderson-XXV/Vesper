# Caso 02 — Re-outline (2026-08-28)

Reescrita de "O Observatório das Nove Luzes" sob a decisão `docs/decisions/0011-rituais-como-sistema-de-magia-legivel.md`. Diagnóstico em `docs/feedback/inbox/2026-08-28-caso02-diagnostico-e-propostas.md`.

## Pergunta central

Quem esvaziou o arquivo do observatório — e o que a cúpula está tentando alcançar?

**Responde neste caso:** a cúpula mantém uma correspondência com outro lugar; a nona luz é uma janela; registros foram removidos por alguém que conhecia o método; Ivo escondeu uma placa de teste.
**Deixa aberto:** a origem da janela; o destino de Ivo Marinho.

## Personagens

- **Protagonista** — investigador em campo.
- **Tomás Vale** — mentor; ensina o ofício (declaração/trabalho) e não despacha tarefas.
- **Ivo Marinho** — astrônomo-responsável, desaparecido. Conhecido só por rastros: ficha funcional, grafia, assinatura no livro de acesso, placa escondida. Nunca aparece nem vira tópico de perfil (sem portrait).
- **Diretoria do Instituto** — fora de cena; chamou os investigadores por telegrama; quer a cúpula parada antes da votação sobre a demolição (relogio civil do caso).

## Beat sheet

### Ato 0 — Chegada (scene-only, sobre o fundo da câmara)

| Beat | Cena | Função |
|---|---|---|
| 1 | `obs_intro_arrival` | Aproximação ao entardecer; ofício de interdição; **lacre rompido por dentro** (pista T3); telegrama da diretoria (quem chamou, relógio); Tomás estabelece método: "o observatório é uma máquina de anotar". Termina entrando. |
| 2 | `obs_archive_first` | A câmara: gavetas na parede circular, uma gaveta alguns centímetros para fora, o mecanismo audível acima, uma placa ainda no leitor. Ivo "saiu no meio de um trabalho". |

### Ato 1 — Câmara de Registros (diamante: frentes paralelas)

Frentes abertas simultaneamente após o ritual 1: documentos, placa escondida, margem do catálogo, conversa com Tomás, ritual 2.

| Beat | Cena | Função |
|---|---|---|
| 3 | `obs_bridge_shutters_intro` → ritual `calibration` | **Apartar.** A coroa de doze lâminas forçada pela cúpula; lei: lâmina marcada com sete ou mais prende a coroa. Contar = quantas travas armar. |
| 4 | `obs_bridge_shutters_success` | Trabalho executado por Tomás; a gaveta "que respirava" continua para fora (gancho, não explicação). |
| 5 | `obs_archive_registry` | Livro de acesso: última entrada é a assinatura de Ivo, datada da noite em que a cúpula começou — depois do desaparecimento (pista T5/T3). |
| 6 | `obs_archive_ivo` | Ficha funcional de Ivo Marinho: nome, função, grafia (base para reconhecer a placa escondida). |
| 7 | `obs_archive_telegram` | Telegrama da diretoria: stakes civis e prazo. |
| 8 | `obs_archive_margin` (req. calibration) | Margem do rolo-índice, grafia de Ivo: "A NONA NÃO É ESTRELA. CONTEM DE NOVO." (pista T2 plantada cedo). |
| 9 | `obs_optional_plate` (req. calibration) | Placa de teste escondida em cera; grafia reconhecível se `obs_ivo_known`. |
| 10 | `obs_bridge_exposures_intro` → ritual `catalog` | **Confrontar.** Duas tiras do mesmo rolo: índice (escrito pela máquina, infalsificável) × estado atual. Divergências = gavetas mexidas. |
| 11 | `obs_bridge_exposures_success` | As posições divergentes são 3 e 7–10: uma sequência inteira removida; a 3 tem cera fresca. O jogador conecta; Tomás não explica. Abre a escada. |

### Ato 2 — Cúpula

| Beat | Cena | Função |
|---|---|---|
| 12 | `obs_dome_arrival` | O telescópio corrigindo para um ponto onde as cartas não marcam estrela (pista T1 mostrada, não dita). |
| 13 | `obs_dome_log` | Rolo do regulador: os três humores da cúpula, anotados pela máquina (prepara a lei do ritual 3). |
| 14 | `obs_bridge_alignment_intro` → ritual `dome` | **Afinar.** O calço só entra enquanto o humor se mantém; maior trecho estável = janela de contenção. |
| 15 | `obs_bridge_alignment_success` (roteador) | Revelação: oito estrelas do catálogo + um nono ponto. Variante com a margem de Ivo = confirmação, não informação nova. |
| 16 | `obs_final_choice` | Dilema ganho: a placa é prova e passagem. Opções preservam/destroem; relação com Tomás; 4 finais mantidos e repolidos. |

### Track avançada (mesma espinha)

- `calibration`: **Localizar** — carro óptico sobre a célula de maior marca (matriz, máximo).
- `catalog`: **Isolar** — categoria repetida para fechar o volume das etiquetas (mapa de frequências).
- `dome`: **Cruzar** — sinal × estado da célula: a luz de fora só escreve onde a cúpula está firme; o sinal verdadeiro domina as células firmes, não a grade inteira (filtro + frequência; a resposta ingênua global é errada de propósito).

## Ledger de pistas

| Verdade interna | Plantada em | Paga em |
|---|---|---|
| T1 correspondência remota | `obs_dome_arrival` (ponto fora das cartas) | revelação pós-ritual 3 |
| T2 nona luz = janela | `obs_archive_margin`, `obs_optional_plate` | revelação + finais |
| T3 registros removidos por quem conhecia o método | lacre por dentro (intro), ritual 2 (mecânica) | `obs_bridge_exposures_success`, escolha final |
| T4 Ivo escondeu a placa | `obs_archive_ivo` (grafia) | `obs_optional_plate` |
| T5 destino de Ivo (aberto) | `obs_archive_registry` (assinatura posterior) | hook dos finais |

Pistas opcionais com `optional: true`: `obs_hidden_plate`, `obs_ninth_not_star`. `secretClueThreshold: 2`.

## Tabela de verbos rituais

| Slot | Verbo | Lei (uma frase) | Operação lógica | Custo do erro |
|---|---|---|---|---|
| calibration (bridge) | Apartar | lâmina marcada com sete ou mais prende a coroa | for + if + contador | coroa fecha sobre a placa |
| catalog (bridge) | Confrontar | onde índice e estado divergem, alguém mexeu | dois registros, um índice; posições | gaveta errada queima a emulsão |
| dome (bridge) | Afinar | o calço só entra enquanto o humor se mantém | estado + máximo | engrenagem estoura |
| calibration (adv) | Localizar | o carro para sobre a célula de maior marca | matriz + máximo | risca a placa |
| catalog (adv) | Isolar | a categoria que sobra é a falsa | mapa de frequências | expõe as emulsões |
| dome (adv) | Cruzar | a luz só escreve onde a célula está firme | filtro × frequência | completa o alinhamento |

## Regras de enunciado (aplicadas nos challenges)

1. `narrative` conta situação + lei em termos do mundo; nunca menciona estrutura de dados.
2. `outputHint` diz **o que imprimir e o que isso significa no mundo** em uma frase ("Imprima quantas travas Tomás deve armar.").
3. `displayMeta` descreve a face do instrumento ("12 lâminas · marca de trava: 7").
4. Dicas seguem a escada (raciocínio → estrutura → operacional) na voz de Tomás, sempre ancoradas no objeto físico antes da sintaxe.

## Fora de escopo desta reescrita

- Asset de exterior/portão do observatório (só existem `arquivo.png` e `cupula.png`); a chegada é conduzida por narração. Registrar necessidade de asset.
- Geradores novos na engine. `catalog` (bridge) e `dome` (adv) usam `fixed` com dados autorais — o seed já é fixo por playthrough, então dados autorais não mudam o comportamento, só melhoram a ficção. Sugerir ao responsável pelo back geradores `divergencePositions` e `crossReference` para replay futuro.
