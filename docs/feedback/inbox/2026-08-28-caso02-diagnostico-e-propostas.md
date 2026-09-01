# Diagnóstico do Caso 02 — "O Observatório das Nove Luzes"

**Status:** APROVADO E EXECUTADO em 2026-08-28 (reescrita do Caso 02 + promoção das regras à decisão 0011, canon, skills e REJECTED_PATTERNS). Este arquivo permanece como registro do diagnóstico.

**Interpretação:** "capítulo 2" = `content/cases/vesper_case_02_observatory`. Se for outra coisa, corrigir antes de aplicar.

**Material lido:** `content/cases/vesper_case_02_observatory/*` completo; `content/cases/vesper_case_01/scenes.json` (comparação); `docs/canon/{DESIGN_BIBLE,NARRATIVE_BIBLE,CHARACTER_BIBLE,WRITING_RULES,VESPER_WORLD_CATALOG}.md`; `docs/pedagogy/{RITUAL_PEDAGOGY,TRACK_BRIDGE_LOOPS_ARRAYS}.md`; `docs/architecture/{AUTHORING_WORKFLOW,CONTENT_MODEL}.md`; `docs/feedback/REJECTED_PATTERNS.md`; skills `vesper-*`.

---

## 1. Diagnóstico — o que está errado, com evidência

### 1.1 O jogador "aparece do nada"

`obs_intro_arrival` (scenes.json) tem 6 eventos: o Narrador despeja a premissa inteira em duas falas ("A cúpula começou a girar três noites depois... Não havia vigia, astrônomo ou caldeira acesa"), Tomás resume o caso em uma fala, a Protagonista faz uma pergunta, e acabou — `setFlag obs_case_started`.

Não existe: chegada, motivo do chamado, quem lacrou o observatório, por que investigadores ritualistas foram procurados, o primeiro contato com Tomás, nem um Ritual 0. A `NARRATIVE_BIBLE.md` §6 define uma abertura em 12 passos que o Caso 01 segue (`intro_arrival` → portão → `ritual_0` → entrada). O Caso 02 pula tudo isso: `startRoom: "obs_archive"`, o jogador acorda dentro da câmara de registros.

O paradoxo: a primeira fala do Narrador é um ótimo *gancho de menu* — mas como primeira cena jogável, ela resolve a pergunta ("algo impossível está acontecendo") antes de o jogador sentir o normal que foi quebrado. Terror por estranheza (DESIGN_BIBLE §2.4) precisa do normal primeiro.

### 1.2 Estrutura de esteira: corredor de 3 rituais

`rooms.json` tem **2 salas**. `characters.json` tem 1 NPC com `"topics": []` — zero conversas. As interações totais do caso são: 3 rituais + 1 pista opcional + Grimório. O grafo de dependência é uma linha reta:

```
intro → ritual 1 → ritual 2 → ritual 3 → escolha final → fim
```

Ron Gilbert chama isso de o pior formato possível: um Puzzle Dependency Chart linear é "chato e frustrante — se você trava, não tem mais nada pra fazer". A recomendação clássica (Gilbert/Falstein, ver §2.1) é o formato **diamante**: cada ato abre de um ponto, expande para 2–4 frentes paralelas e reconverge. O Caso 01 faz isso (55 cenas, salas opcionais, arcos de NPC). O Caso 02 é uma planilha de exercícios com corredor no meio — exatamente o que `vesper-chapter-authoring` proíbe ("do not create a linear worksheet disguised as rooms").

### 1.3 O mesmo template de cena, 6 vezes

Todas as seis cenas de introdução de ritual têm a estrutura idêntica:

```
Narrador (1 fala) → Tomás (1 fala) → Protagonista (parafraseia) → startChallenge
```

Ver `obs_bridge_shutters_intro`, `obs_bridge_exposures_intro`, `obs_bridge_alignment_intro`, `obs_advanced_plate_grid_intro`, `obs_advanced_catalog_intro`, `obs_advanced_ninth_light_intro`. Na terceira repetição o jogador já reconhece o molde e para de ler. Ritual virou rotina — o oposto de "a realidade responde a padrões" como evento.

### 1.4 A Protagonista recita o algoritmo

A `CHARACTER_BIBLE.md` proíbe: "não serve para recitar enunciados escolares". O Caso 02 viola isso em todas as intros:

