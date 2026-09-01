# Design Bible — Vesper

## 1. Visão do produto

**Vesper** é uma antologia de visual novels investigativas com exploração por menus, enigmas, documentos, NPCs e desafios de programação chamados **rituais**. **A Mansão de Vesper** é o Caso 01 desse universo.

O jogador assume o papel de um investigador capaz de interpretar padrões sobrenaturais através de regras formais. No mundo do jogo, essa prática é tratada como ritualística; fora do jogo, o aluno escreve e executa código na linguagem declarada pela rota.

### Composição do conteúdo

`universo → caso → rota curricular → variante de linguagem`

- o caso define mistério, locais, pistas, escolhas e consequências;
- a rota define a progressão dos rituais e cenas que apresentam dados diferentes;
- a variante fornece sintaxe, exemplo e template sem duplicar o caso;
- o perfil do investigador atravessa casos; flags e saves narrativos são namespaced por caso.

A experiência deve parecer primeiro uma aventura de investigação e, só depois, uma atividade pedagógica.

### Loop principal

`Explorar → observar → conversar → formular o problema → realizar ritual → obter informação → usar a informação no mundo → receber consequência narrativa`

A consequência narrativa é obrigatória. Um ritual nunca deve terminar apenas com “Correto”.

---

## 2. Pilares

### 2.1 Investigação antes de explicação
O jogador deve descobrir relações entre pistas, diálogos e ambiente. NPCs não despejam lore que pode ser inferido.

### 2.2 Programação como ferramenta do mundo
O código serve para resolver problemas que existem na ficção: contar selos, separar objetos contaminados, reconstruir padrões, comparar leituras, identificar estabilidade etc.

### 2.3 Progressão pedagógica controlada
O jogador pode ter liberdade para explorar, mas os rituais devem formar uma escada clara de dificuldade.

### 2.4 Terror por estranheza
A atmosfera nasce de contradições, sons, documentos, mudanças discretas, pessoas que sabem demais e ambientes que não se comportam como deveriam.

Evitar depender de jumpscare ou exposição explícita de criatura.

### 2.5 Recompensa narrativa
Quem investiga mais deve descobrir mais: diálogos opcionais, documentos, cenas secretas e pistas extras.

---

## 3. Referência visual

A principal referência de linguagem de interface é **No, I’m Not a Human** — não para copiar elementos ou assets, mas para preservar princípios:

- personagem grande e presente na cena;
- fundo dominante;
- interface escura e simples;
- caixa de diálogo direta;
- evidências ampliadas em overlay;
- sensação de imagem suja/analógica;
- poucos elementos permanentes de HUD;
- menus que parecem parte da experiência, não de um dashboard web.

### O que NÃO queremos

- UI de SaaS/dashboard;
- HUD cheia de indicadores;
- estética cyberpunk;
- bordas em toda caixa apenas porque é “UI”;
- ícones de videogame em excesso;
- linguagem escolar explícita em cenas narrativas;
- “Exercício 2 desbloqueado”.

---

## 4. Estrutura de jogo

### Estados principais da interface

1. **Cena narrativa** — diálogo/narração com caixa fixa.
2. **Exploração** — lista curta de ações e acessos do ambiente.
3. **Conversa** — retrato do NPC + perguntas disponíveis.
4. **Evidência** — documento/foto/objeto ampliado.
5. **Ritual** — problema e dados a serem trabalhados.
6. **Inventário** — arquivo, Grimório e itens.
7. **Grimório** — consulta pedagógica em linguagem de livro/caderno antigo.

Cada estado pode ter linguagem própria, mas a experiência deve continuar pertencendo ao mesmo jogo.

---

## 5. Liberdade do jogador

A exploração pode oferecer escolhas opcionais, mas a rota pedagógica deve ser legível.

Não usar “objetivo” como HUD permanente durante cenas. Direção deve vir principalmente por:

- diálogo;
- consequência de uma pista;
- acesso que se abre;
- anotação no caderno/inventário.

Se um aluno ficar completamente perdido, o **Arquivo/Caderno do Caso** pode registrar o próximo passo em linguagem natural.

---

## 6. Regra de ouro para novas features

Antes de implementar qualquer recurso, perguntar:

1. Isso ajuda investigação, narrativa ou aprendizagem?
2. O aluno percebe esse benefício?
3. Dá para fazer com menos sistema?

Se a resposta for “não”, não entra no MVP.
