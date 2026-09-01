# Authoring Workflow

## Fluxo recomendado por tipo de trabalho

### Revisar diálogo
1. use `vesper-narrative`;
2. leia cena anterior, alvo e posterior;
3. leia flags/tópicos envolvidos;
4. faça diagnóstico antes de reescrever mudanças grandes;
5. altere conteúdo, não engine;
6. rode validação;
7. faça `vesper-content-review`.

### Criar track
1. use `vesper-ritual-design`;
2. defina pré-requisitos e progressão em `docs/pedagogy/`;
3. mapeie os slots em `tracks.json`;
4. crie cenas específicas quando a natureza dos dados muda;
5. teste sem quebrar a track existente;
6. revisão narrativa depois da estrutura pedagógica.

### Criar novo capítulo
1. use `vesper-chapter-authoring`;
2. defina pergunta central, resposta do capítulo e gancho;
3. defina evidências obrigatórias/opcionais;
4. defina NPCs e locais;
5. reserve slots de rito;
6. só depois implemente cenas/JSON.

### Criar novo caso multicase

1. preencha `docs/authoring/portable/CASE_BRIEF.template.md`;
2. defina público, duração, conceitos e linguagens;
3. separe beats compartilhados de cenas específicas por rota;
4. preencha um contrato para cada ritual;
5. crie pacote isolado em `content/cases/<caseId>/` com IDs prefixados;
6. valide todos os slots, escolhas e finais antes de adicionar ao catálogo;
7. faça playtest por rota e viewport;
8. registre decisões de canon e feedback reutilizável.

### Trabalhar com outra IA

Entregue o kit `docs/authoring/portable/` e apenas os documentos canônicos/rotas relevantes. Exija o formato de `DELIVERY_CONTRACT.md`. Saída externa entra como rascunho isolado e nunca substitui conteúdo jogável antes da validação.

### Feedback do usuário
1. registrar o feedback específico;
2. separar correção local de regra geral;
3. se geral, usar `vesper-feedback-consolidation`;
4. promover para `feedback/accepted`, canon ou decisão;
5. não alterar regra permanente silenciosamente.

## Handoffs sugeridos

- Director -> Narrative -> Reviewer para roteiro;
- Director -> Pedagogy -> Narrative -> Implementer -> Reviewer para track;
- Director -> Art Director -> Implementer -> Reviewer para UI;
- usuário sempre aprova mudanças de canon relevantes.