- "Eu percorro os valores e anoto a posição de cada leitura oito ou maior. A numeração do arquivo começa em um." (obs_bridge_exposures_intro)
- "Percorro a grade, conto os sinais num mapa e encontro o mais frequente." (obs_advanced_ninth_light_intro)
- "Comparo cada pulso com o anterior, acompanho o trecho atual e guardo o maior." (obs_bridge_alignment_intro)

Compare com o modelo correto da `NARRATIVE_BIBLE.md` §4: "Então eu não preciso saber qual objeto é qual. Só quantos passaram do limite." — reformula o *objetivo*, não o *procedimento*. No Caso 02 a Protagonista entrega a solução antes do jogador pensar, o que também destrói o valor pedagógico: o aluno não precisa formular nada.

### 1.5 Tomás resolve o mistério em voz alta (telling)

- "O astrônomo não perdeu uma placa. Ele separou uma sequência inteira." (obs_bridge_exposures_success)
- "Alguém conhecia o método do arquivo e sabia exatamente o que precisava desaparecer." (obs_advanced_catalog_success)
- "Ele entendeu o que estava vendo. E escondeu a prova de alguém que conhecia este arquivo." (obs_optional_plate)

Isso viola WRITING_RULES 5.3 ("Não fazer NPC explicar uma contradição que o jogador pode descobrir") e 5.4 ("narração observa, não interpreta"). As deduções acima são as melhores recompensas do caso — e estão sendo dadas de graça na fala do mentor em vez de serem *conquistadas* pelo jogador juntando pistas.

### 1.6 A verdade interna é rica; a revelação é pobre

A `NARRATIVE_BIBLE.md` §7 tem um mistério forte: correspondência remota, a nona luz como janela vista de outro espaço impossível, alguém que adulterou o catálogo conhecendo o método, um astrônomo que escondeu uma placa de teste. Isso dá material para 4–6 pistas plantadas e pagas.

O que o jogador encontra de fato: **1 pista opcional** (`obs_optional_plate`) e `secretClueThreshold: 1`. Todo o resto da verdade interna ou não aparece, ou é entregue em fala do Tomás (ver 1.5). O mistério não é *investigado*; é *narrado*.

### 1.7 A escolha final não foi conquistada

`obs_final_choice` (preservar vs destruir a placa) é a melhor ideia do caso — mas chega depois de 3 rituais e 1 pista. O jogador não teve material para formar opinião sobre o que a placa é, o que a janela significa ou o que o astrônomo temia. Uma escolha moral sem informação acumulada vira chute estético, não dilema. Em termos de Scene & Sequel (§2.2): a decisão (Sequel) chega sem que nenhum desastre (Scene) a tenha preparado.

### 1.8 Desafios reskinados

`REJECTED_PATTERNS.md` proíbe "vários exercícios com exatamente a mesma ideia apenas reskinada". Violações:

| Par | Problema |
|---|---|
| `obs_bridge_shutters` (thresholdCount, ≥7) → `obs_bridge_exposures` (thresholdPositions, ≥8) | mesmo predicado, mesmo loop; só muda o que imprime |
| `obs_advanced_catalog` (frequencyWinner) → `obs_advanced_ninth_light` (matrixFrequencyWinner) | o próprio hint admite: "a grade muda o caminho, não a pergunta" — é o mesmo exercício com loop aninhado |
| `obs_bridge_shutters` vs Ritual 1 do Caso 01 | mesma ideia de triagem por limite com contador |

Agravante pedagógico: em ambas as tracks, o desafio 1 e o 2 usam o mesmo predicado com limite numérico mágico (7, depois 8). Não há progressão de *natureza de problema* — só de sintaxe.

### 1.9 A ontologia ritual está subutilizada

`VESPER_WORLD_CATALOG.md` define que rituais "medem, classificam, localizam, comparam, alinham, isolam, abrem, fecham ou estabilizam" — e o caso 02 é sobre **correspondência remota**, o tipo de anomalia cuja operação típica é "cruzar registros, estabilizar, interromper".

Nenhum dos 6 desafios **cruza dois registros**. A ideia mais forte da ficção (duas coisas distantes respondendo ao mesmo padrão) não vira mecânica. Os rituais são todos variações de "percorrer um array e agregar" — a camada mais genérica possível, que poderia existir em qualquer cenário. Por isso parece "jogado": o ritual não nasce do mistério.

### 1.10 Resumo numérico

| Métrica | Caso 01 | Caso 02 |
|---|---|---|
| Cenas | 55 | 18 |
| Salas | 7+ | 2 |
| NPCs com tópicos | 2 (Lívia, Tomás) | 0 |
| Pistas opcionais | várias (threshold 6) | 1 (threshold 1) |
| Escolhas de diálogo | várias | 1 (só a final) |
| Cenas de exploração por ritual | ~3–4 | 0,3 |

