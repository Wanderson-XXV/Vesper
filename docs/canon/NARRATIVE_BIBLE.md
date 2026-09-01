# Narrative Bible — Vesper

## 1. Setting

O jogo se passa em um **mundo de fantasia gótica inspirado no fim do século XIX / início do século XX**, sem compromisso com uma data histórica exata.

A estética é vitoriana/edwardiana, com tecnologia mecânica, analógica e ocultista.

### Permitido no mundo

- cartas e bilhetes;
- telegramas;
- cadernos;
- jornais;
- fotografia antiga;
- relógios de bolso e relógios de parede;
- iluminação a gás ou elétrica antiga;
- fonógrafos, cilindros ou gravadores mecânicos/ocultistas quando a história justificar;
- instrumentos ritualísticos com mostradores, ponteiros, chapas, inscrições e rolos de registro.

### Não permitido sem revisão explícita do canon

- celular;
- mensagem instantânea;
- computador como objeto cotidiano;
- tela digital moderna;
- internet;
- estética cyberpunk;
- carros modernos.

**Regra:** se um objeto moderno aparece por conveniência do roteiro, substituir por uma solução coerente com o setting.

Exemplo: “Theo mandou uma mensagem no celular” → “Lívia recebeu um telegrama / bilhete / recado entregue antes do desaparecimento”.

---

## 2. O sobrenatural e a programação

Os investigadores estudam anomalias através de **rituais formais**. Os rituais funcionam porque a realidade sobrenatural de Vesper responde a padrões, condições, repetições e relações entre registros.

Java, Python ou a variante declarada pela rota é a representação pedagógica dessa lógica para o aluno. Dentro da ficção, o personagem está formalizando um ritual.

Evitar mencionar termos técnicos modernos na fala de personagens quando não forem necessários.

Em vez de:
> “Aqui está um array de 18 valores.”

Preferir:
> “O leitor registrou dezoito marcas. Cada uma corresponde a um objeto.”

A tela do ritual pode então mostrar os dados de forma clara.

---

## 3. Caso 01 — verdade interna

### Premissa atual
Theo Vesper desapareceu após retornar à antiga mansão da família. A polícia realizou buscas comuns e não encontrou explicação.

Lívia Vesper procura ajuda especializada. O jogador é um investigador em campo acompanhado por Tomás Vale, um profissional mais experiente.

### Verdade que o jogador ainda não sabe

- Theo vinha investigando inconsistências arquitetônicas e padrões nos retratos.
- existe um espaço impossível entre setores da mansão;
- Tomás já esteve na casa em 2009;
- naquela investigação, Augusto Neri desapareceu;
- Theo está vivo no fim do Caso 01;
- há um segundo local relacionado ao fenômeno.

### O que o Caso 01 deve resolver

- encontrar Theo;
- comprovar que a anomalia arquitetônica existe;
- revelar que Tomás mentiu sobre seu passado na mansão;
- confirmar o desaparecimento de Augusto na investigação anterior.

### O que deve permanecer aberto

- a natureza exata de “Vesper”;
- o segundo local;
- a quarta figura da fotografia secreta;
- o significado de certos fenômenos recorrentes.

---

## 4. Personagens

### Jogador / protagonista

- nome escolhido pelo aluno;
- competente, mas ainda aprendendo a operar certos rituais;
- pode verbalizar dúvidas naturais para ajudar o jogador a formular problemas;
- nunca deve parecer incapaz só para que outro NPC explique tudo.

#### Função narrativa
Transformar pensamento do aluno em fala natural.

Exemplo:
> “Então eu não preciso saber qual objeto é qual. Só quantos passaram do limite.”

Isso confirma o objetivo lógico sem parecer um enunciado escolar.

---

### Tomás Vale

**Função:** parceiro de campo e mentor gradual.

Tomás é econômico, observador e profissional, mas **não deve ser cripticamente incompreensível**.

#### Regra de fala
Ele pode falar pouco, desde que a informação necessária esteja clara.

Ruim:
> “Sete pra cima. Saco preto.”

