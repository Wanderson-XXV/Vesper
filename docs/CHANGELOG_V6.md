# Changelog — MVP V6

A V6 consolida as correções definidas no Authoring Pack e prepara o projeto para a criação externa da track de `if / else`.

## Implementado

### Exterior com estado visual
- Novo background `assets/rooms/exterior_closed.png` antes do Ritual 0.
- O mesmo local passa para o background do portão aberto após a solução.
- A troca é feita com fade; não existe uma segunda sala artificial.
- `rooms.json` agora suporta `backgroundStates`.

### Ritual 0
- Removida a fala metalinguística “é simples/fácil de propósito”.
- Selos, leitura `0/1`, função da trava e objetivo do rito agora são contextualizados no mundo.
- Protagonista reformula a tarefa antes da HUD.
- Resultado provoca rito + destravamento + transição visual do portão.

### Ritual 1
- Contexto reforçado: prato de cobre, resíduo ritual, risco de contaminação e motivo do isolamento.
- Removida linguagem excessivamente “de estrutura de código” da fala de Tomás.

### Arquivo de Campo
- Evidências obtidas via documento guardam uma representação reabrível do original.
- Evidências reabríveis mostram “ABRIR ORIGINAL”.
- Abrir um documento pelo arquivo não dispara flags ou progresso novamente.

### Perfis de personagens
- Pessoas conhecidas são clicáveis no Inventário e Arquivo.
- Perfil mostra somente informações conhecidas pelo jogador.
- Perfil suporta papel, primeira impressão, fatos conhecidos e evidências relacionadas.
- Theo continua oculto até ser descoberto na narrativa.

### Retratos
- Removido o fundo visual dos frames de personagem.
- Sprites passam a se integrar diretamente ao cenário, maiores e mais próximos da referência de composição de `No, I'm Not a Human`.

### Grimório
- Navegação de retorno/fechamento passou a fazer parte das próprias páginas.
- Adicionadas notas da protagonista e dicas opcionais de Tomás.
- Conteúdo base ampliado com `Variáveis e contadores` e `Comparações`.
- Entradas existentes foram detalhadas.

### Áudio
- Mantidos controles separados de Volume Geral, Música e Efeitos Sonoros.
- Fórmula permanece `master × categoria`.

### Arquitetura de learning tracks
- Rituais das salas agora podem apontar para `sceneSlot` em vez de uma cena fixa.
- `arrays_beginner` mapeia os slots para as cenas existentes.
- `conditionals_beginner` fica pronta para receber cenas específicas sem alterar a rota de arrays.
- É possível testar uma track por query string: `?track=conditionals_beginner`.

### Authoring Pack
- O pacote de autoria v1.2 está incluído em `docs/authoring/`.
- `AGENT_IF_ELSE_PROMPT.md` foi adicionado na raiz e no pacote de autoria.