---

## 2. Referências de craft para discutirmos

### 2.1 Puzzle Dependency Charts — Ron Gilbert / Noah Falstein
Ferramenta criada para Maniac Mansion: cada nó é uma ação (fechadura ou chave), arestas são dependências. Regras práticas: **"make it bushy"** — capítulo em formato de diamante, nunca corredor; 2+ frentes abertas por vez; bottlenecks servem para contar história.
- [Puzzle Dependency Charts (Grumpy Gamer)](https://grumpygamer.com/puzzle_dependency_charts/)
- [Coletânea de ferramentas e exemplos (Monkey Island, Grim Fandango, Day of the Tentacle)](https://github.com/vmpajares/Adventure-Games-Design-Tools)
- [Why Adventure Games Suck — Ron Gilbert](https://grumpygamer.com/why_adventure_games_suck)

### 2.2 Scene & Sequel — Dwight Swain (*Techniques of the Selling Writer*, 1965)
Unidade ativa: **Goal → Conflict → Disaster** (nunca vitória limpa). Unidade reativa: **Reaction → Dilemma → Decision** (a decisão vira o goal da próxima cena). Diagnóstico clássico: história "correndo demais" = sequels ausentes; história "arrastada" = scenes ausentes. O Caso 02 é todo Scene sem Sequel — e pior: toda Scene termina em vitória limpa.
- [Resumo estrutural](https://plotiar.com/resources/glossary/scene-and-sequel/) · [análise de pacing](https://www.iwrity.com/writing-sequel-scene-guide)

### 2.3 As duas histórias do detetive — Tzvetan Todorov
A ficção policial clássica contém "a história do crime e a história da investigação": o jogador nunca vê a primeira diretamente — ele a **reconstrói** através da segunda. Se o Tomás narra a história do crime, a investigação perde a função. As duas camadas precisam de pistas plantadas na superfície jogável.
- Discussão aplicada a jogos: [Gated Story Structure (T. Gasque)](https://tgasque.me/wp-content/uploads/2020/12/gated-story-structure.pdf)

### 2.4 Dedução observável — *Return of the Obra Dinn* / *The Case of the Golden Idol*
- Obra Dinn: nenhuma identidade é dita; tudo se deduz de detalhe observável (sotaque, uniforme, aliança, posição). Confirmação em lotes de 3 força compromisso sem permitir brute force. Múltiplos caminhos válidos para a mesma dedução.
- Golden Idol: cada cena é um "fill-in-the-blank" dedutivo com pistas essenciais e red herrings misturados; a trama maior só se resolve cruzando capítulos.
- Lição para Vesper: a pista é um **objeto que o jogador interpreta**, não uma fala que um NPC interpreta por ele.
- [Design analysis Obra Dinn](https://www.kokutech.com/blog/gamedev/design-patterns/unique-mechanics/return-of-the-obra-dinn) · [Reception/design Golden Idol (Wikipedia)](https://en.wikipedia.org/wiki/The_Case_of_the_Golden_Idol)

### 2.5 Diálogo como ação — Robert McKee (*Dialogue*)
Personagens não falam para explicar; falam para **conseguir algo** um do outro. Evitar "on-the-nose writing" (dizer exatamente o que se pensa). Economia: "o máximo no mínimo de palavras". O teste de mesa: se a fala pode ser substituída por um olhar ou ação, substitua.
- [McKee on dialogue (Creative Screenwriting)](https://www.creativescreenwriting.com/robert-mckee/) · [Notas de aula (U. Oregon)](https://pages.uoregon.edu/jlesage/Juliafolder/screenwriting/dialogue.htm)

### 2.6 Subtexto — Charles Harris, "9 passos"
Escreva primeiro o "texto" (direto), depois **esconda-o**: personagens falam de outra coisa, desviam, respondem o que não foi perguntado. Pergunta sem resposta cria mais tensão que resposta. Ideal para Tomás: econômico não é críptico — é *preciso sobre o caso e evasivo sobre si*.
- [9 steps to writing dialogue with rich subtext](https://charles-harris.co.uk/2013/05/dialogue-with-subtext/)

### 2.7 Estruturas de narrativa interativa — Emily Short / Sam Kabo Ashwell
"Standard Patterns in Choice-Based Games", "Small-Scale Structures in CYOA" e "Storylets: You Want Them": módulos pequenos de conteúdo disparados por estado (nossos `requires`/flags já são isso) em vez de ramificação rígida. Útil para transformar investigação opcional em storylets com recompensa real.
- [The Game Narrative Reader (coletânea)](https://www.gamenarrativereader.org/)

---

## 3. Proposta: framework de rituais (o que cada ritual faz / pode fazer)

### 3.1 Verbos rituais

Todo ritual deve declarar um **verbo** da ontologia do catálogo. O verbo define a pergunta narrativa, a operação lógica e o tipo de consequência:

| Verbo | Pergunta que responde | Operação lógica típica | Consequência no mundo |
|---|---|---|---|
| Medir | "quão forte é o vestígio?" | leitura única, comparação simples | revela estado/escala |
| Classificar | "isso é seguro ou perigoso?" | if/else, limiar | triagem, contenção parcial |
| Contar | "quantos passam do limite?" | for + if + contador | dimensiona o problema |
| Localizar | "onde está?" | índice, busca, máximo | abre acesso físico |
| Comparar | "o que mudou / o que não pertence?" | atual vs anterior, divergência | expõe adulteração |
| Alinhar | "quando coincide?" | ciclos, estado, sequência estável | permite intervenção |
| Isolar | "qual elemento é estranho?" | filtro, frequência, outlier | separa o falso do real |
| **Cruzar** | "o que responde junto?" | **dois registros, join, correlação** | **revela correspondência remota** |
| Estabilizar / Interromper | "como conter?" | combinação das anteriores | clímax do caso |

### 3.2 Regras propostas

1. **Um verbo por ritual, sem repetição dentro do caso.** Se dois rituais têm o mesmo verbo, um deles está errado.
2. **O verbo nasce do mistério, não do currículo.** Primeiro a investigação precisa de uma resposta; depois escolhemos a operação lógica que a produz; só então o conceito pedagógico é encaixado. (Inverte o processo atual, que claramente começou pelo exercício.)
3. **Cada ritual responde 1 pergunta da investigação e levanta/estreita outra.** A saída do ritual alimenta a próxima cena (diamante, não corredor).
4. **Fingerprint mínimo:** rituais consecutivos devem diferir em pelo menos 2 destas 4 dimensões — fonte dos dados, verbo de intervenção, operação lógica nova, tipo de consequência.
5. **Cruzar é o verbo-assinatura do Caso 02.** O caso da correspondência remota deve ter pelo menos um ritual que opera sobre dois registros de origens diferentes. Hoje não tem nenhum.
6. **Consequência com custo ou abertura.** Sucesso nunca é vitória limpa: cada ritual bem-sucedido revela algo perturbador ou abre um acesso com novo risco (Swain: nada de "clean win").

### 3.3 Beat sheet obrigatório da cena de ritual

Além da cadeia já aprovada em `feedback/accepted/2026-08-27-rituais-legiveis-e-causais.md` (situação → dado → decisão → consequência), a intro de ritual precisa de:

1. **Gancho de cena** — algo muda no mundo antes de qualquer fala (som, movimento, detalhe);
2. **Situação** — o problema concreto observável;
3. **Stakes** — por que agora, o que se perde;
4. **Dados** — origem física das leituras;
5. **Formulação da Protagonista** — reformula o *objetivo* ("só preciso saber quantos..."), nunca o *procedimento* ("eu percorro o array...");
6. **HUD** — só depois dos 5 passos;
7. **Resolução em Sequel** — reação + novo detalhe perturbador + decisão que gera a próxima cena.

---

## 4. Revisão dos 6 desafios atuais

| # | Desafio | Veredicto | Proposta |
|---|---|---|---|
| 1 | `obs_bridge_shutters` (contar ≥7) | Fraco: reskin do Ritual 1 do Caso 01; "tutorial" sem ensinar o loop do jogo | Reposicionar como **Classificar/Contar** com função narrativa de *escopo*: a contagem decide quantas hastes Tomás consegue travar antes do próximo pulso da cúpula — número errado = consequência visível, não só "Correto" |
| 2 | `obs_bridge_exposures` (posições ≥8) | Reskin do #1 (mesmo predicado) | Transformar em **Comparar**: dois rolos — o catálogo oficial e o estado atual das gavetas. O jogador encontra as posições que divergem. Isso *mecaniza* a verdade interna ("alguém removeu e recategorizou registros") em vez de o Tomás narrá-la |
| 3 | `obs_bridge_alignment` (maior sequência estável) | O melhor do caso: estado+máximo, stakes físicos claros (calçar a engrenagem) | Manter o núcleo (**Alinhar**); dar mais cena antes/depois — o telescópio "procurando" algo merece buildup |
| 4 | `obs_advanced_plate_grid` (máximo em matriz) | Ok como **Localizar**; estranho ter `tutorial: true` numa track avançada | Manter; remover flag tutorial; enriquecer o payoff (o ponto claro deveria *reagir*, não só destravar gaveta) |
| 5 | `obs_advanced_catalog` (frequência) | Bom encaixe ficção↔mecânica (**Isolar**: categoria falsa repetida) | Manter; conectar explicitamente à placa escondida (quem adulterou sabia o método → quem?) |
| 6 | `obs_advanced_ninth_light` (frequência em matriz) | Reskin confesso do #5 — padrão rejeitado literal | Substituir por **Cruzar**: o sinal da grade vs. o rolo de fases do regulador — qual sinal *responde* a qual fase? É a correspondência remota virando mecânica, e prepara a revelação da janela |

Nota: a coluna "proposta" mantém os mesmos conceitos pedagógicos (loops, arrays, matrizes, mapas) — o que muda é a *semântica* do problema. Nenhuma track quebra.

---

## 5. Propostas de processo — para isso não acontecer de novo

### 5.1 `vesper-chapter-authoring`: scorecard pré-implementação

Antes de qualquer JSON, o capítulo precisa entregar:

1. **Mini puzzle-dependency chart** — proibido corredor; cada ato abre ≥2 frentes;
2. **Mapa de conhecimento dos NPCs** — quem sabe / esconde / quer o quê (hoje: 1 NPC, zero tópicos);
3. **Ledger de pistas** — cada item da verdade interna mapeado para: onde é plantado → onde é pago. Se um item da bible não tem planta, ele não existe para o jogador;
4. **Alternância Scene/Sequel** — nenhuma sequência de 3 Scenes sem Sequel; nenhuma vitória limpa;
5. **Tabela de verbos rituais** (§3) — sem repetição de verbo, com fingerprint ≥2;
6. **Orçamento mínimo:** N rituais ⇒ ≥N cenas de exploração/documento entre eles; ≥1 conversa com tópicos por ato.

### 5.2 `vesper-narrative`: novos checks de auditoria

- Detectar template repetido: 3+ cenas com a mesma sequência de speakers = alerta;
- Detectar Protagonista-enunciado: fala que descreve o procedimento do código em vez do objetivo = violação;
- Detectar narrador-resumo: premissa inteira entregue nas primeiras 2 falas do caso;
- Toda pergunta/diálogo com contexto prévio (já existe, mas precisa de teeth).

### 5.3 `vesper-content-review`: novas categorias e métricas

- Categoria **RITMO** (scene/sequel, vitória limpa) e **ESTRUTURA** (corredor, template repetido);
- Métricas verificáveis: razão exploração/ritual, nº de escolhas fora do final, `secretClueThreshold` vs nº real de pistas opcionais (hoje o validador não flagra 1 pista com threshold 1).

### 5.4 Validadores automáticos (extensão do `npm run validate`)

- Contagem de cenas por tipo por caso (say/choice/showEvidence/startChallenge);
- Detecção estrutural de corredor (grafo de rooms com largura máxima 1);
- Slots de ritual sem cena de consequência;
- Flags `requires` de tópicos apontando para flags inexistentes.

### 5.5 Acréscimos propostos a `REJECTED_PATTERNS.md`

- corredor de rituais (N rituais sem exploração entre eles);
- Protagonista recitando o procedimento do algoritmo;
- Narrador despejando a premissa completa na cena de abertura;
- mentor deduzindo o mistério em voz alta no lugar do jogador;
- pista opcional única com threshold 1 (mistério sem superfície investigável).

---

## 6. Decisões que preciso de você

1. "Capítulo 2" = Caso 02 mesmo?
2. Aprovando o diagnóstico, o próximo passo é **re-outline do Caso 02** (beat sheet novo: chegada, frentes paralelas, ledger de pistas, verbos rituais) antes de tocar em qualquer JSON — concorda?
3. Quais itens de §5 viram regra permanente? Os aprovados eu promovo via `vesper-feedback-consolidation` (accepted → canon/decisions).
4. Os 6 desafios: aprova a direção da tabela em §4, especialmente transformar #2 em Comparar e #6 em Cruzar?