Bom:
> “O leitor mede o resíduo em cada objeto. Sete é o limite. Tudo que marcar sete ou mais vai para isolamento antes de tocarmos no restante.”

#### Curva pedagógica

- início: explica contexto e ajuda bastante;
- primeiros rituais: esclarece o problema, não o algoritmo;
- intermediário: ajuda apenas quando solicitado;
- final: não possui a resposta, apenas conhecimento de campo.

#### Sistema de dicas

1. **Dica conceitual:** reformula o problema.
2. **Dica estrutural:** aponta a ferramenta lógica.
3. **Dica quase operacional:** explica o próximo passo sem entregar o código completo.

---

### Lívia Vesper

- irmã de Theo;
- conhece a história familiar e os hábitos dele;
- não é especialista no sobrenatural;
- serve como fonte humana da casa, mas não como wiki.

As perguntas ao conversar com Lívia só devem aparecer depois que o assunto correspondente tiver sido estabelecido.

Exemplo: não mostrar “O que Theo estava investigando?” antes de o jogo indicar que Theo investigava algo.

---

### Theo Vesper

- desaparecido;
- não aparece visualmente no Arquivo no começo;
- só deve entrar na lista de pessoas após o jogador ver uma fotografia, retrato, documento ou descrição suficiente.

O jogador conhece Theo primeiro pelos rastros.

---

## 5. Regras de diálogo

### 5.1 Toda pergunta precisa ter contexto
Perguntas não podem aparecer do nada apenas porque existe um tópico no JSON.

Cada tópico deve possuir `requires` ligado a uma flag narrativa.

### 5.2 Perguntas são frases reais
Evitar labels como:
- “Mansão”
- “Theo”
- “Rituais”

Preferir:
- “Você já esteve nesta casa antes?”
- “O que Theo fazia aqui?”
- “Como você sabe quando um ritual respondeu?”

### 5.3 Mostrar, não resumir
Não fazer NPC explicar uma contradição que o jogador pode descobrir.

### 5.4 Narração observa, não interpreta

Ruim:
> “A sala parece esconder um segredo importante.”

Bom:
> “A poeira para a poucos centímetros da parede, como se algo ali tivesse sido movido recentemente.”

### 5.5 Falas curtas precisam estar apoiadas por contexto
Uma fala de uma palavra pode ser ótima depois que o jogador sabe a pergunta. Antes disso, parece erro de roteiro.

---

## 6. Introdução oficial — estrutura

A abertura deve ensinar sem parecer tutorial:

1. menu sem spoiler;
2. escolha do nome;
3. chegada à mansão por meio coerente com o setting;
4. apresentação de Lívia;
5. apresentação de Tomás;
6. relato do desaparecimento de Theo;
7. explicação breve de por que investigadores especializados foram chamados;
8. primeiro bloqueio no portão;
9. Ritual 0 extremamente simples;
10. portão abre;
11. entrada na casa;
12. primeira investigação interna.

O primeiro ritual existe para ensinar o **loop do jogo**, não para testar dificuldade.

---

## 7. Caso 02 — O Observatório das Nove Luzes

### Premissa

O Observatório de Santa Avelina foi interditado depois do desaparecimento do astrônomo responsável. Três noites depois, a cúpula volta a girar sem operador ou fonte de energia ativa.

### Verdade interna

- a cúpula acompanha uma correspondência remota, não um astro;
- a nona luz é a imagem de uma janela vista a partir de outro espaço impossível;
- alguém removeu e recategorizou registros conhecendo o método do observatório;
- o astrônomo percebeu a natureza da luz e escondeu uma placa de teste;
- a origem da janela e o destino do astrônomo permanecem abertos.

### Resolução e ramificação

O jogador interrompe o alinhamento e decide preservar ou destruir a placa final. A decisão altera relatório e relação com Tomás, mas ambas preservam o fato canônico: a correspondência existiu e a cúpula foi contida. Encontrar a placa opcional acrescenta uma silhueta à revelação final.
