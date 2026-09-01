# Prompts-base para trabalhar com IA

Use estes prompts junto com os arquivos de documentação relevantes.

---

## 1. Reescrever uma cena sem destruir o canon

```text
Você está editando a campanha “A Mansão de Vesper”.

Antes de escrever, siga obrigatoriamente estas fontes de verdade:
- 01_DESIGN_BIBLE.md
- 02_NARRATIVE_BIBLE.md
- 03_UI_UX_BIBLE.md
- 04_RITUAL_PEDAGOGY.md

Tarefa: reescrever a cena [ID/NOME].

Objetivo dramático da cena:
[descrever]

Informação que o jogador JÁ sabe:
[listar]

Informação que pode ser revelada agora:
[listar]

Informação que NÃO pode ser revelada:
[listar]

Conceito pedagógico relacionado, se houver:
[conceito]

Regras:
- não adicionar tecnologia moderna;
- não criar perguntas de conversa antes de introduzir o assunto;
- Tomás é econômico, mas claro;
- narração observa, não interpreta;
- evitar exposição;
- se houver ritual, a situação deve tornar claro o que precisa ser obtido antes da UI abrir.

Entregue:
1. breve intenção da cena;
2. diálogo/narração final;
3. flags que a cena precisa criar;
4. tópicos de conversa que ela pode desbloquear.
```

---

## 2. Criar um ritual novo

```text
Crie um novo ritual para A Mansão de Vesper seguindo 04_RITUAL_PEDAGOGY.md.

Conceito de programação: [ex.: if/else]
Nível do aluno: [iniciante]
O que ele já aprendeu: [lista]
Local da história: [sala]
Objetivo narrativo da cena: [objetivo]

O ritual deve:
- existir por uma razão concreta na ficção;
- ensinar no máximo um conceito novo principal;
- ter contexto antes da tela de dados;
- possuir 3 níveis de ajuda de Tomás;
- gerar uma consequência narrativa em caso de sucesso;
- evitar termos internos da engine como seed;
- ser possível explicar em português antes de escrever código.

Entregue:
1. situação narrativa;
2. diálogo pré-ritual;
3. dados de exemplo;
4. regra lógica;
5. 3 dicas;
6. consequência de sucesso;
7. JSON sugerido para challenges.json.
```

---

## 3. Criar uma track para outro nível de alunos

```text
Use a mesma campanha e o mesmo mistério de A Mansão de Vesper, mas crie uma nova learning track.

Público: [idade / experiência]
Conteúdos principais: [ex.: if e else]
Conteúdos que NÃO devem ser exigidos: [ex.: arrays e loops]
Quantidade de rituais: [n]

Leia primeiro:
- 01_DESIGN_BIBLE.md
- 02_NARRATIVE_BIBLE.md
- 04_RITUAL_PEDAGOGY.md

Não reescreva a campanha inteira. Preserve personagens, ambientes e mistério sempre que possível. Substitua apenas os rituais e os pequenos trechos de diálogo necessários para justificá-los.

Entregue:
- progressão pedagógica;
- ritual por ritual;
- quais cenas precisam de variação;
- quais arquivos JSON seriam alterados.
```

---

## 4. Revisar uma cena por qualidade

```text
Revise o trecho abaixo como editor de narrativa e game design da Mansão de Vesper.

Avalie separadamente:
1. clareza do que está acontecendo;
2. exposição excessiva;
3. fala artificial;
4. pergunta/tópico que aparece sem contexto;
5. spoiler prematuro;
6. anacronismo;
7. coerência com Tomás, Lívia e protagonista;
8. clareza pedagógica se houver ritual;
9. se a consequência narrativa compensa a ação do jogador.

Depois proponha uma versão corrigida, preservando a intenção original.
```

---

## 5. Adicionar um NPC

```text
Quero adicionar um NPC à Mansão de Vesper.

Função na história: [função]
O que sabe: [lista]
O que esconde: [lista]
O que quer: [lista]
Quando aparece: [momento]

Siga 02_NARRATIVE_BIBLE.md.

Evite NPC que existe apenas para explicar lore. Dê a ele ao menos uma função de investigação, conflito, acesso, pista ou consequência.

Entregue:
- ficha curta;
- função dramática;
- tópicos iniciais de conversa;
- tópicos que são desbloqueados por flags;
- cenas que precisariam existir;
- JSON-base do personagem.
```
